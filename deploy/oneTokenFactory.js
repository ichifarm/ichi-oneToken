module.exports = async function({ ethers: { getNamedSigner }, getNamedAccounts, deployments }) {
    const { deploy } = deployments
  
    const { deployer, dev } = await getNamedAccounts()
  
    const chainId = await getChainId()

    const factory = await deploy("OneTokenFactory", {
        from: deployer,
        log: true,
        deterministicDeployment: false
    })

}

module.exports.tags = ["oneTokenFactory","init","mainnet","polygon"]