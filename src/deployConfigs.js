const { network } = require('hardhat')

const configs = {
  1: {
    usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  },
  4: {
    usdc: "0xE491A18E0338e7C9edc806F951AE4948f302360F"
  },
  137: {
    usdc: "TODO",
    wbtc: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
    wbtcUsdChainlinkOracle: '0xDE31F8bFBD8c84b5360CFACCa3539B938dd78ae6',
    governance: 'TODO' // TODO
  },
  80001: {
    usdc: "0xe6b8a5cf854791412c1f6efc7caf629f5df1c747",
    wbtc: "0x13EDD87281803AF4178E7b30631ab7Cbb6819441", // this is actuall TestToken6
    wbtcUsdChainlinkOracle: '0x007A22900a3B98143368Bd5906f8E17e9867581b',
    governance: '0x6D41E0096f332Af1Fab2ba21936ce120dE9244f2'
  },
}

const getCurrentConfig = () =>
  configs[network.config.chainId]

module.exports = { configs, getCurrentConfig }
