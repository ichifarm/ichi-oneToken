const { ethers } = require("hardhat")

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
        name = "OneTokenV1"
        url = "ichi.org"

    const
        factory = await deployments.get("OneTokenFactory")
        Admin = await ethers.getContractFactory("OneTokenFactory")
        admin = Admin.attach(factory.address)

    const oneTokenV1 = await deploy("OneTokenV1", {
        from: deployer,
        log: true,
        deterministicDeployment: false
    })

    const exist = await admin.moduleInfo(oneTokenV1.address)
    if (exist['name'] != name) {
        await admin.admitModule(oneTokenV1.address, moduleType.version, name, url, {
            from: deployer
        })
    }   

}

module.exports.tags = ["oneTokenV1","init"]
module.exports.dependencies = ["oneTokenFactory"]