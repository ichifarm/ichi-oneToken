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
        factory = await deployments.get("OneTokenFactory")
        controller = await deployments.get("NullController")
    
    if (chainId != 31337) { //don't verify contract on localnet
        await hre.run("verify:verify", {
            address: controller.address,
            constructorArguments: [
                factory.address
            ],
        })
    }

}

module.exports.tags = ["nullControllerVerify","verify"]
module.exports.dependencies = ["oneTokenFactory","nullController"]