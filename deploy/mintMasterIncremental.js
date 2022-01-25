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
        name = "Simple Incremental"
        url = "ichi.org"
        mintMasterDesc = "Basic Incremental MintMaster"

    const
        factory = await deployments.get("OneTokenFactory")
        Admin = await ethers.getContractFactory("OneTokenFactory")
        admin = Admin.attach(factory.address)

    const mintMaster = await deploy("Incremental", {
        from: deployer,
        args: [factory.address,mintMasterDesc],
        log: true,
        deterministicDeployment: false
    })

    const exist = await admin.modules(mintMaster.address)
    if (exist['name'] != name) {
        await admin.admitModule(mintMaster.address, moduleType.mintMaster, name, url, {
            from: deployer
        })
    }
    

}

module.exports.tags = ["mintMasterIncremental","init","polygon"]
module.exports.dependencies = ["oneTokenFactory"]