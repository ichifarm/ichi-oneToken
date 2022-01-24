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
        name = 'Chainlink Oracle USD',
        url = 'https://data.chain.link/?search=USD'

    let token,
        admin,
        oracle

    if (chainId == 1) {
        const tokenAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'  //usdc indextoken
        const factory = await deployments.get("OneTokenFactory")

        oracle = await deploy('ChainlinkOracleUSD', {
            from: deployer,
            args: [factory.address, name, tokenAddress],  
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

        oracle = await deploy('ChainlinkOracleUSD', {
            from: deployer,
            args: [factory.address, name, tokenAddress],  
            log: true
        })

        console.log('Chainlink Oracle USD: ',oracle.address)
    }

    
    

}

module.exports.tags = ["chainlinkOracleUSD"]
module.exports.dependencies = ["oneTokenFactory"]

module.exports.skip = async() =>
    !["1", "137"].includes(await getChainId())