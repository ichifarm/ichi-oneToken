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
    
    await hre.run("verify:verify", {
        address: controller.address,
        constructorArguments: [
            factory.address
        ],
    })

}

module.exports.tags = ["nullControllerVerify","verify"]
module.exports.dependencies = ["oneTokenFactory","nullController"]

// don't verify contract on localnet
module.exports.skip = async() =>
    ["31337", "1337"].includes(await getChainId())