module.exports = async function({ ethers: { getNamedSigner }, getNamedAccounts, deployments }) {
    const { deploy } = deployments
  
    const { deployer, dev } = await getNamedAccounts()
  
    const chainId = await getChainId()

    if (chainId == 42) { //don't deploy to mainnet
        await deploy("RenFILMockToken", {
            from: deployer,
            log: true
        })
    }
    

}

module.exports.tags = ["renFILMockToken"]