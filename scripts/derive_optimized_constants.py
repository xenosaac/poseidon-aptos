#!/usr/bin/env python3
"""
derive_optimized_constants.py - optimized constants helper.

Reads generated/poseidon_constants.json (output of extract_poseidon_circomlibjs.ts)
and derives:
  - s_packed_t3 / s_packed_t4 : (2t-1) packed-sparse S (round-major).

Mode selection by --mode flag:
  base    : naive constants (c_naive_t3, c_naive_t4, m_t3, m_t4) only.
  a2      : base + (c_opt_t3, c_opt_t4, p_t3, p_t4, s_packed_t3, s_packed_t4).
            True-sparse layout used by the Move implementation.
  a1      : base + (c_opt_t3, c_opt_t4, p_t3, p_t4, s_full_t3, s_full_t4).
            Dense-expanded sparse layout for cross-checking.

Why split: emitting all four (c_opt + p + s_full + s_packed) in one module
inflates the package payload to ~97 KiB, exceeding Aptos's 64 KiB transaction
size cap. Splitting per mode keeps each output publishable.

Note: m_t3/m_t4 is the same matrix used by both schedules; emitted once.

Output:
  sources/poseidon_constants.move

Run:
  python3 scripts/derive_optimized_constants.py --mode {base|a1|a2}
"""

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JSON_PATH = ROOT / "generated" / "poseidon_constants.json"
NAIVE_SRC = ROOT / "sources" / "poseidon_constants.move"
OUT_PATH = ROOT / "sources" / "poseidon_constants.move"

RF = 8
RP_BY_T = {3: 57, 4: 56}


def packed_from_full(s_full_flat: list[str], t: int, rp: int) -> list[str]:
    """
    Convert dense flat S_full (rp * t * t) into packed (rp * (2t-1)) layout.
    Packing: for each round r:
        row0 (t entries) || col-below-row0 (t-1 entries from rows 1..t-1, col 0)
    """
    stride_full = t * t
    out: list[str] = []
    for r in range(rp):
        base = r * stride_full
        # First row: S_full[r][0][0..t-1]
        for j in range(t):
            out.append(s_full_flat[base + 0 * t + j])
        # First column below row 0: S_full[r][i][0] for i=1..t-1
        for i in range(1, t):
            out.append(s_full_flat[base + i * t + 0])
    assert len(out) == rp * (2 * t - 1)
    return out


def parse_naive_constants(src_text: str) -> dict[str, list[str]]:
    """
    Read the existing poseidon_constants.move and pull out c_naive_t3,
    c_naive_t4, m_t3, m_t4 byte vectors verbatim.
    """
    out: dict[str, list[str]] = {}
    pat = re.compile(
        r'public\(friend\) fun (\w+)\(\): vector<vector<u8>> \{\s*'
        r'vector\[(.*?)\]\s*\}',
        re.DOTALL,
    )
    for m in pat.finditer(src_text):
        name = m.group(1)
        body = m.group(2)
        hexes = re.findall(r'x"([0-9a-fA-F]+)"', body)
        out[name] = hexes
    return out


def emit_vec_fn(name: str, hexes: list[str]) -> str:
    body = ",\n".join(f'            x"{h}"' for h in hexes)
    return (
        f"    public(friend) fun {name}(): vector<vector<u8>> {{\n"
        f"        vector[\n{body}\n"
        f"        ]\n    }}\n"
    )


CACHED_NAIVE_PATH = ROOT / "sources" / "poseidon_constants_naive_cache.json"


