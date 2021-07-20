const { factory } = require("typescript")

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
        name = 'TWAP WETH indexToken Uniswap (sushi) V2 24hr/1hr',
        url = 'https://v2.info.uniswap.org/home',
        hourly = 1 * 60 * 60,
        daily = hourly * 24,
        sushi_hash = '0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303'

    let token,
        admin,
        oracle

    if (chainId == 1) {
        const tokenAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'  //weth indextoken
        const uniFactory = '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac' //sushi uniswap v2 factory
        const factory = await deployments.get("OneTokenFactory")

        oracle = await deploy('UniswapOracleTWAPCompareV2', {
            from: deployer,
            args: [factory.address, uniFactory, tokenAddress, hourly, daily, sushi_hash],  
            log: true
        })
        console.log('*************************************************************')
        console.log('admitModule')
        console.log('module (address): ',oracle.address)
        console.log('moduleType (uint8): ',moduleType.oracle)
        console.log('name (string): ',name)
        console.log('url (string): ',url)
        console.log('*************************************************************')
    } else {
        const tokenAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'  //weth indextoken
        const uniFactory = '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac' //sushi uniswap v2 factory
        const factory = await deployments.get("OneTokenFactory")

        oracle = await deploy('UniswapOracleTWAPCompareV2', {
            from: deployer,
            args: [factory.address, uniFactory, tokenAddress, hourly, daily, sushi_hash],  
            log: true
        })

        console.log('UniswapOracleTWAPCompareV2: ',oracle.address)
    }

    
    

}

module.exports.tags = ["SushiOracleTWAPCompare"]
module.exports.dependencies = ["oneTokenFactory"]