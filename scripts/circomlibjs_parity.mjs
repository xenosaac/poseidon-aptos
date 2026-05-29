#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { buildPoseidon } = require("circomlibjs");

function leHexToBigInt(hex) {
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(`expected 32-byte LE hex, got ${hex}`);
  }
  let n = 0n;
  for (let i = 31; i >= 0; i -= 1) {
    n = (n << 8n) | BigInt(parseInt(hex.slice(i * 2, i * 2 + 2), 16));
  }
  return n;
}

function fieldToLeHex(F, value) {
  const out = new Uint8Array(32);
  F.toRprLE(out, 0, value);
  return Buffer.from(out).toString("hex");
}

const raw = JSON.parse(await readFile(new URL("../generated/poseidon_vectors.json", import.meta.url), "utf8"));
const vectors = raw.vectors;
if (!Array.isArray(vectors) || vectors.length === 0) {
  throw new Error("generated/poseidon_vectors.json has no vectors array");
}

const poseidon = await buildPoseidon();
let checked = 0;
for (const vector of vectors) {
  if (vector.arity !== 2 && vector.arity !== 3) {
    throw new Error(`unsupported arity at vector ${vector.index}: ${vector.arity}`);
  }
  const inputs = vector.inputs_le_hex.map(leHexToBigInt);
  const got = fieldToLeHex(poseidon.F, poseidon(inputs));
  const expected = String(vector.expected_le_hex).toLowerCase();
  if (got !== expected) {
    throw new Error(
      `parity mismatch vector=${vector.index} arity=${vector.arity} expected=${expected} got=${got}`,
    );
  }
  checked += 1;
}

console.log(`[parity] OK - ${checked}/${vectors.length} Poseidon BN254 vectors match circomlibjs@0.1.7`);
