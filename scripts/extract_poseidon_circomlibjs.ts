// Constants extraction for Poseidon (BN254 scalar field) from circomlibjs.
//
// Strategy:
//   1. Recursively scan the installed circomlibjs package for any JSON file
//      that looks like a Poseidon constants table (has C / M / P / S keys).
//   2. For each candidate, normalize for t = 3 and t = 4 (canonicalize sign,
//      expand packed sparse rows to full t x t matrices).
//   3. Run a TS reimplementation of the optimized Poseidon round schedule
//      against the candidate constants and cross-check it against
//      circomlibjs.buildPoseidon() on 36+ test cases. The first candidate
//      that passes every cross-check is selected.
//   4. Emit:
//        generated/poseidon_constants.json  (decimal + LE32 hex)
//        generated/poseidon_vectors.json    (>=36 vectors, decimal + LE32 hex)
//        generated/poseidon_constants.move.inc
//        generated/poseidon_vectors.move.inc
//
// If no candidate passes the cross-check, the script aborts. Do NOT manually
// paste constants — fix this script first.

import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const FIELD_ORDER =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

const RF = 8;
const RP_BY_T: Record<number, number> = { 3: 57, 4: 56 };

type BI = bigint;

type ConstantsForT = {
  t: number;
  rf: number;
  rp: number;
  C: BI[];
  M: BI[][];
  P: BI[][];
  S_packed: BI[][];
  S_full: BI[][][];
};

function mod(x: BI): BI {
  const y = x % FIELD_ORDER;
  return y >= 0n ? y : y + FIELD_ORDER;
}

function add(a: BI, b: BI): BI {
  return mod(a + b);
}

function mul(a: BI, b: BI): BI {
  return mod(a * b);
}

function pow5(x: BI): BI {
  const x2 = mul(x, x);
  const x4 = mul(x2, x2);
  return mul(x4, x);
}

function toBigInt(x: any): BI {
  if (typeof x === "bigint") return mod(x);
  if (typeof x === "number") return mod(BigInt(x));
  if (typeof x === "string") {
    if (x.startsWith("0x") || x.startsWith("0X")) return mod(BigInt(x));
    return mod(BigInt(x));
  }
  if (x && typeof x === "object" && Array.isArray(x)) {
    throw new Error("toBigInt got array; deepToBigInt should be used");
  }
  throw new Error(`Cannot convert value to BigInt: ${JSON.stringify(x)}`);
}

function deepToBigInt(x: any): any {
  if (Array.isArray(x)) return x.map(deepToBigInt);
  return toBigInt(x);
}

