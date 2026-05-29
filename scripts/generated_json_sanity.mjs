#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const FIELD_ORDER = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
const CIRCOMLIBJS_VERSION = "0.1.7";

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function readLe32(hex, label) {
  assert(typeof hex === "string", `${label}: expected string`);
  assert(/^[0-9a-fA-F]{64}$/.test(hex), `${label}: expected 32-byte little-endian hex`);
  let out = 0n;
  for (let i = 31; i >= 0; i -= 1) {
    out = (out << 8n) | BigInt(parseInt(hex.slice(i * 2, i * 2 + 2), 16));
  }
  return out;
}

function assertFieldDecHex(dec, hex, label) {
  assert(typeof dec === "string", `${label}: decimal value must be a string`);
  const decValue = BigInt(dec);
  const hexValue = readLe32(hex, label);
  assert(decValue === hexValue, `${label}: decimal and LE hex differ`);
  assert(decValue >= 0n && decValue < FIELD_ORDER, `${label}: value is outside BN254 Fr`);
}

function assertProvenance(obj, label) {
  assert(obj && typeof obj === "object", `${label}: missing object`);
  assert(obj._provenance && typeof obj._provenance === "object", `${label}: missing _provenance`);
  assert(
    obj._provenance.circomlibjs_version === CIRCOMLIBJS_VERSION,
    `${label}: unexpected circomlibjs provenance version`,
  );
  assert(typeof obj._provenance.generator === "string", `${label}: missing generator`);
  assert(typeof obj._provenance.generated_at === "string", `${label}: missing generated_at`);
  assert(typeof obj._provenance.regenerate_with === "string", `${label}: missing regenerate_with`);
}

function assertParallelArrays(decValues, hexValues, expectedLength, label) {
  assert(Array.isArray(decValues), `${label}: decimal array missing`);
  assert(Array.isArray(hexValues), `${label}: hex array missing`);
  assert(decValues.length === expectedLength, `${label}: decimal length ${decValues.length}, want ${expectedLength}`);
  assert(hexValues.length === expectedLength, `${label}: hex length ${hexValues.length}, want ${expectedLength}`);
  for (let i = 0; i < expectedLength; i += 1) {
    assertFieldDecHex(decValues[i], hexValues[i], `${label}[${i}]`);
  }
}

function assertVectors(vectorsJson) {
  assertProvenance(vectorsJson, "poseidon_vectors.json");
  const vectors = vectorsJson.vectors;
  assert(Array.isArray(vectors), "poseidon_vectors.json: vectors must be an array");
  assert(vectors.length === 36, `poseidon_vectors.json: vector count ${vectors.length}, want 36`);

  let arity2 = 0;
  let arity3 = 0;
  for (let i = 0; i < vectors.length; i += 1) {
    const v = vectors[i];
    assert(v.index === i, `vector ${i}: index mismatch`);
    assert(v.arity === 2 || v.arity === 3, `vector ${i}: unsupported arity ${v.arity}`);
    assert(v.t === v.arity + 1, `vector ${i}: t must equal arity + 1`);
    if (v.arity === 2) arity2 += 1;
    if (v.arity === 3) arity3 += 1;
    assert(Array.isArray(v.inputs_dec), `vector ${i}: inputs_dec missing`);
    assert(Array.isArray(v.inputs_le_hex), `vector ${i}: inputs_le_hex missing`);
    assert(v.inputs_dec.length === v.arity, `vector ${i}: inputs_dec arity mismatch`);
    assert(v.inputs_le_hex.length === v.arity, `vector ${i}: inputs_le_hex arity mismatch`);
    for (let j = 0; j < v.arity; j += 1) {
      assertFieldDecHex(v.inputs_dec[j], v.inputs_le_hex[j], `vector ${i} input ${j}`);
    }
    assertFieldDecHex(v.expected_dec, v.expected_le_hex, `vector ${i} expected`);
  }

  assert(arity2 === 17, `poseidon_vectors.json: arity-2 count ${arity2}, want 17`);
  assert(arity3 === 19, `poseidon_vectors.json: arity-3 count ${arity3}, want 19`);
}

function assertConstants(constantsJson) {
  assertProvenance(constantsJson, "poseidon_constants.json");
  assert(
    constantsJson.circomlibjs_version === CIRCOMLIBJS_VERSION,
    "poseidon_constants.json: unexpected circomlibjs_version",
  );
  assert(BigInt(constantsJson.field_order_dec) === FIELD_ORDER, "field_order_dec mismatch");
  assert(readLe32(constantsJson.field_order_le_hex, "field_order_le_hex") === FIELD_ORDER, "field_order_le_hex mismatch");

  const widths = [
    ["t3", 3, 57],
    ["t4", 4, 56],
  ];
  for (const [name, t, rp] of widths) {
    const section = constantsJson[name];
    assert(section && typeof section === "object", `${name}: missing constants`);
    assert(section.rf === 8, `${name}: rf must be 8`);
    assert(section.rp === rp, `${name}: rp must be ${rp}`);
    assertParallelArrays(section.C_dec, section.C_le_hex, 8 * t + rp, `${name}.C`);
    assertParallelArrays(section.M_dec_flat, section.M_le_hex_flat, t * t, `${name}.M`);
    assertParallelArrays(section.P_dec_flat, section.P_le_hex_flat, t * t, `${name}.P`);
    assertParallelArrays(section.S_full_dec_flat, section.S_full_le_hex_flat, rp * t * t, `${name}.S_full`);
  }
}

const vectorsJson = JSON.parse(await readFile(new URL("../generated/poseidon_vectors.json", import.meta.url), "utf8"));
const constantsJson = JSON.parse(await readFile(new URL("../generated/poseidon_constants.json", import.meta.url), "utf8"));

assertVectors(vectorsJson);
assertConstants(constantsJson);

console.log("[json:sanity] OK - generated vectors/constants are internally consistent");
