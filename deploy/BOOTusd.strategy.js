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
        name = 'Treasury Strategy - BOOTusd', 
        description = 'Treasury Strategy - BOOTusd',
        url = 'ichi.org'


    let token,
        admin,
        strategy

    if (chainId == 1) {
        token = '0x78a3B2f1e7eec1073088ea4a193618743F81cEf8'  //BOOTusd mainnet
        const factory = await deployments.get("OneTokenFactory")

        strategy = await deploy('ArbitraryV2', {
            from: deployer,
            args: [factory.address,token, description],  
            log: true
        })
        console.log('*************************************************************')
        console.log('admitModule')
        console.log('module (address): ',strategy.address)
        console.log('moduleType (uint8): ',moduleType.strategy)
        console.log('name (string): ',name)
        console.log('url (string): ',url)
        console.log('*************************************************************')
    }

    
    

}

module.exports.tags = ["BOOTusdStrategy"]
module.exports.dependencies = ["oneTokenFactory"]