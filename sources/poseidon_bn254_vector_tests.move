// Auto-generated. DO NOT EDIT BY HAND.
// To regenerate: npx ts-node --esm scripts/extract_poseidon_circomlibjs.ts
//
// One #[test] per Poseidon vector. The Aptos crypto_algebra runtime keeps a
// per-transaction algebra context capped at 1 MiB; a single test that runs
// dozens of hashes back-to-back exhausts it, so we split here.
#[test_only]
module poseidon_aptos::poseidon_bn254_vector_tests {
    use aptos_std::crypto_algebra;
    use poseidon_aptos::poseidon_bn254;

    #[test(fx = @std)]
    fun test_hash_2_v00(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_2(
            x"0000000000000000000000000000000000000000000000000000000000000000",
            x"0000000000000000000000000000000000000000000000000000000000000000"
        );
        let expected = x"6448b64684ee39a823d5fe5fd52431dc81e4817bf2c3ea3cab9e239efbf59820";
        assert!(got == expected, 1000);
    }

    #[test(fx = @std)]
    fun test_hash_2_v01(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_2(
            x"0100000000000000000000000000000000000000000000000000000000000000",
            x"0000000000000000000000000000000000000000000000000000000000000000"
        );
        let expected = x"7f3bc41c4a989182fb77c1ca3b9797d198428d32c77d176a896e56c7a228bb28";
        assert!(got == expected, 1001);
    }

    #[test(fx = @std)]
    fun test_hash_2_v02(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_2(
            x"0000000000000000000000000000000000000000000000000000000000000000",
            x"0100000000000000000000000000000000000000000000000000000000000000"
        );
        let expected = x"5ee65399c487bf756dd383c09a8b3c36a1a3882e8a7743c63098def53408d21b";
        assert!(got == expected, 1002);
    }

    #[test(fx = @std)]
    fun test_hash_2_v03(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_2(
            x"0100000000000000000000000000000000000000000000000000000000000000",
            x"0100000000000000000000000000000000000000000000000000000000000000"
        );
        let expected = x"811e40ad7ce2af903fe770cb8aa79412773f02f3a9e0799e2704d3e246f37a00";
        assert!(got == expected, 1003);
    }

    #[test(fx = @std)]
    fun test_hash_2_v04(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_2(
            x"000000f093f5e1439170b97948e833285d588181b64550b829a031e1724e6430",
            x"0000000000000000000000000000000000000000000000000000000000000000"
        );
        let expected = x"389431fea8a385328db6e8d41b3d00fb0c955ff1a0091fddb395990dae4e691b";
        assert!(got == expected, 1004);
    }

    #[test(fx = @std)]
    fun test_hash_2_v05(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_2(
            x"0000000000000000000000000000000000000000000000000000000000000000",
            x"000000f093f5e1439170b97948e833285d588181b64550b829a031e1724e6430"
        );
        let expected = x"bc98dee7e48f975f4ded74956612280dbdabd21c3245e6cb7650b14833deb228";
        assert!(got == expected, 1005);
    }

    #[test(fx = @std)]
    fun test_hash_2_v06(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_2(
            x"000000f093f5e1439170b97948e833285d588181b64550b829a031e1724e6430",
            x"000000f093f5e1439170b97948e833285d588181b64550b829a031e1724e6430"
        );
        let expected = x"fbe0a65687b9d76415d4cc52b752ab1642fd82cb06878d37818733a613d86b2c";
        assert!(got == expected, 1006);
    }

    #[test(fx = @std)]
    fun test_hash_2_v07(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_2(
            x"5245df35232de32c44a3c65e1a7d640000000000000000000000000000000000",
            x"b95ec4e35add18cae2608845e62dbea4c374f17e2cab22000000000000000000"
        );
        let expected = x"20a51b0246ecc913f459da0d5502ea7043649083e19377f15098efd18547c31d";
        assert!(got == expected, 1007);
    }

    #[test(fx = @std)]
    fun test_hash_2_v08(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_2(
            x"d4ee967966530f8612a86f1a8ff16934a45a160b5c3addb569090086f0f50b00",
            x"ee6b9467e27056753e8ff56a04f62e67fc2171e0ca9dabf684e4df19a386ea21"
        );
        let expected = x"ab400c4d04b7e2b2c7799bedf148a3a82e2c6c19eb34b2f3ccbdfa8ace7d5b01";
        assert!(got == expected, 1008);
    }

    #[test(fx = @std)]
    fun test_hash_2_v09(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_2(
            x"c6a7c7b0e8d6e93fa870b1d7bde181f755e045b9d7cce1e51acfc685560c6802",
            x"183f975d7483104d417a28f93b1ca0d1763579b675a0e969076f1a05a90e6804"
        );
        let expected = x"81d4e8d86acad93222ba33e837da1e65c486d74a9b7707e16986079745fddb21";
        assert!(got == expected, 1009);
    }

