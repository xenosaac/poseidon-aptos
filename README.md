# Poseidon Aptos

Standalone Poseidon BN254 hashing for Aptos Move.

This package provides a small Move module, `poseidon_aptos::poseidon_bn254`, with two public functions:

```move
public fun hash_2(a: vector<u8>, b: vector<u8>): vector<u8>
public fun hash_3(a: vector<u8>, b: vector<u8>, c: vector<u8>): vector<u8>
```

Inputs and outputs are 32-byte little-endian BN254 scalar field elements using `std::bn254_algebra::FormatFrLsb`. Outputs are byte-identical to `circomlibjs@0.1.7` for the included arity-2 and arity-3 vectors.

## Layout

- `sources/` - Move implementation, constants, and parity tests.
- `generated/` - generated constants and test vectors with provenance metadata.
- `scripts/` - provenance, parity, and generated artifact checks.

## Verify

```bash
npm install
npm run verify
```

`npm run verify` runs:

- circomlibjs parity over all 36 generated vectors
- generated JSON sanity checks
- `aptos move compile --dev`
- `aptos move test --dev`

## Regenerate Artifacts

```bash
npx ts-node --esm scripts/extract_poseidon_circomlibjs.ts
python3 scripts/derive_optimized_constants.py --mode a2
npm run verify
```

The npm dependencies are pinned because the generated vectors are intended to prove byte parity with a specific `circomlibjs` release.

## Addresses

The Move named address is intentionally unbound in `[addresses]`:

```toml
poseidon_aptos = "_"
```

Downstream packages should bind `poseidon_aptos` to their chosen publishing address. Tests use the local dev address `0xCAFE`.
