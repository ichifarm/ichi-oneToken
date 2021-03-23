const 
    ProxyAdmin = artifacts.require("OneTokenProxyAdmin"),
    Factory = artifacts.require("OneTokenFactory"),
    OneToken = artifacts.require("OneTokenV1"),
    ControllerNull = artifacts.require("NullController"),
    MintMasterIncremental = artifacts.require("Incremental"),
    OraclePegged = artifacts.require("ICHIPeggedOracle"),
    MemberToken = artifacts.require("MemberToken"),
    CollateralToken = artifacts.require("CollateralToken");

var governance,
    proxyAdmin,
    factory,
    version,
    controllerNull,
    mintMasterIncremental,
    oraclePegged,
    memberToken,
    collateralToken,
    oneTokenAddress;  

module.exports = async function (deployer, network, accounts) {
    
    governance = accounts[0];
    proxyAdmin = await ProxyAdmin.deployed();
    factory = await Factory.deployed();
    version = await OneToken.deployed();
    controllerNull = await ControllerNull.deployed();
    mintMasterIncremental = await MintMasterIncremental.deployed();
    oraclePegged = await OraclePegged.deployed();
    memberToken = await MemberToken.deployed();
    collateralToken = await CollateralToken.deployed();

    oneTokenAddress = await factory.oneTokenAtIndex(0);
    
    console.log("*************************************************************");
    console.log("* governance:", governance);
    console.log("* proxyAdmin:", proxyAdmin.address);
    console.log("* factory:", factory.address);
    console.log("* implementation:", version.address);
    console.log("* controller, null:", controllerNull.address);
    console.log("* mintmaster:", mintMasterIncremental.address);
    console.log("* oraclePegged:", oraclePegged.address);
    console.log("* member token:", memberToken.address);
    console.log("* collateral token:", collateralToken.address);
    console.log("* oneToken:", oneTokenAddress);
    console.log("*************************************************************");
};