def load_or_cache_naive() -> dict[str, list[str]]:
    """
    Read naive c_naive_t3/c_naive_t4/m_t3/m_t4 from current poseidon_constants.move
    on first call, cache to JSON; on subsequent regen calls (after we've
    overwritten the .move with mode=a1 or a2 output, which lacks c_naive),
    fall back to the cache. This makes the script idempotent and re-runnable.
    """
    if CACHED_NAIVE_PATH.exists():
        return json.loads(CACHED_NAIVE_PATH.read_text())
    if not NAIVE_SRC.exists():
        raise RuntimeError(f"Cannot find naive constants: {NAIVE_SRC} missing and no cache")
    parsed = parse_naive_constants(NAIVE_SRC.read_text())
    needed = {"c_naive_t3", "c_naive_t4", "m_t3", "m_t4"}
    if not needed.issubset(parsed):
        raise RuntimeError(
            f"Current {NAIVE_SRC} missing one of {needed}: have {set(parsed)}"
        )
    cache = {k: parsed[k] for k in needed}
    CACHED_NAIVE_PATH.write_text(json.dumps(cache, indent=2))
    print(f"# cached naive constants to {CACHED_NAIVE_PATH}")
    return cache


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--mode",
        choices=("base", "a1", "a2"),
        default="base",
        help="base=naive only; a1=+s_full dense control; a2=+s_packed true sparse",
    )
    args = ap.parse_args()
    mode = args.mode

    if not JSON_PATH.exists():
        print(f"FATAL: {JSON_PATH} not found", file=sys.stderr)
        return 1

    j = json.loads(JSON_PATH.read_text())
    t3 = j["t3"]
    t4 = j["t4"]

    # Derive packed S from dense S_full.
    s_packed_t3_hex = packed_from_full(t3["S_full_le_hex_flat"], 3, RP_BY_T[3])
    s_packed_t4_hex = packed_from_full(t4["S_full_le_hex_flat"], 4, RP_BY_T[4])
    assert len(s_packed_t3_hex) == 57 * 5, f"got {len(s_packed_t3_hex)}, want 285"
    assert len(s_packed_t4_hex) == 56 * 7, f"got {len(s_packed_t4_hex)}, want 392"

    # Naive constants: read from current Move source on first run, then cache.
    naive = load_or_cache_naive()
    naive_m_t3 = naive["m_t3"]
    opt_m_t3 = t3["M_le_hex_flat"]
    if naive_m_t3 != opt_m_t3:
        print("WARNING: naive m_t3 differs from optimized M — using naive form",
              file=sys.stderr)
    else:
        print("# m_t3: naive == optimized (Hadeshash matrix identical, OK)")
    naive_m_t4 = naive["m_t4"]
    opt_m_t4 = t4["M_le_hex_flat"]
    if naive_m_t4 != opt_m_t4:
        print("WARNING: naive m_t4 differs from optimized M", file=sys.stderr)
    else:
        print("# m_t4: naive == optimized (Hadeshash matrix identical, OK)")

    # ---- Build the module body ----
    # Always include naive constants for reproducibility and independent checks.
    sections = []
    sections.append(emit_vec_fn("m_t3", naive_m_t3))
    sections.append(emit_vec_fn("m_t4", naive_m_t4))
    sections.append(emit_vec_fn("c_naive_t3", naive["c_naive_t3"]))
    sections.append(emit_vec_fn("c_naive_t4", naive["c_naive_t4"]))

    if mode in ("a1", "a2"):
        sections.append(emit_vec_fn("c_opt_t3", t3["C_le_hex"]))
        sections.append(emit_vec_fn("c_opt_t4", t4["C_le_hex"]))
        sections.append(emit_vec_fn("p_t3", t3["P_le_hex_flat"]))
        sections.append(emit_vec_fn("p_t4", t4["P_le_hex_flat"]))
    if mode == "a1":
        sections.append(emit_vec_fn("s_full_t3", t3["S_full_le_hex_flat"]))
        sections.append(emit_vec_fn("s_full_t4", t4["S_full_le_hex_flat"]))
    if mode == "a2":
        sections.append(emit_vec_fn("s_packed_t3", s_packed_t3_hex))
        sections.append(emit_vec_fn("s_packed_t4", s_packed_t4_hex))

    body = "\n".join(sections)

    extras = ""
    if mode == "base":
        extras = "// (base mode: naive constants only.)\n"
    elif mode == "a1":
        extras = (
            "// (a1 mode: naive + c_opt + p + s_full = dense-expanded sparse layout.)\n"
        )
    elif mode == "a2":
        extras = (
            "// (a2 mode: naive + c_opt + p + s_packed = true-sparse 2t-1 layout.)\n"
        )

    out = (
        "// Auto-generated by scripts/derive_optimized_constants.py — DO NOT EDIT BY HAND.\n"
        f"// To regenerate: python3 scripts/derive_optimized_constants.py --mode {mode}\n"
        "//\n"
        "// Container module for Poseidon BN254 NAIVE + OPTIMIZED constants from\n"
        "// circomlibjs@0.1.7. All elements are 32-byte little-endian (FormatFrLsb)\n"
        "// field elements canonicalized into [0, r).\n"
        f"{extras}"
        "//\n"
        "// Naive schedule:\n"
        "//   c_naive_t3 / c_naive_t4 — flat vectors of length (RF+RP)*t.\n"
        "//   m_t3 / m_t4             — t*t row-major Hadeshash MDS matrix.\n"
        "//\n"
        "// Optimized schedule:\n"
        "//   c_opt_t3 / c_opt_t4     — flat round constants, length RF*t + RP.\n"
        "//   p_t3 / p_t4             — t*t pre-sparse bridge matrix.\n"
        "//   s_full_t3 / s_full_t4   — Rp * t * t dense expansion of sparse S\n"
        "//                             for dense cross-checks.\n"
        "//   s_packed_t3 / s_packed_t4 — Rp * (2t-1) packed sparse layout:\n"
        "//                               [row0 (t entries) || col1_0..col_{t-1}_0]\n"
        "//                               used by the Move implementation.\n"
        "//\n"
        "// Why split into per-mode regenerations: emitting all four (c_opt + p +\n"
        "// s_full + s_packed) in one module pushes the package above Aptos's\n"
        "// 64 KiB transaction-size cap (was 97 KiB; cap is 65536). The mode\n"
        "// selector keeps each branch publishable.\n"
        "module poseidon_aptos::poseidon_constants {\n"
        "    friend poseidon_aptos::poseidon_bn254;\n"
        "    #[test_only]\n"
        "    friend poseidon_aptos::poseidon_bn254_tests;\n"
        "\n"
        f"{body}"
        "}\n"
    )

    OUT_PATH.write_text(out)
    print(f"# mode={mode}; wrote {OUT_PATH}, {OUT_PATH.stat().st_size} bytes")
    print(f"# c_naive_t3 entries: {len(naive['c_naive_t3'])}")
    print(f"# c_naive_t4 entries: {len(naive['c_naive_t4'])}")
    print(f"# m_t3:               {len(naive_m_t3)} entries")
    print(f"# m_t4:               {len(naive_m_t4)} entries")
    if mode in ("a1", "a2"):
        print(f"# c_opt_t3:           {len(t3['C_le_hex'])} entries")
        print(f"# c_opt_t4:           {len(t4['C_le_hex'])} entries")
        print(f"# p_t3:               {len(t3['P_le_hex_flat'])} entries")
        print(f"# p_t4:               {len(t4['P_le_hex_flat'])} entries")
    if mode == "a1":
        print(f"# s_full_t3:          {len(t3['S_full_le_hex_flat'])} entries (dense)")
        print(f"# s_full_t4:          {len(t4['S_full_le_hex_flat'])} entries (dense)")
    if mode == "a2":
        print(f"# s_packed_t3:        {len(s_packed_t3_hex)} entries (true-sparse)")
        print(f"# s_packed_t4:        {len(s_packed_t4_hex)} entries (true-sparse)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