    #[test(fx = @std)]
    fun test_hash_2_v10(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_2(
            x"1fa60b845a774cc287c423b31cf3c062d40c64ba5ed147af5a1a44e84b796b0a",
            x"d4fac3956cec1925a6982867db288a0b87169d8aa4894dce60c4fb17803f9820"
        );
        let expected = x"f6708c0f550d2f8cfcf5ddfed2e131433080a17caedd6bb020d397530b12b20a";
        assert!(got == expected, 1010);
    }

    #[test(fx = @std)]
    fun test_hash_2_v11(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_2(
            x"30453c777efdbff85b1b8f10a1c19350079289055ac5005e16c3089cdeee2319",
            x"8acebac2f2eee4ba2d2a1afade8abded7edad258cf10dfd1eba055bb0abe9320"
        );
        let expected = x"9fb5db52c055da0651f29605e7f08743f70eb456246f94186824578bfafb7115";
        assert!(got == expected, 1011);
    }

    #[test(fx = @std)]
    fun test_hash_2_v12(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_2(
            x"3a5f0bf771e739599a83ec19aeca117d035a9c64437889c602180e4ae5e13517",
            x"baeb20e641f0c1ef6cfc9c9f4f8c8f64a6954fd19aa8fc01d4ff4da6bdd3b808"
        );
        let expected = x"eb7dd43d957c1f98a168b55e978caed309259bae9c25a274097e13aea9a4240a";
        assert!(got == expected, 1012);
    }

    #[test(fx = @std)]
    fun test_hash_2_v13(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_2(
            x"29bc8a99538d591d85a913ecc783e3e84cfec0cd616357e5ea7017604d6ce72a",
            x"f7521dac1ea3548c808f08d2f70e078d42082d0e80bd510f81d72b6f02479f0c"
        );
        let expected = x"20dfd57ed53339c09c2ae97e6acb6eefb75bd0d389aa147df692e8e5e97de80d";
        assert!(got == expected, 1013);
    }

    #[test(fx = @std)]
    fun test_hash_2_v14(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_2(
            x"094fdf6dde80d240da8f9f87eef7786979d8eb1f04007ffcb3ff262f1d51502b",
            x"e8d4f1ddaaa27370feb1ab68e961ff8151b92825d1b4e83ce918b74027ae991b"
        );
        let expected = x"aab491aba0fb48db3868be1557495fc07682238d15f2fd1949cf55b551d0fe12";
        assert!(got == expected, 1014);
    }

    #[test(fx = @std)]
    fun test_hash_2_v15(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_2(
            x"8a09954ecc8f8c99ccb790b217a30df46ddc50654395c41cf88c505624d2b626",
            x"c4e3fb2c1f1a99a51946f9eb7d7767c477526b2c152e483eb9a3d532c9ce9720"
        );
        let expected = x"67592c51f058513c31a18d9f5a1d32637ec9969e7de40e0fc479ab00c3149611";
        assert!(got == expected, 1015);
    }

    #[test(fx = @std)]
    fun test_hash_2_v16(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_2(
            x"7a2d392f2706823796a2ae1873eaa13d7dc9b8967971bc5970fd02671e924104",
            x"6e30c32cc5929103384377f6f1cc48774cddb0b704c35b4e6dbdbd483e359409"
        );
        let expected = x"a29570bd92b954971e42ce8d5aab9c4de4ba68efd4458b139a73d484796d5a2d";
        assert!(got == expected, 1016);
    }

    #[test(fx = @std)]
    fun test_hash_3_v00(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_3(
            x"0000000000000000000000000000000000000000000000000000000000000000",
            x"0000000000000000000000000000000000000000000000000000000000000000",
            x"0000000000000000000000000000000000000000000000000000000000000000"
        );
        let expected = x"aa99a51bb36dee7caec596ecec4e86e28ff07a0aafb6cf1ddceacc7dd288c10b";
        assert!(got == expected, 2000);
    }

    #[test(fx = @std)]
    fun test_hash_3_v01(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_3(
            x"0100000000000000000000000000000000000000000000000000000000000000",
            x"0000000000000000000000000000000000000000000000000000000000000000",
            x"0000000000000000000000000000000000000000000000000000000000000000"
        );
        let expected = x"1583a926f7364fa62182176b70c3ee8e3f4fd700cecd7cda810e037ae33a1424";
        assert!(got == expected, 2001);
    }

