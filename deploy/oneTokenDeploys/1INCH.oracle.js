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
        name = '1INCH/USD Oracle',
        url = 'https://data.chain.link/ethereum/mainnet/crypto-usd/1inch-usd'

    let token,
        admin,
        oracle

    if (chainId == 1) {
        const tokenAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'  //usdc indextoken
        const factory = await deployments.get("OneTokenFactory")
        const chainlinkAddress = '0xc929ad75b72593967de83e7f7cda0493458261d9'
        

        oracle = await deploy('OneINCHOracle', {
            from: deployer,
            args: [factory.address, name, tokenAddress, chainlinkAddress],  
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
        const tokenAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'  //usdc indextoken
        const factory = await deployments.get("OneTokenFactory")
        const chainlinkAddress = '0xc929ad75b72593967de83e7f7cda0493458261d9'

        oracle = await deploy('OneINCHOracle', {
            from: deployer,
            args: [factory.address, name, tokenAddress, chainlinkAddress],  
            log: true
        })

        console.log('1INCH Oracle: ',oracle.address)
    }

    
    

}

module.exports.tags = ["OneINCHOracle"]
module.exports.dependencies = ["oneTokenFactory"]