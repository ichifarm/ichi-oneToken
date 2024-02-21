module.exports = async function({ ethers: { getNamedSigner }, getNamedAccounts, deployments }) {
    const { deploy } = deployments
  
    const { deployer, dev } = await getNamedAccounts()
  
    const chainId = await getChainId()

    const factory = await deployments.get("OneTokenFactory")
    const oracle = await deployments.get("ICHIPeggedOracle")
    const name = "Pegged Oracle indexToken USDC"

    let USDCAddress

    if (chainId == 1) {
        USDCAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
    } else if(chainId == 42) {
        USDCAddress = '0x21632981cBf52eB788171e8dcB891C32F4834239'
    } else { 
        const token6 = await deployments.get("Token6")
        USDCAddress = token6.address
    }

    if (chainId == 42 || chainId == 1) { //don't verify contract on localnet
        await hre.run("verify:verify", {
            address: oracle.address,
            constructorArguments: [
                factory.address,
                name,
                USDCAddress
            ],
        })
    }

}

module.exports.tags = ["USDCindexOracleVerify","verify"]
module.exports.dependencies = ["USDCindexOracle"]