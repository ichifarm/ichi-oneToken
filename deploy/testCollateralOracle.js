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
        name = "Collateral Pegged Test Oracle"
        url = "ichi.org"

    if (chainId != 1) { //don't deploy to mainnet
        const 
            collateralToken = await deployments.get("Token6")
            factory = await deployments.get("OneTokenFactory")
            Admin = await ethers.getContractFactory("OneTokenFactory")
            admin = Admin.attach(factory.address)

        const oracle = await deploy("ICHIPeggedOracle", {
            from: deployer,
            args: [factory.address, name, collateralToken.address],
            log: true
        })

        if (chainId != 31337) { //don't verify contract on localnet
            await hre.run("verify:verify", {
                address: oracle.address,
                constructorArguments: [
                    factory.address,
                    name,
                    collateralToken.address
                ],
            })
        }
    
        await admin.admitModule(oracle.address, moduleType.oracle, name, url, {
            from: deployer
        })
    }
    

}

module.exports.tags = ["testMemberTokenOracle","testToken"]
module.exports.dependencies = ["testTokens","oneTokenFactory"]