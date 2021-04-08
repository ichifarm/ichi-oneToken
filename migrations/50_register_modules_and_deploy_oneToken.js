const { ethers } = require("hardhat");

const
    Factory = artifacts.require("OneTokenFactory"),
    OneToken = artifacts.require("OneTokenV1"),
    ControllerNull = artifacts.require("NullController"),
    MintMasterIncremental = artifacts.require("Incremental"),
    OraclePegged = artifacts.require("ICHIPeggedOracle"),
    TestOracle = artifacts.require("TestOracle"),
    TestMintMaster = artifacts.require("TestMintMaster"),
    MemberToken = artifacts.require("MemberToken"),
    CollateralToken = artifacts.require("CollateralToken");

const
    oneTokenName = "OneToken Instance",
    symbol = "OTI",
    versionName = "OneTokenV1",
    controllerName = "Null Controller",
    mintMasterName = "Simple Incremental",
    oracleName = "CTTest-Pegged Oracle",
    testOracleName = "ICHI Test Oracle",
    testMintMasterName = "Test Incremental Mist Master";
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
    testOracle,
    testMintMaster,
    memberToken,
    collateralToken;

module.exports = async () => {
    
    const [governance] = await ethers.getSigners();
    
    factory = await Factory.deployed();
    version = await OneToken.deployed();
    controllerNull = await ControllerNull.deployed();
    mintMasterIncremental = await MintMasterIncremental.deployed();
    oraclePegged = await OraclePegged.deployed();
    testOracle = await TestOracle.deployed();
    testMintMaster = await TestMintMaster.deployed();
    memberToken = await MemberToken.deployed();
    collateralToken = await CollateralToken.deployed();

    // enum ModuleType { Version, Controller, Strategy, MintMaster, Oracle, VoterRoll }

    await factory.admitModule(version.address, moduleType.version, versionName, url);
    await factory.admitModule(controllerNull.address, moduleType.controller, controllerName, url);
    await factory.admitModule(mintMasterIncremental.address, moduleType.mintMaster, mintMasterName, url);
    await factory.admitModule(oraclePegged.address, moduleType.oracle, oracleName, url);
    await factory.admitModule(testOracle.address, moduleType.oracle, testOracleName, url);
    await factory.admitModule(testMintMaster.address, moduleType.mintMaster, testMintMasterName, url);

    await factory.admitForeignToken(memberToken.address, false, oraclePegged.address);
    await factory.admitForeignToken(collateralToken.address, true, oraclePegged.address);

    await factory.deployOneTokenProxy(
        oneTokenName,
        symbol,
        governance.address,
        version.address,
        controllerNull.address,
        mintMasterIncremental.address,
        oraclePegged.address,
        memberToken.address,
        collateralToken.address
    )

    let oneTokenAddress = await factory.oneTokenAtIndex(0);

    // console.log("*************************************************************");
    // console.log("* oneToken:", oneTokenAddress);
    // console.log("*************************************************************");
};
