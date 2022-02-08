module.exports = async function({ ethers: { getNamedSigner }, getNamedAccounts, deployments }) {
    const { deploy } = deployments
  
    const { deployer, dev } = await getNamedAccounts()
  
    const chainId = await getChainId()

    const oneTokenV1 = await deployments.get("OneTokenV1")

    if (chainId != 31337) { //don't verify contract on localnet
     
                await hre.run("verify:verify", {
                    address: oneTokenV1.address
                })
      
        
    }

}

module.exports.tags = ["oneTokenV1Verify","verify", "polygon-verify"]
module.exports.dependencies = ["oneTokenV1"]