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
        name = 'Treasury Strategy - oneLINK', 
        description = 'Treasury Strategy - oneLINK',
        url = 'ichi.org'


    let token,
        admin,
        strategy,
        factory

    if (chainId == 1) {
        token = '0xcA37530E7c5968627BE470081d1C993eb1dEaf90'  //oneDODO mainnet
        factory = await deployments.get("OneTokenFactory")

        strategy = await deploy('Arbitrary', {
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
    } else if(chainId == 4) {
        token = '0xFdDDEFcA97574fc5B7210d53f3616F06Dd82B7Ef'
        factory = '0x4F0bEe469535A40880cC03484aEF4f2512480257'
        strategy = await deploy('Arbitrary', {
            from: deployer,
            args: [factory,token, description],  
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

module.exports.tags = ["oneLinkTestStrategy"]