    #[test(fx = @std)]
    fun test_hash_3_v02(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_3(
            x"0000000000000000000000000000000000000000000000000000000000000000",
            x"0100000000000000000000000000000000000000000000000000000000000000",
            x"0000000000000000000000000000000000000000000000000000000000000000"
        );
        let expected = x"6df1b5d73b2b7f05559a20634476dea480b385d16d169e7c57ce2350d79dce12";
        assert!(got == expected, 2002);
    }

    #[test(fx = @std)]
    fun test_hash_3_v03(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_3(
            x"0000000000000000000000000000000000000000000000000000000000000000",
            x"0000000000000000000000000000000000000000000000000000000000000000",
            x"0100000000000000000000000000000000000000000000000000000000000000"
        );
        let expected = x"7b062539bde2d80749746986cf8f0001fd2cdbf9a89fcbf981a769daef49df06";
        assert!(got == expected, 2003);
    }

    #[test(fx = @std)]
    fun test_hash_3_v04(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_3(
            x"0100000000000000000000000000000000000000000000000000000000000000",
            x"0100000000000000000000000000000000000000000000000000000000000000",
            x"0100000000000000000000000000000000000000000000000000000000000000"
        );
        let expected = x"4325bf7386b102c223cd6109e3b6b1bc813ecb14b2c3332bbd2aa7106e06c002";
        assert!(got == expected, 2004);
    }

    #[test(fx = @std)]
    fun test_hash_3_v05(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_3(
            x"000000f093f5e1439170b97948e833285d588181b64550b829a031e1724e6430",
            x"0000000000000000000000000000000000000000000000000000000000000000",
            x"0000000000000000000000000000000000000000000000000000000000000000"
        );
        let expected = x"2042d88f5b9fad20296eb0c4ed287edc91e402a6faa94a6b7f1623b16bc5342c";
        assert!(got == expected, 2005);
    }

    #[test(fx = @std)]
    fun test_hash_3_v06(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_3(
            x"0000000000000000000000000000000000000000000000000000000000000000",
            x"000000f093f5e1439170b97948e833285d588181b64550b829a031e1724e6430",
            x"0000000000000000000000000000000000000000000000000000000000000000"
        );
        let expected = x"6f276031d3cd5a945dd018114c788f619aa3c4c753b01eadd0d21de3ec884027";
        assert!(got == expected, 2006);
    }

    #[test(fx = @std)]
    fun test_hash_3_v07(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_3(
            x"0000000000000000000000000000000000000000000000000000000000000000",
            x"0000000000000000000000000000000000000000000000000000000000000000",
            x"000000f093f5e1439170b97948e833285d588181b64550b829a031e1724e6430"
        );
        let expected = x"ce78c1ac2559f5f7f3d7a33a347cd14d7127e1cf5885d49d29ea0b2a081c2e10";
        assert!(got == expected, 2007);
    }

    #[test(fx = @std)]
    fun test_hash_3_v08(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_3(
            x"000000f093f5e1439170b97948e833285d588181b64550b829a031e1724e6430",
            x"000000f093f5e1439170b97948e833285d588181b64550b829a031e1724e6430",
            x"000000f093f5e1439170b97948e833285d588181b64550b829a031e1724e6430"
        );
        let expected = x"f21101ea62260344cb85c7696b4c8f71c5bb3920b93a1b699fbf798fb37a4e29";
        assert!(got == expected, 2008);
    }

    #[test(fx = @std)]
    fun test_hash_3_v09(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_3(
            x"c5499311d11ef8b85511f4e751950f2c8579a78e4a939b05505b9f6c75bf662f",
            x"17f0a6d72b9d5039e185376f054e55403f88eee07789604d49c8ae615879b005",
            x"70e9b6a013c2665a41cbd12e44db8efb746bca805662edc4008ad3bc3bc17b01"
        );
        let expected = x"fe53301caa6be86ebc35820ef70818e27757aa5c5a8ef4776ee0e0fd033d4c26";
        assert!(got == expected, 2009);
    }

    #[test(fx = @std)]
    fun test_hash_3_v10(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_3(
            x"4cda5e1e03a02dd76ce19392048367427033ffd653acd9cd1c5e2dafeb27e620",
            x"f02d14cd3b98e3678707ee5425aaf127c5f195385674dded02417c114969b70f",
            x"0e4de01313141570ba0e68e366c4d8f274e630bb7d12886fa499f261896dba0b"
        );
        let expected = x"e02b23bbeb7ec8229053953c2230772b00e62bb95b695e6dfc1cdbbad5e57c20";
        assert!(got == expected, 2010);
    }

