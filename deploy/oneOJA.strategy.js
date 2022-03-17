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
        name = 'Treasury Strategy - oneOJA', 
        description = 'Treasury Strategy - oneOJA',
        url = 'ichi.org'


    let token,
        admin,
        strategy

    if (chainId == 1) {
        token = '0xbB9E5DB6F357BB4dF35E8B90B37b8A3F33031D86'  //oneOJA mainnet
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

module.exports.tags = ["oneOJAStrategy"]
module.exports.dependencies = ["oneTokenFactory"]