const { network } = require('hardhat')
const { factory } = require("typescript")

const configs = {
    "1": {
        usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        chainlinkAddress: "0xf4030086522a5beea4988f8ca5b36dbc97bee88c"
    },
    "137": {
        usdc: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
        chainlinkAddress: "0xA338e0492B2F944E9F8C0653D3AD1484f2657a37"
    }
}

module.exports = async function({ ethers: { getNamedSigner }, getNamedAccounts, deployments }) {
    const { deploy } = deployments
  
    const { deployer, dev } = await getNamedAccounts()
  
    const chainId = await getChainId()
    const config = configs[chainId];

    const moduleType = {
        version: 0,
        controller: 1,
        strategy: 2,
        mintMaster: 3,
        oracle: 4,
        voterRoll: 5
    }

    const 
        name = 'wBTC/USD Oracle',
        url = 'https://data.chain.link/ethereum/mainnet/crypto-usd/btc-usd'

    const factory = await deployments.get("OneTokenFactory")

    const oracle = await deploy('OneINCHOracle', {
        from: deployer,
        args: [factory.address, name, config.usdc, config.chainlinkAddress],  
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

module.exports.tags = ["OneBTCOracle", "mainnet", "polygon"]
module.exports.dependencies = ["oneTokenFactory"]
module.exports.skip = async() =>
    !["1", "137"].includes(await getChainId())