    #[test(fx = @std)]
    fun test_hash_3_v11(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_3(
            x"b8916ab645f130d07cc58f046a849087240606adfd67da17291eff49b0fb9c02",
            x"f01d91c3cb67a501e979b265f75e3b8a8b0255af9f31232fdc7b1ce0ba16fa12",
            x"8c85e2de4618ad331033441c0695a3fc9b9f35f9cc384887b8663a4ee7480d01"
        );
        let expected = x"054e822e45c9654d1f2db82c1484213625bd2332a74975acb61dabb74f63bd2c";
        assert!(got == expected, 2011);
    }

    #[test(fx = @std)]
    fun test_hash_3_v12(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_3(
            x"4d0e442d4457aeebe958d6ea90c0e0640d509e44a93845a18287f1cf843d1016",
            x"9a2c2ffc3623bfe74b6dde0906a8c55ec0f9daa53462f78c8e8f5f670332a508",
            x"e043ffb6081bc4f373db8d917178fdb409f5a7c51d09e8bd39127b58982b6029"
        );
        let expected = x"de50719ec5164800859c0a551fa57b4e2b9092c644ae9b5e46192c47ae983626";
        assert!(got == expected, 2012);
    }

    #[test(fx = @std)]
    fun test_hash_3_v13(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_3(
            x"ee9712137f85b6ee19c4b06b879299a2e27fa8c9022ad3ab6ccb3f2c26971908",
            x"043be762e11887ccd45326fb36b20584768af38e455640ee7b7bc8521427a407",
            x"2aeeba7f9cee341c07966723d4cbf1d3adcb9ffeff617a92b208460abebf861b"
        );
        let expected = x"b9ecce9ff7a24016f5f6f2666bc1a089712e780d31ea49035cc7193aceb6b92c";
        assert!(got == expected, 2013);
    }

    #[test(fx = @std)]
    fun test_hash_3_v14(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_3(
            x"fc6cbc2a750d3b8363ac7e5a6ce0402b50783c96ed9a443e9e56d34a345a2830",
            x"043479c0e372d6158ab76b60935e3177d32ded698e4619772af72bd85400ef28",
            x"91ab032c7706c062cc9b9d624ac6c9949231602db1dc919f869357633e21c328"
        );
        let expected = x"ea65cac58e08935a65b66d02385e1c6f482139392965da2e68d918bac798e909";
        assert!(got == expected, 2014);
    }

    #[test(fx = @std)]
    fun test_hash_3_v15(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_3(
            x"cd25dba7c64b808d5690b569f9b2235d783c4c87268ca2c542f0387b35661b09",
            x"0d927e1c7e1f232e46732b9e685c542a5ea688eaf060a3bed5500577c2db2f0a",
            x"33ac5d1cc52cad224818024f52bf13195e7ce62643515ad62bb851e7b169890c"
        );
        let expected = x"c71958ddaaac1d5b53dc9a91a4e91341b7e93a95e1b51b9f342f2a6a14ab3922";
        assert!(got == expected, 2015);
    }

    #[test(fx = @std)]
    fun test_hash_3_v16(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_3(
            x"67bc84d0c793b5b8c1d1f1d02b0b09fd7ab827d9ffb0a57d3b84b481be070421",
            x"6ca76df8ef76ed94b2d0bf77e1eed29fbc8874aa640e6c508ff19c776358a62a",
            x"5c07a13b03eb8faa5fb79e38f2689f1fef62c8dc9c27da27fcd7a6de5d451b1b"
        );
        let expected = x"0318dd93613afb25fe2e2e2ae514b0b33f06c1d9309de41da94e52d70dbb6214";
        assert!(got == expected, 2016);
    }

    #[test(fx = @std)]
    fun test_hash_3_v17(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_3(
            x"7b20a8e8b1c30887090429d6674ecacdc1b7a7fb9712811420a6695314885205",
            x"ea42470b5dfbd76087ca1991b61ef9a3868365dc82f2ff64eb11bdd85e933c05",
            x"e3540c425ceab34f66f32bb1ba8d785c21d6332b0c5f5838d67a381217006901"
        );
        let expected = x"b2f14f65e68f4ba44e03e34a69aec318f43f84ceb53a9b09a556995fd1655e2b";
        assert!(got == expected, 2017);
    }

    #[test(fx = @std)]
    fun test_hash_3_v18(fx: signer) {
        crypto_algebra::enable_cryptography_algebra_natives(&fx);
        let got = poseidon_bn254::hash_3(
            x"9ab2aba6062b2ea989f753e9344113a8c462b3d3b4efa714ec4c54a693e5271d",
            x"32d1d637a7a17b8a29a63abea8a2e725631e8ae96af975f7317898a3e1892f18",
            x"0be5071ff56e472d18427514e807c8af79d1e6ab5e31b628e3f26f06552f8900"
        );
        let expected = x"39d864265618d79b186623a2e8f27a900f5ded4e135d587271e724b9a1dcb506";
        assert!(got == expected, 2018);
    }
}