function le32(x: BI): string {
  let v = mod(x);
  const bytes: number[] = [];
  for (let i = 0; i < 32; i++) {
    bytes.push(Number(v & 0xffn));
    v >>= 8n;
  }
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function provenance(generator: string, regenerateWith: string, circomlibjsVersion: string) {
  return {
    generator,
    circomlibjs_version: circomlibjsVersion,
    generated_at: new Date().toISOString(),
    regenerate_with: regenerateWith,
  };
}

function normalizeSourceFile(sourceFile: string): string {
  return sourceFile.replace(/^.*node_modules\//, "node_modules/");
}

function dec(x: BI): string {
  return mod(x).toString(10);
}

function matVecMul(M: BI[][], state: BI[]): BI[] {
  const t = state.length;
  const out = new Array<BI>(t).fill(0n);
  for (let i = 0; i < t; i++) {
    let acc = 0n;
    for (let j = 0; j < t; j++) {
      acc = add(acc, mul(M[i][j], state[j]));
    }
    out[i] = acc;
  }
  return out;
}

// Circomlib sparse-matrix packed representation:
//   packed.length === 2*t - 1
//   packed[0..t)        => first row of M
//   packed[t..2*t-1)    => first-column entries for rows 1..t-1
//   bottom-right (t-1) x (t-1) submatrix is identity.
function sparsePackedToFull(packed: BI[], t: number): BI[][] {
  if (packed.length !== 2 * t - 1) {
    throw new Error(
      `Sparse packed length mismatch: got ${packed.length}, expected ${2 * t - 1}`,
    );
  }
  const M: BI[][] = [];
  for (let i = 0; i < t; i++) M.push(new Array<BI>(t).fill(0n));
  for (let j = 0; j < t; j++) M[0][j] = packed[j];
  for (let i = 1; i < t; i++) M[i][0] = packed[t + i - 1];
  for (let i = 1; i < t; i++) M[i][i] = 1n;
  return M;
}

function addRoundConstantsFull(
  state: BI[],
  C: BI[],
  idx: { value: number },
): BI[] {
  const out = state.slice();
  for (let i = 0; i < out.length; i++) {
    out[i] = add(out[i], C[idx.value++]);
  }
  return out;
}

function addRoundConstantPartial(
  state: BI[],
  C: BI[],
  idx: { value: number },
): BI[] {
  const out = state.slice();
  out[0] = add(out[0], C[idx.value++]);
  return out;
}

function sboxFull(state: BI[]): BI[] {
  return state.map(pow5);
}

function sboxPartial(state: BI[]): BI[] {
  const out = state.slice();
  out[0] = pow5(out[0]);
  return out;
}

// Reproduces circomlibjs/src/poseidon_opt.js exactly.
// Schedule:
//   state[i] += C[i]                        (t constants)
//   for r in 0..RF/2 - 1:
//       state = pow5(state); state += C[(r+1)*t + i]; state = M * state
//   state = pow5(state); state += C[RF/2 * t + i]; state = P * state
//   for r in 0..RP:
//       state[0] = pow5(state[0]); state[0] += C[(RF/2+1)*t + r]; sparse-mix
//   for r in 0..RF/2 - 1:
//       state = pow5(state); state += C[(RF/2+1)*t + RP + r*t + i]; state = M * state
//   state = pow5(state); state = M * state    (no constant add at the end)
// Total |C| = RF*t + RP.
function poseidonOptimized(inputs: BI[], k: ConstantsForT): BI {
  const t = inputs.length + 1;
  if (t !== k.t) {
    throw new Error(`Wrong width: inputs imply t=${t}, constants are t=${k.t}`);
  }
  const C = k.C;
  const M = k.M;
  const P = k.P;
  const S_full = k.S_full;
  const nRoundsF = RF;
  const nRoundsP = k.rp;

  let state: BI[] = [0n, ...inputs.map(mod)];

  // Initial constant add: state[i] += C[i].
  state = state.map((a, i) => add(a, C[i]));

  // First half (RF/2 - 1) full rounds.
  for (let r = 0; r < nRoundsF / 2 - 1; r++) {
    state = state.map(pow5);
    state = state.map((a, i) => add(a, C[(r + 1) * t + i]));
    state = matVecMul(M, state);
  }

  // Pre-sparse bridge: pow5, add C[RF/2 * t + i], mix by P.
  state = state.map(pow5);
  state = state.map((a, i) => add(a, C[(nRoundsF / 2 - 1 + 1) * t + i]));
  state = matVecMul(P, state);

  // RP partial rounds.
  for (let r = 0; r < nRoundsP; r++) {
    state[0] = pow5(state[0]);
    state[0] = add(state[0], C[(nRoundsF / 2 + 1) * t + r]);
    // Sparse mix using S_full[r].
    state = matVecMul(S_full[r], state);
  }

  // Second half (RF/2 - 1) full rounds.
  for (let r = 0; r < nRoundsF / 2 - 1; r++) {
    state = state.map(pow5);
    state = state.map((a, i) =>
      add(a, C[(nRoundsF / 2 + 1) * t + nRoundsP + r * t + i]),
    );
    state = matVecMul(M, state);
  }

  // Final: pow5 + M-mix, no constant add.
  state = state.map(pow5);
  state = matVecMul(M, state);

  return mod(state[0]);
}

function recursiveFindJsonFiles(dir: string): string[] {
  const out: string[] = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === ".git") continue;
      out.push(...recursiveFindJsonFiles(p));
    } else if (ent.isFile() && ent.name.endsWith(".json")) {
      out.push(p);
    }
  }
  return out;
}

function looksLikeConstants(obj: any): boolean {
  return (
    obj &&
    typeof obj === "object" &&
    "C" in obj &&
    "M" in obj &&
    "P" in obj &&
    "S" in obj
  );
}

