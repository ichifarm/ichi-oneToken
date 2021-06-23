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
        name = 'renFIL/USD Oracle',
        url = 'https://data.chain.link/ethereum/mainnet/crypto-usd/fil-usd'

    let token,
        admin,
        oracle

    if (chainId == 42) {
        token = await deployments.get('RenFILMockToken')
        const factory = await deployments.get("OneTokenFactory")
        const Admin = await ethers.getContractFactory("OneTokenFactory")
        admin = Admin.attach(factory.address)

        oracle = await deploy('RenFILOracle', {
            from: deployer,
            args: [factory.address, name, token.address, '0xDA5904BdBfB4EF12a3955aEcA103F51dc87c7C39'],  //this points to uni chainlink oracle on kovan since FIL doesn't exist on kovan
            log: true
        })
        await admin.admitModule(oracle.address, moduleType.oracle, name, url, {
            from: deployer
        })
    } else if (chainId == 1) {
        const tokenAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'  //usdc indextoken
        const factory = await deployments.get("OneTokenFactory")
        const chainlinkAddress = '0x1A31D42149e82Eb99777f903C08A2E41A00085d3'
        

        oracle = await deploy('RenFILOracle', {
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
    }

    
    

}

module.exports.tags = ["renFILOracle"]
module.exports.dependencies = ["renFILMockToken","oneTokenFactory"]