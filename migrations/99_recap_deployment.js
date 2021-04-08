const
    ProxyAdmin = artifacts.require("OneTokenProxyAdmin"),
    Factory = artifacts.require("OneTokenFactory"),
    OneToken = artifacts.require("OneTokenV1"),
    ControllerNull = artifacts.require("NullController"),
    MintMasterIncremental = artifacts.require("Incremental"),
    OraclePegged = artifacts.require("ICHIPeggedOracle"),
    TestOracle = artifacts.require("TestOracle"),
    TestMintMaster = artifacts.require("TestMintMaster"),
    MemberToken = artifacts.require("MemberToken"),
    CollateralToken = artifacts.require("CollateralToken");

var proxyAdmin,
    factory,
    version,
    controllerNull,
    mintMasterIncremental,
    oraclePegged,
    testOracle,
    testMintMaster,
    memberToken,
    collateralToken,
    oneTokenAddress;

module.exports = async () => {
    
    const [governance] = await ethers.getSigners();
    
    proxyAdmin = await ProxyAdmin.deployed();
    factory = await Factory.deployed();
    version = await OneToken.deployed();
    controllerNull = await ControllerNull.deployed();
    mintMasterIncremental = await MintMasterIncremental.deployed();
    oraclePegged = await OraclePegged.deployed();
    testOracle = await TestOracle.deployed();
    testMintMaster = await TestMintMaster.deployed();
    memberToken = await MemberToken.deployed();
    collateralToken = await CollateralToken.deployed();

    oneTokenAddress = await factory.oneTokenAtIndex(0);
    
    // console.log("*************************************************************");
    // console.log("* governance:", governance.address);
    // console.log("* proxyAdmin:", proxyAdmin.address);
    // console.log("* factory:", factory.address);
    // console.log("* implementation:", version.address);
    // console.log("* controller, null:", controllerNull.address);
    // console.log("* mintmaster:", mintMasterIncremental.address);
    // console.log("* oraclePegged:", oraclePegged.address);
    // console.log("* testOracle:", testOracle.address);
    // console.log("* member token:", memberToken.address);
    // console.log("* collateral token:", collateralToken.address);
    // console.log("* oneToken:", oneTokenAddress);
    // console.log("*************************************************************");
};