function pickForT(root: any, key: string, t: number): any {
  const v = root[key];
  if (!Array.isArray(v)) {
    if (v && v[String(t)] !== undefined) return v[String(t)];
    if (v && v[t] !== undefined) return v[t];
    throw new Error(`Cannot pick ${key} for t=${t}`);
  }
  // Common circomlib indexing: arr[t-2] gives constants for width t.
  const candidates: any[] = [];
  if (v[t - 2] !== undefined) candidates.push(v[t - 2]);
  if (v[t] !== undefined) candidates.push(v[t]);
  if (v[t - 1] !== undefined) candidates.push(v[t - 1]);
  for (const c of candidates) {
    if (c !== undefined && Array.isArray(c)) return c;
  }
  throw new Error(`Cannot pick ${key} for t=${t}; candidate shapes unavailable`);
}

// circomlibjs stores M and P in transposed form: src/poseidon_opt.js indexes
// M[j][i] in the inner mat-vec, so the entry at "row i, col j" of the actual
// dense matrix lives at M[j][i] in JSON. Transpose into standard layout so
// our matVecMul (which reads M[i][j]) computes the right product.
function transpose(M: BI[][]): BI[][] {
  const t = M.length;
  const out: BI[][] = [];
  for (let i = 0; i < t; i++) {
    out.push(new Array<BI>(t).fill(0n));
  }
  for (let i = 0; i < t; i++) {
    for (let j = 0; j < t; j++) {
      out[i][j] = M[j][i];
    }
  }
  return out;
}

function normalizeConstants(root: any, t: number): ConstantsForT {
  const rp = RP_BY_T[t];
  const rawC = pickForT(root, "C", t);
  const C = (deepToBigInt(rawC) as any[]).flat(Infinity) as BI[];
  const Mraw = deepToBigInt(pickForT(root, "M", t)) as BI[][];
  const Praw = deepToBigInt(pickForT(root, "P", t)) as BI[][];
  const M = transpose(Mraw);
  const P = transpose(Praw);
  const S_packed = deepToBigInt(pickForT(root, "S", t)) as any;

  if (M.length !== t || M.some((row) => row.length !== t)) {
    throw new Error(`M shape mismatch for t=${t}`);
  }
  if (P.length !== t || P.some((row) => row.length !== t)) {
    throw new Error(`P shape mismatch for t=${t}`);
  }

  // Some circomlib versions store S as a flat array of length rp*(2*t-1)
  // rather than as rp rows; handle both.
  let S_packed2: BI[][];
  if (Array.isArray(S_packed) && S_packed.length === rp && Array.isArray(S_packed[0])) {
    S_packed2 = S_packed as BI[][];
  } else if (Array.isArray(S_packed) && S_packed.length === rp * (2 * t - 1)) {
    const stride = 2 * t - 1;
    S_packed2 = [];
    for (let r = 0; r < rp; r++) {
      S_packed2.push((S_packed as BI[]).slice(r * stride, (r + 1) * stride));
    }
  } else {
    const flat = (S_packed as any[]).flat(Infinity) as BI[];
    if (flat.length !== rp * (2 * t - 1)) {
      throw new Error(
        `S total length mismatch for t=${t}: got ${flat.length}, expected ${
          rp * (2 * t - 1)
        }`,
      );
    }
    const stride = 2 * t - 1;
    S_packed2 = [];
    for (let r = 0; r < rp; r++) {
      S_packed2.push(flat.slice(r * stride, (r + 1) * stride));
    }
  }

  // Optimized circomlibjs schedule: C length = RF*t + RP.
  const expectedC = RF * t + rp;
  if (C.length !== expectedC) {
    throw new Error(
      `C length mismatch for t=${t}: got ${C.length}, expected ${expectedC}`,
    );
  }

  const S_full = S_packed2.map((s) => sparsePackedToFull(s, t));
  return { t, rf: RF, rp, C, M, P, S_packed: S_packed2, S_full };
}

