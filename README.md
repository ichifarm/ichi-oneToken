# ICHI oneToken Factory

[![OneToken Tests](https://github.com/ichifarm/ichi-oneToken/actions/workflows/tests.yml/badge.svg)](https://github.com/ichifarm/ichi-oneToken/actions/workflows/tests.yml)

### Mainnet Addresses

- OneTokenFactory: https://etherscan.io/address/0xd0092632b9ac5a7856664eec1abb6e3403a6a36a
- OneTokenV1: https://etherscan.io/address/0x14356bf935d6a62f3b87ab89f729217599bc108d
- Basic Null Controller: https://etherscan.io/address/0x81c9932bd9a87e454710ef83551ac32dd808630e
- Incremental Mint Master: https://etherscan.io/address/0x58254B405E85359Fc7Eb3b8856bA82A4dD7C82E2

### Local Deployment

```
> yarn install
.
.
.
> yarn dev:deployTestToken
yarn run v1.22.4
$ hardhat --network hardhat deploy --tags init,testToken
Compiling 69 files with 0.7.6
Compilation finished successfully
Creating Typechain artifacts in directory types for target ethers-v5
Successfully generated Typechain artifacts!
deploying "OneTokenFactory" (tx: 0xf8996872e81f4e8e8d5d86703912e95ae60ab3642e3df843106074ca5d42dc2c)...: deployed at 0x5FbDB2315678afecb367f032d93F642f64180aa3 with 4175984 gas
deploying "Incremental" (tx: 0xb26b0197d61be039af3146de3125847c9c027c6c2a85342b225bef39058273c0)...: deployed at 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 with 1983710 gas
deploying "NullController" (tx: 0x592674e6aefd480e5b693a4703c91dac328d37cf13e782bcca31233e122179bb)...: deployed at 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 with 304324 gas
deploying "OneTokenV1" (tx: 0xe6afef3d97aa2373d721cf8503f27807dc660c61263e34a0b909af937deea46b)...: deployed at 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707 with 5231421 gas
deploying "Token6" (tx: 0x17d3aa06cec3635a7944a61595811c2f698e0f534061a79131b8ca75782abd8b)...: deployed at 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853 with 763350 gas
deploying "Token9" (tx: 0x87311258072225410cc3dafc15db5b7f62faccc9a6c9b30774656320586e7312)...: deployed at 0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6 with 763366 gas
deploying "Token18" (tx: 0x84bd8551cfb1c170be722634e89355651ce3431484f6098775629e60a251fc3b)...: deployed at 0x8A791620dd6260079BF849Dc5567aDC3F2FdC318 with 763446 gas
deploying "ICHIPeggedOracle" (tx: 0x829b19221d4800e8c28f00f6f0d05c1e5e5ace67fd080f56ff0591eeb22b77e1)...: deployed at 0x610178dA211FEF7D417bC0e6FeD39F05609AD788 with 883621 gas
deploying "TestOracle" (tx: 0x930c32c4500b855f6dd5e7fb40786abee555245a925fda237b4a95bf592619ae)...: deployed at 0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0 with 831316 gas
*************************************************************
* oneToken: 0xB7A5bd0345EF1Cc5E66bf61BdeC17D2461fBd968
*************************************************************
✨  Done in 15.71s.
```

### 🧐 RESOURCES
- Website: https://www.ichi.org/
- App: https://app.ichi.org
- Medium: https://medium.com/ichifarm
- Twitter: https://twitter.com/ichifoundation
- Discord: https://discord.gg/ichi-ichi-org-766688709814124595

### 💻 TECHNICAL
- Docs: https://docs.ichi.org/home/
- GitHub: https://github.com/ichifarm

### Licensing

The primary license for ICHI V2 oneToken is the Business Source License 1.1 (`BUSL-1.1`), see [`LICENSE`](./LICENSE).
