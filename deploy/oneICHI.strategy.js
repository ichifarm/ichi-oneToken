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
        name = 'Treasury Strategy - oneICHI', 
        description = 'Treasury Strategy - oneICHI',
        url = 'ichi.org'


    let token,
        admin,
        strategy

    if (chainId == 1) {
        token = '0x4db2c02831c9ac305FF9311Eb661f80f1dF61e07'  //oneICHI mainnet
        const factory = await deployments.get("OneTokenFactory")

        strategy = await deploy('ArbitraryV3', {
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

module.exports.tags = ["oneICHIStrategy"]
module.exports.dependencies = ["oneTokenFactory"]