async function loadOfficialPoseidon() {
  const circomlibjs = await import("circomlibjs");
  if (typeof (circomlibjs as any).buildPoseidon !== "function") {
    throw new Error("circomlibjs.buildPoseidon not found");
  }
  const poseidon = await (circomlibjs as any).buildPoseidon();
  const F = poseidon.F;
  return {
    hash(inputs: BI[]): BI {
      const y = poseidon(inputs.map((x) => mod(x)));
      // F.toObject returns canonical BigInt (not Montgomery limbs).
      return mod(BigInt(F.toObject(y)));
    },
  };
}

function deterministicRandoms(count: number): BI[] {
  let x = 0x123456789abcdefn;
  const out: BI[] = [];
  for (let i = 0; i < count; i++) {
    x = mod(x * 6364136223846793005n + 1442695040888963407n);
    out.push(x);
  }
  return out;
}

function buildVectorInputs(): { arity: 2 | 3; inputs: BI[] }[] {
  const r1 = FIELD_ORDER - 1n;
  const rnd = deterministicRandoms(60);
  const cases: { arity: 2 | 3; inputs: BI[] }[] = [];

  // 7 fixed + 10 random = 17 arity-2 vectors.
  const h2: BI[][] = [
    [0n, 0n],
    [1n, 0n],
    [0n, 1n],
    [1n, 1n],
    [r1, 0n],
    [0n, r1],
    [r1, r1],
  ];
  for (let i = 0; i < 10; i++) h2.push([rnd[2 * i], rnd[2 * i + 1]]);

  // 9 fixed + 10 random = 19 arity-3 vectors.
  const h3: BI[][] = [
    [0n, 0n, 0n],
    [1n, 0n, 0n],
    [0n, 1n, 0n],
    [0n, 0n, 1n],
    [1n, 1n, 1n],
    [r1, 0n, 0n],
    [0n, r1, 0n],
    [0n, 0n, r1],
    [r1, r1, r1],
  ];
  for (let i = 0; i < 10; i++) {
    h3.push([rnd[20 + 3 * i], rnd[20 + 3 * i + 1], rnd[20 + 3 * i + 2]]);
  }

  for (const inputs of h2) cases.push({ arity: 2, inputs });
  for (const inputs of h3) cases.push({ arity: 3, inputs });
  return cases;
}

function moveVecU8(hex: string): string {
  return `x"${hex}"`;
}

function emitMoveConstantsInc(k3: ConstantsForT, k4: ConstantsForT): string {
  function emitVec(name: string, xs: BI[]): string {
    return `    public(friend) fun ${name}(): vector<vector<u8>> {\n        vector[\n${xs
      .map((x) => `            ${moveVecU8(le32(x))}`)
      .join(",\n")}\n        ]\n    }\n`;
  }
  function emitMat(name: string, M: BI[][]): string {
    return `    public(friend) fun ${name}(): vector<vector<u8>> {\n        vector[\n${M.flat()
      .map((x) => `            ${moveVecU8(le32(x))}`)
      .join(",\n")}\n        ]\n    }\n`;
  }
  function emitSparse(name: string, S: BI[][][]): string {
    return `    public(friend) fun ${name}(): vector<vector<u8>> {\n        vector[\n${S.flat(2)
      .map((x) => `            ${moveVecU8(le32(x))}`)
      .join(",\n")}\n        ]\n    }\n`;
  }
  return `// Auto-generated by scripts/extract_poseidon_circomlibjs.ts.
// DO NOT EDIT BY HAND.
// Encoding: 32-byte little-endian (FormatFrLsb).
// To regenerate: npx ts-node --esm scripts/extract_poseidon_circomlibjs.ts

${emitVec("c_t3", k3.C)}
${emitMat("m_t3", k3.M)}
${emitMat("p_t3", k3.P)}
${emitSparse("s_full_t3", k3.S_full)}

${emitVec("c_t4", k4.C)}
${emitMat("m_t4", k4.M)}
${emitMat("p_t4", k4.P)}
${emitSparse("s_full_t4", k4.S_full)}
`;
}

