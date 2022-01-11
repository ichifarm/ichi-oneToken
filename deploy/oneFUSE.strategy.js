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
        name = 'Treasury Strategy - oneFUSE', 
        description = 'Treasury Strategy - oneFUSE',
        url = 'ichi.org'


    let token,
        admin,
        strategy

    if (chainId == 1) {
        token = '0xBbcE03B2E7f53caDCA93251CA4c928aF01Db6404'  //oneFUSE mainnet
        const factory = await deployments.get("OneTokenFactory")

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
    }

    
    

}

module.exports.tags = ["oneFUSEStrategy"]
module.exports.dependencies = ["oneTokenFactory"]