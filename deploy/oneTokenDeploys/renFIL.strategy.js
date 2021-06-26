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
        name = 'Treasury Strategy - oneFIL', 
        description = 'Treasury Strategy - oneFIL',
        url = 'ichi.org'


    let token,
        admin,
        strategy

    if (chainId == 42) {
        token = '0x50633E780803b56a0d8606a3C674993080Ea98c1' //oneFIL kovan
        const factory = await deployments.get("OneTokenFactory")
        const Admin = await ethers.getContractFactory("OneTokenFactory")
        admin = Admin.attach(factory.address)

        strategy = await deploy('Arbitrary', {
            from: deployer,
            args: [factory.address,token, description],  
            log: true
        })
        await admin.admitModule(strategy.address, moduleType.strategy, name, url, {
            from: deployer
        })
    } else if (chainId == 1) {
        token = '0x6d82017e55b1D24C53c7B33BbB770A86f2ca229D'  //oneFIL mainnet
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

module.exports.tags = ["renFILStrategy"]
module.exports.dependencies = ["oneTokenFactory"]