function emitMoveConstantsModule(body: string): string {
  return `// Auto-generated. DO NOT EDIT BY HAND.
// To regenerate: npx ts-node --esm scripts/extract_poseidon_circomlibjs.ts
//
// Container module for Poseidon BN254 constants extracted from
// circomlibjs@0.1.7's poseidon_constants_opt.json. All elements are
// 32-byte little-endian (FormatFrLsb) field elements canonicalized into [0, r).
//
// Storage convention:
//   c_*       : flat vector of round constants, length RF*t + RP.
//   m_*, p_*  : t*t row-major matrices (transposed from circomlibjs's M[j][i]
//               storage so that out[i] = sum_j M[i*t+j] * state[j]).
//   s_full_*  : RP * t * t dense expansion of circomlibjs's packed (2t-1)-row
//               sparse matrices; bottom-right (t-1)x(t-1) is identity.
module poseidon_aptos::poseidon_constants {
    friend poseidon_aptos::poseidon_bn254;
    #[test_only]
    friend poseidon_aptos::poseidon_bn254_tests;

${body}
}
`;
}

function emitMoveVectorsInc(vectors: any[]): string {
  const h2 = vectors.filter((v) => v.arity === 2);
  const h3 = vectors.filter((v) => v.arity === 3);
  const lines2 = h2.map((v) => {
    const a = moveVecU8(v.inputs_le_hex[0]);
    const b = moveVecU8(v.inputs_le_hex[1]);
    const e = moveVecU8(v.expected_le_hex);
    return `            TestCase2 { a: ${a}, b: ${b}, expected: ${e} }`;
  });
  const lines3 = h3.map((v) => {
    const a = moveVecU8(v.inputs_le_hex[0]);
    const b = moveVecU8(v.inputs_le_hex[1]);
    const c = moveVecU8(v.inputs_le_hex[2]);
    const e = moveVecU8(v.expected_le_hex);
    return `            TestCase3 { a: ${a}, b: ${b}, c: ${c}, expected: ${e} }`;
  });
  return `// Auto-generated test vector literals (DO NOT EDIT BY HAND).
// To regenerate: npx ts-node --esm scripts/extract_poseidon_circomlibjs.ts

    struct TestCase2 has copy, drop, store {
        a: vector<u8>,
        b: vector<u8>,
        expected: vector<u8>,
    }

    struct TestCase3 has copy, drop, store {
        a: vector<u8>,
        b: vector<u8>,
        c: vector<u8>,
        expected: vector<u8>,
    }

    public(friend) fun poseidon_hash_2_vectors(): vector<TestCase2> {
        vector[
${lines2.join(",\n")}
        ]
    }

    public(friend) fun poseidon_hash_3_vectors(): vector<TestCase3> {
        vector[
${lines3.join(",\n")}
        ]
    }

    public(friend) fun tc2_unpack(c: &TestCase2): (vector<u8>, vector<u8>, vector<u8>) {
        (c.a, c.b, c.expected)
    }

    public(friend) fun tc3_unpack(c: &TestCase3): (vector<u8>, vector<u8>, vector<u8>, vector<u8>) {
        (c.a, c.b, c.c, c.expected)
    }
`;
}

