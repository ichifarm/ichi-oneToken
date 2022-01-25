const { network } = require('hardhat')
const { factory } = require("typescript")

const configs = {
    1: {
        token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    },
    4: {
        token: "0xE491A18E0338e7C9edc806F951AE4948f302360F"
    },
    137: {
        token: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174"
    },
    80001: {
        token: "0xe6b8a5cf854791412c1f6efc7caf629f5df1c747"
    }

}

module.exports = async function({ ethers: { getNamedSigner }, getNamedAccounts, deployments }) {
    const { deploy } = deployments
  
    const { deployer, dev } = await getNamedAccounts()
  
    const chainId = await getChainId()

    const moduleType = {
        version: 0,
        controller: 1,
        strategy: 2,
        mintMaster: 3,
        oracle: 4,
        voterRoll: 5
    }

    const 
        name = 'Chainlink Oracle USD',
        url = 'https://data.chain.link/?search=USD'

    const config = configs[network.config.chainId]

    const factory = await deployments.get("OneTokenFactory")

    const oracle = await deploy('ChainlinkOracleUSD', {
        from: deployer,
        args: [factory.address, name, config.token],  
        log: true
    })
    console.log('*************************************************************')
    console.log('admitModule')
    console.log('module (address): ',oracle.address)
    console.log('moduleType (uint8): ',moduleType.oracle)
    console.log('name (string): ',name)
    console.log('url (string): ',url)
    console.log('*************************************************************')
}

module.exports.tags = ["chainlinkOracleUSD"]
module.exports.dependencies = ["oneTokenFactory"]