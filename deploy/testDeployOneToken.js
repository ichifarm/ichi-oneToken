// example deploy of a oneToken from the factory

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
        name = "OneToken Instance"
        url = "ichi.org"
        symbol = "OTI",
        versionName = "OneTokenV1"

    const
        collateralToken = await deployments.get("Token6")
        memberToken = await deployments.get("Token18")
        collateralOracle = await deployments.get("ICHIPeggedOracle")
        memberOracle = await deployments.get("TestOracle")
        factory = await deployments.get("OneTokenFactory")
        Admin = await ethers.getContractFactory("OneTokenFactory")
        admin = Admin.attach(factory.address)
        oneTokenV1 = await deployments.get("OneTokenV1")
        controllerNull = await deployments.get("NullController")
        mintMasterIncremental = await deployments.get("Incremental")
    
    await admin.admitForeignToken(memberToken.address, false, memberOracle.address, {
        from: deployer
    })

    await admin.admitForeignToken(collateralToken.address, true, collateralOracle.address, {
        from: deployer
    })


    await admin.deployOneTokenProxy(
        name,
        symbol,
        deployer,
        oneTokenV1.address,
        controllerNull.address,
        mintMasterIncremental.address,
        collateralOracle.address,
        memberToken.address,
        collateralToken.address
    )

    let oneTokenAddress = await admin.oneTokenAtIndex(await admin.oneTokenCount() - 1)

    console.log("*************************************************************")
    console.log("* oneToken: "+ oneTokenAddress)
    console.log("*************************************************************")
}

module.exports.tags = ["testOneToken","testToken"]
module.exports.dependencies = ["oneTokenFactory","nullController","mintMasterIncremental","testTokens","testMemberTokenOracle","testCollateralTokenOracle"]

module.exports.skip = async() =>
    ["1", "137"].includes(await getChainId())