async function main() {
  fs.mkdirSync("generated", { recursive: true });

  // require.resolve("circomlibjs/package.json") fails with ERR_PACKAGE_PATH_NOT_EXPORTED
  // because circomlibjs declares restrictive `exports`. Fall back to filesystem lookup.
  const pkgDir = path.resolve("node_modules", "circomlibjs");
  const pkgPath = path.join(pkgDir, "package.json");
  const pkgVersion = JSON.parse(fs.readFileSync(pkgPath, "utf8")).version;
  console.log(`circomlibjs package: ${pkgDir} (version ${pkgVersion})`);

  const jsonFiles = recursiveFindJsonFiles(pkgDir);
  const candidates: { file: string; root: any }[] = [];
  for (const f of jsonFiles) {
    try {
      const obj = JSON.parse(fs.readFileSync(f, "utf8"));
      if (looksLikeConstants(obj)) candidates.push({ file: f, root: obj });
    } catch (_) {
      // ignore unreadable / non-JSON
    }
  }
  console.log(`Found ${candidates.length} candidate constants files.`);

  const official = await loadOfficialPoseidon();
  const checks = buildVectorInputs();
  let chosen: { file: string; k3: ConstantsForT; k4: ConstantsForT } | null = null;

  for (const cand of candidates) {
    try {
      const k3 = normalizeConstants(cand.root, 3);
      const k4 = normalizeConstants(cand.root, 4);
      for (const c of checks) {
        const k = c.arity === 2 ? k3 : k4;
        const got = poseidonOptimized(c.inputs, k);
        const exp = official.hash(c.inputs);
        if (got !== exp) {
          throw new Error(
            `cross-check mismatch arity=${c.arity} inputs=${c.inputs
              .map(dec)
              .join(",")}: got=${dec(got)} exp=${dec(exp)}`,
          );
        }
      }
      chosen = { file: cand.file, k3, k4 };
      break;
    } catch (e: any) {
      console.warn(`Rejected candidate ${cand.file}: ${e.message}`);
    }
  }

  if (!chosen) {
    // No JSON-stored candidates. circomlibjs >= 0.1.0 derives constants in JS,
    // so fall back to introspecting the live poseidon object.
    console.log(
      "No JSON candidates passed. Falling back to live circomlibjs introspection.",
    );
    const circomlibjs = await import("circomlibjs");
    const poseidonOpt = (circomlibjs as any).poseidon;
    // Inspect poseidon C / S / M / P module-level exports, if present.
    const root = (circomlibjs as any).poseidon_constants ??
      (circomlibjs as any).poseidonConstants ??
      undefined;
    if (root) {
      try {
        const k3 = normalizeConstants(root, 3);
        const k4 = normalizeConstants(root, 4);
        for (const c of checks) {
          const k = c.arity === 2 ? k3 : k4;
          const got = poseidonOptimized(c.inputs, k);
          const exp = official.hash(c.inputs);
          if (got !== exp) {
            throw new Error("cross-check mismatch in fallback");
          }
        }
        chosen = { file: "<live circomlibjs export>", k3, k4 };
      } catch (e: any) {
        console.warn(`Live introspection rejected: ${e.message}`);
      }
    }
  }

  if (!chosen) {
    // Final fallback: build an in-process Poseidon table by extracting from
    // poseidon_constants_opt's C / S / M / P that circomlibjs computes at
    // module load. circomlibjs 0.1.7 exposes opt constants via the
    // unbundlePoseidon helper; if not available, regenerate with poseidon_gencontract.
    const cjs = await import("circomlibjs");
    const buildPoseidonOpt = (cjs as any).buildPoseidonOpt;
    const buildPoseidonReference = (cjs as any).buildPoseidonReference;
    if (typeof buildPoseidonOpt !== "function") {
      throw new Error(
        "Cannot locate circomlibjs Poseidon constants — neither JSON candidates, " +
          "exports.poseidon_constants, nor buildPoseidonOpt are available. " +
          "Update extraction script to match installed circomlibjs version.",
      );
    }
    const poseidonOpt = await buildPoseidonOpt();
    // The opt instance carries `C`, `S`, `M`, `P` as arrays-of-arrays in F-form;
    // convert to BigInt via F.toObject.
    const F = poseidonOpt.F;
    const toBI = (x: any): BI => mod(BigInt(F.toObject(x)));
    const toBIArray = (xs: any): BI[] => xs.map(toBI);
    const toBIMat = (m: any): BI[][] => m.map(toBIArray);
    const toBI3 = (s: any): BI[][] => s.map(toBIArray);

    function build(t: number): ConstantsForT {
      const rp = RP_BY_T[t];
      // circomlibjs's optimized object stores per-width constants in arrays
      // indexed [t-2].
      const C = toBIArray(poseidonOpt.C[t - 2]);
      const M = toBIMat(poseidonOpt.M[t - 2]);
      const P = toBIMat(poseidonOpt.P[t - 2]);
      const Sraw = poseidonOpt.S[t - 2];
      // S is stored as flat array of length rp * (2*t-1).
      const flat = toBIArray(Sraw);
      const stride = 2 * t - 1;
      const S_packed: BI[][] = [];
      for (let r = 0; r < rp; r++) {
        S_packed.push(flat.slice(r * stride, (r + 1) * stride));
      }
      const expectedC = RF * t + rp;
      if (C.length !== expectedC) {
        throw new Error(
          `C length mismatch for t=${t}: got ${C.length}, expected ${expectedC}`,
        );
      }
      if (M.length !== t || M.some((row) => row.length !== t)) {
        throw new Error(`M shape mismatch for t=${t}`);
      }
      if (P.length !== t || P.some((row) => row.length !== t)) {
        throw new Error(`P shape mismatch for t=${t}`);
      }
      const S_full = S_packed.map((s) => sparsePackedToFull(s, t));
      return { t, rf: RF, rp, C, M, P, S_packed, S_full };
    }

    const k3 = build(3);
    const k4 = build(4);

    for (const c of checks) {
      const k = c.arity === 2 ? k3 : k4;
      const got = poseidonOptimized(c.inputs, k);
      const exp = official.hash(c.inputs);
      if (got !== exp) {
        throw new Error(
          `Final cross-check mismatch: arity=${c.arity} inputs=${c.inputs
            .map(dec)
            .join(",")}: got=${dec(got)} exp=${dec(exp)}`,
        );
      }
    }
    chosen = { file: "<buildPoseidonOpt live>", k3, k4 };
  }

  if (!chosen) throw new Error("No constants candidate passed cross-check");

  console.log(`Using constants source: ${chosen.file}`);

  const constantsJson = {
    _provenance: provenance(
      "scripts/extract_poseidon_circomlibjs.ts",
      "npx ts-node --esm scripts/extract_poseidon_circomlibjs.ts",
      pkgVersion,
    ),
    source_file: normalizeSourceFile(chosen.file),
    circomlibjs_version: pkgVersion,
    field_order_dec: FIELD_ORDER.toString(10),
    field_order_le_hex: (() => {
      let v = FIELD_ORDER;
      const bytes: number[] = [];
      for (let i = 0; i < 32; i++) {
        bytes.push(Number(v & 0xffn));
        v >>= 8n;
      }
      return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
    })(),
    t3: {
      rf: chosen.k3.rf,
      rp: chosen.k3.rp,
      C_dec: chosen.k3.C.map(dec),
      C_le_hex: chosen.k3.C.map(le32),
      M_dec_flat: chosen.k3.M.flat().map(dec),
      M_le_hex_flat: chosen.k3.M.flat().map(le32),
      P_dec_flat: chosen.k3.P.flat().map(dec),
      P_le_hex_flat: chosen.k3.P.flat().map(le32),
      S_full_dec_flat: chosen.k3.S_full.flat(2).map(dec),
      S_full_le_hex_flat: chosen.k3.S_full.flat(2).map(le32),
    },
    t4: {
      rf: chosen.k4.rf,
      rp: chosen.k4.rp,
      C_dec: chosen.k4.C.map(dec),
      C_le_hex: chosen.k4.C.map(le32),
      M_dec_flat: chosen.k4.M.flat().map(dec),
      M_le_hex_flat: chosen.k4.M.flat().map(le32),
      P_dec_flat: chosen.k4.P.flat().map(dec),
      P_le_hex_flat: chosen.k4.P.flat().map(le32),
      S_full_dec_flat: chosen.k4.S_full.flat(2).map(dec),
      S_full_le_hex_flat: chosen.k4.S_full.flat(2).map(le32),
    },
  };

  const allInputs = buildVectorInputs();
  const vectors = allInputs.map((v, i) => {
    const expected = official.hash(v.inputs);
    const fromExtracted = poseidonOptimized(
      v.inputs,
      v.arity === 2 ? chosen!.k3 : chosen!.k4,
    );
    if (expected !== fromExtracted) {
      throw new Error(`Final vector mismatch index=${i}`);
    }
    return {
      index: i,
      arity: v.arity,
      t: v.arity + 1,
      inputs_dec: v.inputs.map(dec),
      inputs_le_hex: v.inputs.map(le32),
      expected_dec: dec(expected),
      expected_le_hex: le32(expected),
    };
  });

  fs.writeFileSync(
    "generated/poseidon_constants.json",
    JSON.stringify(constantsJson, null, 2),
  );
  fs.writeFileSync(
    "generated/poseidon_vectors.json",
    JSON.stringify(
      {
        _provenance: provenance(
          "scripts/extract_poseidon_circomlibjs.ts",
          "npx ts-node --esm scripts/extract_poseidon_circomlibjs.ts",
          pkgVersion,
        ),
        vectors,
      },
      null,
      2,
    ),
  );
  const constantsBody = emitMoveConstantsInc(chosen.k3, chosen.k4);
  const vectorsBody = emitMoveVectorsInc(vectors);
  fs.writeFileSync("generated/poseidon_constants.move.inc", constantsBody);
  fs.writeFileSync("generated/poseidon_vectors.move.inc", vectorsBody);

  // Emit the full Move modules so the constants are first-class .move files.
  // This is what `aptos move test` actually consumes; the .move.inc artifacts
  // exist for external review / diffing.
  fs.mkdirSync("sources", { recursive: true });
  fs.writeFileSync(
    "sources/poseidon_constants.move",
    emitMoveConstantsModule(constantsBody),
  );
  fs.writeFileSync(
    "sources/poseidon_test_vectors.move",
    `// Auto-generated. DO NOT EDIT BY HAND.
// To regenerate: npx ts-node --esm scripts/extract_poseidon_circomlibjs.ts
//
// Container module for Poseidon BN254 test vectors. The test cases are
// produced by scripts/extract_poseidon_circomlibjs.ts after a successful
// circomlibjs cross-check, so every entry here is guaranteed to match the
// reference implementation byte-for-byte.
#[test_only]
module poseidon_aptos::poseidon_test_vectors {
    friend poseidon_aptos::poseidon_bn254_tests;

${vectorsBody}}
`,
  );

  // Emit one #[test] per vector — Aptos's algebra context has a per-test
  // 1 MB memory limit, and 17/19 hashes share state in a single test which
  // overflows. Splitting gives each vector its own fresh context.
  const h2 = vectors.filter((v) => v.arity === 2);
  const h3 = vectors.filter((v) => v.arity === 3);
  const perVectorTests = [
    ...h2.map(
      (v, i) => `    #[test(fx = @std)]
    fun test_hash_2_v${String(i).padStart(2, "0")}(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_2(
            ${moveVecU8(v.inputs_le_hex[0])},
            ${moveVecU8(v.inputs_le_hex[1])}
        );
        let expected = ${moveVecU8(v.expected_le_hex)};
        assert!(got == expected, ${1000 + i});
    }`,
    ),
    ...h3.map(
      (v, i) => `    #[test(fx = @std)]
    fun test_hash_3_v${String(i).padStart(2, "0")}(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_3(
            ${moveVecU8(v.inputs_le_hex[0])},
            ${moveVecU8(v.inputs_le_hex[1])},
            ${moveVecU8(v.inputs_le_hex[2])}
        );
        let expected = ${moveVecU8(v.expected_le_hex)};
        assert!(got == expected, ${2000 + i});
    }`,
    ),
  ];
  fs.writeFileSync(
    "sources/poseidon_bn254_vector_tests.move",
    `// Auto-generated. DO NOT EDIT BY HAND.
// To regenerate: npx ts-node --esm scripts/extract_poseidon_circomlibjs.ts
//
// One #[test] per Poseidon vector. The Aptos crypto_algebra runtime keeps a
// per-transaction algebra context capped at 1 MiB; a single test that runs
// dozens of hashes back-to-back exhausts it, so we split here.
#[test_only]
module poseidon_aptos::poseidon_bn254_vector_tests {
    use aptos_std::crypto_algebra;
    use poseidon_aptos::poseidon_bn254;

${perVectorTests.join("\n\n")}
}
`,
  );

  const h2Count = vectors.filter((v) => v.arity === 2).length;
  const h3Count = vectors.filter((v) => v.arity === 3).length;
  console.log(
    `Generated ${vectors.length} test vectors (arity-2: ${h2Count}, arity-3: ${h3Count}).`,
  );
  console.log(
    `Constants: t=3 has C=${chosen.k3.C.length}, M=${chosen.k3.M.flat().length}, P=${chosen.k3.P.flat().length}, S_full=${chosen.k3.S_full.flat(2).length} field elements.`,
  );
  console.log(
    `Constants: t=4 has C=${chosen.k4.C.length}, M=${chosen.k4.M.flat().length}, P=${chosen.k4.P.flat().length}, S_full=${chosen.k4.S_full.flat(2).length} field elements.`,
  );
  console.log("All cross-checks passed.");
}

main().catch((e) => {
  console.error("EXTRACTION FAILED:", e);
  process.exit(1);
});
