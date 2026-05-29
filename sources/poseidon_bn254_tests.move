// Spot-check tests for poseidon_aptos::poseidon_bn254 against vectors generated
// from circomlibjs@0.1.7.
//
// The complete vector set (17 arity-2 + 19 arity-3) is exercised by
// poseidon_bn254_vector_tests.move where each vector has its own #[test]
// (because the Aptos crypto_algebra runtime caps per-transaction algebra
// context memory at ~1 MiB and dozens of hashes back-to-back overflow it).
// The tests here just sanity-check the canonical zero-input values so a
// schedule regression fails loudly without needing to walk the full set.

#[test_only]
module poseidon_aptos::poseidon_bn254_tests {
    use aptos_std::crypto_algebra;
    use poseidon_aptos::poseidon_bn254;
    use poseidon_aptos::poseidon_test_vectors;

    // Poseidon([0, 0]) on BN254 = 14744269619966411208579211824598458697587494354926760081771325075741142829156
    // (decimal). LE-32 hex below matches the canonical value emitted by
    // circomlibjs.buildPoseidon().
    #[test(fx = @std)]
    fun test_hash_2_zero_zero_canonical(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let zero32 = x"0000000000000000000000000000000000000000000000000000000000000000";
        let got = poseidon_bn254::hash_2(zero32, zero32);
        let expected = x"6448b64684ee39a823d5fe5fd52431dc81e4817bf2c3ea3cab9e239efbf59820";
        assert!(got == expected, 9001);
    }

    // Vector 0 of the arity-3 generator is hash_3(0, 0, 0). The expected output
    // is read from poseidon_test_vectors so this also covers the friend-import
    // path, which the per-vector tests do not exercise.
    #[test(fx = @std)]
    fun test_hash_3_zero_zero_zero_canonical(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let cases = poseidon_test_vectors::poseidon_hash_3_vectors();
        let case0 = std::vector::borrow(&cases, 0);
        let (a, b, c, expected) = poseidon_test_vectors::tc3_unpack(case0);
        let zero32 = x"0000000000000000000000000000000000000000000000000000000000000000";
        assert!(a == zero32 && b == zero32 && c == zero32, 9200);
        let got = poseidon_bn254::hash_3(a, b, c);
        assert!(got == expected, 9201);
    }
}
