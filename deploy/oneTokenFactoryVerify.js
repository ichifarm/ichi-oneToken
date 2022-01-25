module.exports = async function({ ethers: { getNamedSigner }, getNamedAccounts, deployments }) {
    const { deploy } = deployments
  
    const { deployer, dev } = await getNamedAccounts()
  
    const chainId = await getChainId()

    const factory = await deployments.get("OneTokenFactory")

    await hre.run("verify:verify", {
        address: factory.address
    })
}

module.exports.tags = ["oneTokenFactoryVerify","verify"]
module.exports.dependencies = ["oneTokenFactory"]

// don't verify contract on localnet
module.exports.skip = async() =>
    ['hardhat', 'localhost'].includes(network.config.name)