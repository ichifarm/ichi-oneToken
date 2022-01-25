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
        name = "Basic Controller"
        url = "ichi.org"

    const
        factory = await deployments.get("OneTokenFactory")
        Admin = await ethers.getContractFactory("OneTokenFactory")
        admin = Admin.attach(factory.address)

    const controller = await deploy("NullController", {
        from: deployer,
        args: [factory.address],
        log: true,
        deterministicDeployment: false
    })

    const exist = await admin.modules(controller.address)
    if (exist['name'] != name) {
        await admin.admitModule(controller.address, moduleType.controller, name, url, {
            from: deployer
        })
    }

}

module.exports.tags = ["nullController","init","polygon"]
module.exports.dependencies = ["oneTokenFactory"]