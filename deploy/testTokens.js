module.exports = async function({ ethers: { getNamedSigner }, getNamedAccounts, deployments }) {
    const { deploy } = deployments
  
    const { deployer, dev } = await getNamedAccounts()
  
    const chainId = await getChainId()

    if (chainId != 1) { //don't deploy to mainnet
        await deploy("Token6", {
            from: deployer,
            log: true
        })
    
        await deploy("Token9", {
            from: deployer,
            log: true
        })
    
        await deploy("Token18", {
            from: deployer,
            log: true
        })
    }
    

}

module.exports.tags = ["testTokens","testToken"]