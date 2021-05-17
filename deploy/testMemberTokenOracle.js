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
        name = "MemberToken Test Oracle"
        url = "ichi.org"

    if (chainId != 1) { //don't deploy to mainnet
        const
            memberToken = await deployments.get("Token18")
            factory = await deployments.get("OneTokenFactory")
            Admin = await ethers.getContractFactory("OneTokenFactory")
            admin = Admin.attach(factory.address)

        const oracle = await deploy("TestOracle", {
            from: deployer,
            args: [factory.address, name, memberToken.address],
            log: true
        })
    
        await admin.admitModule(oracle.address, moduleType.oracle, name, url, {
            from: deployer
        })    
    }
    

}

module.exports.tags = ["testMemberTokenOracle","testToken"]
module.exports.dependencies = ["testTokens","oneTokenFactory"]