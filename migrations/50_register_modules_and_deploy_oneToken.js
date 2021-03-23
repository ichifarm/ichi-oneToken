const 
    Factory = artifacts.require("OneTokenFactory"),
    OneToken = artifacts.require("OneTokenV1"),
    ControllerNull = artifacts.require("NullController"),
    MintMasterIncremental = artifacts.require("Incremental"),
    OraclePegged = artifacts.require("ICHIPeggedOracle"),
    MemberToken = artifacts.require("MemberToken"),
    CollateralToken = artifacts.require("CollateralToken");

const
    oneTokenName = "OneToken Instance",
    symbol = "OTI",
    versionName = "OneTokenV1",
    controllerName = "Null Controller",
    mintMasterName = "Simple Incremental",
    oracleName = "CTTest-Pegged Oracle",
    url = "#";

const moduleType = {
    version: 0, 
    controller: 1, 
    strategy: 2, 
    mintMaster: 3, 
    oracle: 4, 
    voterRoll: 5
}

var governance,
    factory,
    version,
    controllerNull,
    mintMasterIncremental,
    oraclePegged,
    memberToken,
    collateralToken;  

module.exports = async function (deployer, network, accounts) {
    
    governance = accounts[0];
    factory = await Factory.deployed();
    version = await OneToken.deployed();
    controllerNull = await ControllerNull.deployed();
    mintMasterIncremental = await MintMasterIncremental.deployed();
    oraclePegged = await OraclePegged.deployed();
    memberToken = await MemberToken.deployed();
    collateralToken = await CollateralToken.deployed();

    // enum ModuleType { Version, Controller, Strategy, MintMaster, Oracle, VoterRoll }

    await factory.admitModule(version.address, moduleType.version, versionName, url);
    await factory.admitModule(controllerNull.address, moduleType.controller, controllerName, url);
    await factory.admitModule(mintMasterIncremental.address, moduleType.mintMaster, mintMasterName, url);
    await factory.admitModule(oraclePegged.address, moduleType.oracle, oracleName, url);

    await factory.admitForeignToken(memberToken.address, false, oraclePegged.address);
    await factory.admitForeignToken(collateralToken.address, true, oraclePegged.address);

    await factory.deployOneTokenProxy(
        oneTokenName,
        symbol,
        governance,
        version.address,
        controllerNull.address,
        mintMasterIncremental.address,
        oraclePegged.address,
        memberToken.address,
        collateralToken.address
    )

    let oneTokenAddress = await factory.oneTokenAtIndex(0);

    console.log("*************************************************************");
    console.log("* oneToken:", oneTokenAddress);
    console.log("*************************************************************");
};
