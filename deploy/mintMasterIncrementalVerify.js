module.exports = async function({ ethers: { getNamedSigner }, getNamedAccounts, deployments }) {
    const { deploy } = deployments
  
    const { deployer, dev } = await getNamedAccounts()
  
    const chainId = await getChainId()

    const 
        mintMasterDesc = "Basic Incremental MintMaster"

    const
        factory = await deployments.get("OneTokenFactory")
        mintMaster = await deployments.get("Incremental")

    await hre.run("verify:verify", {
        address: mintMaster.address,
        constructorArguments: [
            factory.address,
            mintMasterDesc
        ],
    })
}

module.exports.tags = ["mintMasterIncrementalVerify","verify"]
module.exports.dependencies = ["oneTokenFactory","mintMasterIncremental"]

// don't verify contract on localnet
module.exports.skip = async()=>
    !["1", "137"].includes(await getChainId())