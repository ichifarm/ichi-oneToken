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
        name = 'Treasury Strategy - oneWING', 
        description = 'Treasury Strategy - oneWING',
        url = 'ichi.org'


    let token,
        admin,
        strategy

    if (chainId == 1) {
        token = '0x5047fc5C9D7c49Ab22e390d13646a6A3a2476eff'  //oneWING mainnet
        const factory = await deployments.get("OneTokenFactory")

        strategy = await deploy('RiskHarborStrategy', {
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

module.exports.tags = ["oneWINGStrategy"]
module.exports.dependencies = ["oneTokenFactory"]