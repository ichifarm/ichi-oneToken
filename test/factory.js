const { assert } = require("chai");
const truffleAssert = require('truffle-assertions');

const 
    OneToken = artifacts.require("OneTokenV1"),
    Factory = artifacts.require("OneTokenFactory"),
    ControllerNull = artifacts.require("NullController"),
    MintMasterIncremental = artifacts.require("Incremental"),
    OraclePegged = artifacts.require("ICHIPeggedOracle"),
    MemberToken = artifacts.require("MemberToken"),
    CollateralToken = artifacts.require("CollateralToken");

const 
    versionName = "OneTokenV1",
    newVersionName = "OneToken Version MK I",
    controllerName = "Null Controller",
    mintMasterName = "Simple Incremental",
    oracleName = "CTTest-Pegged Oracle",
    newOracleName = "New CTTest-Pegged Oracle";
    url = "#";

const
    oneTokenName = "OneToken Instance",
    symbol = "OTI";

const moduleType = {
    version: 0, 
    controller: 1, 
    strategy: 2, 
    mintMaster: 3, 
    oracle: 4, 
    voterRoll: 5
}

let governance,
    version,
    factory,
    oneToken,
    controller,
    mintMaster,
    oracle,
    memberToken,
    collateralToken;

contract("Factory", accounts => {

    beforeEach(async () => {
        governance = accounts[0];
        let oneTokenAddress;
        version = await OneToken.deployed();
        factory = await Factory.deployed();
        controller = await ControllerNull.deployed();
        mintMaster = await MintMasterIncremental.deployed();
        oracle = await OraclePegged.deployed();
        memberToken = await MemberToken.deployed();
        collateralToken = await CollateralToken.deployed();
        oneTokenAddress = await factory.oneTokenAtIndex(0);
        oneToken = await OneToken.at(oneTokenAddress);
    });
    
    it("should be ready to test", async () => {
        assert.isAtLeast(accounts.length, 2, "There are not at least two accounts to work with");
    });

    it("should enumerate the factory state", async () => {
        let oneTokenCount = await factory.oneTokenCount();
        let moduleCount = await factory.moduleCount();
        let controllerIsModule = await factory.isModule(controller.address);
        let mmIsModule = await factory.isModule(mintMaster.address);
        let oracleIsModule = await factory.isModule(oracle.address);
        let versionIsModule = await factory.isModule(version.address);

        let controllerInfo = await factory.moduleInfo(controller.address);
        let mintMasterInfo = await factory.moduleInfo(mintMaster.address);
        let oracleInfo = await factory.moduleInfo(oracle.address);
        let versionInfo = await factory.moduleInfo(version.address);

        let isContoller = await factory.isValidModuleType(controller.address, moduleType.controller);
        let isMintMaster = await factory.isValidModuleType(mintMaster.address, moduleType.mintMaster);
        let isOracle = await factory.isValidModuleType(oracle.address, moduleType.oracle);
        let isVersion = await factory.isValidModuleType(version.address, moduleType.version);

        let memberTokenIsCollateral = await factory.isCollateral(memberToken.address);
        let collateralTokenIsCollateral = await factory.isCollateral(collateralToken.address);
        let oneTokenIsCollateral = await factory.isCollateral(oneToken.address);

        let foreignTokenCount = await factory.foreignTokenCount();
        let memberTokenInfo = await factory.foreignTokenInfo(memberToken.address);
        let collateralTokenInfo = await factory.foreignTokenInfo(collateralToken.address);
        let oneTokenInfo = await factory.foreignTokenInfo(oneToken.address); // oneTokens are de facto collateral

        let memberTokenOracle = await factory.foreignTokenOracleAtIndex(memberToken.address, 0);
        let collateralTokenOracle = await factory.foreignTokenOracleAtIndex(collateralToken.address, 0);
        let oneTokenOracle = await factory.foreignTokenOracleAtIndex(oneToken.address, 0);

        assert.strictEqual(parseInt(oneTokenCount.toString(10)), 1, "There is not exactly 1 oneToken");
        assert.strictEqual(parseInt(moduleCount.toString(10)), 4, "There are not exactly 4 modules");

        assert.strictEqual(controllerIsModule, true, "the controller is not a registered module");
        assert.strictEqual(mmIsModule, true, "the mintMaster is not a registered module");
        assert.strictEqual(oracleIsModule, true, "the oracle is not a registered module");
        assert.strictEqual(versionIsModule, true, "version is not a registered module");

        assert.strictEqual(controllerInfo["name"], controllerName, "controller is mislabeled");
        assert.strictEqual(controllerInfo["url"], url, "controller url not as specified");
        assert.strictEqual(parseInt(controllerInfo["moduleType"]), moduleType.controller, "controller is mis-typed");
        assert.strictEqual(isContoller, true, "controller is not valid");
        
        assert.strictEqual(mintMasterInfo["name"], mintMasterName, "mintMaster is mislabeled");
        assert.strictEqual(mintMasterInfo["url"], url, "mintmaster url not as specified");
        assert.strictEqual(parseInt(mintMasterInfo["moduleType"]), moduleType.mintMaster, "mintMaster is mis-typed");        
        assert.strictEqual(isMintMaster, true, "mintMaster is not valid");

        assert.strictEqual(oracleInfo["name"], oracleName, "oracleis mislabeled");
        assert.strictEqual(oracleInfo["url"], url, "oracle url not as specified");
        assert.strictEqual(parseInt(oracleInfo["moduleType"]), moduleType.oracle, "oracle is mis-typed");
        assert.strictEqual(isOracle, true, "oracle is not valid");
        
        assert.strictEqual(versionInfo["name"], versionName, "version is mislabeled");
        assert.strictEqual(versionInfo["url"], url, "version url not as specified");
        assert.strictEqual(parseInt(versionInfo["moduleType"]), moduleType.version, "version is mis-typed");
        assert.strictEqual(isVersion, true, "version is not valid");

        assert.strictEqual(memberTokenIsCollateral, false, "member token returns collateral, true");
        assert.strictEqual(collateralTokenIsCollateral, true, "collateral token returns collateral, false");
        assert.strictEqual(oneTokenIsCollateral, true, "oneToken returns collateral false");

        assert.strictEqual(parseInt(foreignTokenCount.toString(10)), 3, "there are not exactly 3 foreign tokens");
        
        assert.strictEqual(memberTokenInfo["collateral"], false, "member token is marked collateral");
        assert.strictEqual(collateralTokenInfo["collateral"], true, "collateral token is not marked collateral");
        assert.strictEqual(oneTokenInfo["collateral"], true, "one token is not marked collateral");

        assert.strictEqual(parseInt(memberTokenInfo["oracleCount"].toString(10)), 1, "member token doesn't have exactly 1 oracle");
        assert.strictEqual(parseInt(collateralTokenInfo["oracleCount"].toString(10)), 1, "collateral token doesn't have exactly 1 oracle");
        assert.strictEqual(parseInt(oneTokenInfo["oracleCount"].toString(10)), 1, "oneToken doesn't have exactly 1 oracle");
        
        assert.strictEqual(memberTokenOracle, OraclePegged.address, "incorrect member token oracle");
        assert.strictEqual(collateralTokenOracle, OraclePegged.address, "incorrect collateral token oracle");
        assert.strictEqual(oneTokenOracle, OraclePegged.address, "incorrect oneToken oracle");      
    });

    it("should update module metadata", async () => {
        await factory.updateModule(version.address, newVersionName, url);
        let versionInfo = await factory.moduleInfo(version.address);
        assert.strictEqual(versionInfo["name"], newVersionName, "version was not renamed");
        assert.strictEqual(versionInfo["url"], url, "url was overwritten");
    });

    it("should admit a module", async () => {
        let moduleCount;
        let tokenOracleCount;
        let secondTokenOracle;

        let newOracle = await OraclePegged.new(newOracleName, collateralToken.address);
        await factory.admitModule(newOracle.address, moduleType.oracle, newOracleName, url);
        moduleCount = await factory.moduleCount();
        
        await factory.assignOracle(collateralToken.address, newOracle.address);
        tokenOracleCount = await factory.foreignTokenOracleCount(collateralToken.address);
        secondTokenOracle = await factory.foreignTokenOracleAtIndex(collateralToken.address,1);

        assert.strictEqual(parseInt(moduleCount.toString(10)), 5, "there are not exactly 5 modules now");
        assert.strictEqual(parseInt(tokenOracleCount.toString(10)), 2, "collateral doesn't have exactly two oracles");
        assert.strictEqual(secondTokenOracle, newOracle.address, "unexpected second collateral token oracle");
    });

    it("should remove a module", async () => {
        let moduleCount;
        let newModuleCount;
        let delta;
        moduleCount = await factory.moduleCount();
        await factory.removeModule(oracle.address);
        newModuleCount = await factory.moduleCount();
        delta = parseInt(moduleCount.toString(10)) - parseInt(newModuleCount.toString(10));
        assert.strictEqual(delta, 1, "the module count was not reduced by one");
    });
    
    it("should transfer governance", async () => {
        let checkOwner;
        let newOwner = accounts[1];

        checkOwner = await factory.owner();
        assert.strictEqual(checkOwner, governance, "incorrect factory ownership")
        await factory.transferOwnership(newOwner);
        checkOwner = await factory.owner();
        assert.strictEqual(checkOwner, newOwner, "incorrect new factory ownership");
        await factory.transferOwnership(governance, { from: newOwner });
        checkOwner = await factory.owner();
        assert.strictEqual(checkOwner, governance, "governance failed to recover factory ownership")        
    });

    it("should guard governance functions", async () => {

        let msg = "ICHIOwnable: caller is not the owner";

        await truffleAssert.reverts(
            factory.transferOwnership(accounts[1], { from: accounts[1] }), msg);
        await truffleAssert.reverts(
            factory.admitModule(oracle.address, moduleType.oracle, "name", "url", { from: accounts[1] }), msg);
        await truffleAssert.reverts(
            factory.updateModule(oracle.address, "new name", "new url", { from: accounts[1] }), msg);
        await truffleAssert.reverts(
            factory.removeModule(oracle.address, { from: accounts[1] }), msg);
        await truffleAssert.reverts(
            factory.admitForeignToken(memberToken.address, collateralToken.address, oracle.address, { from: accounts[1] }), msg);
        await truffleAssert.reverts(
            factory.updateForeignToken(memberToken.address, false, { from: accounts[1] }), msg);
        await truffleAssert.reverts(
            factory.removeOracle(memberToken.address, oracle.address, { from: accounts[1] }), msg);
        await truffleAssert.reverts(
            factory.assignOracle(memberToken.address, oracle.address, { from: accounts[1] }), msg);
    });

    it("should deploy a token", async () => {
        governance = accounts[0];
        factory = await Factory.deployed();
        version = await OneToken.deployed();
        controllerNull = await ControllerNull.deployed();
        mintMasterIncremental = await MintMasterIncremental.deployed();
        oraclePegged = await OraclePegged.deployed();
        memberToken = await MemberToken.deployed();
        collateralToken = await CollateralToken.deployed();

        await factory.admitModule(oraclePegged.address, moduleType.oracle, oracleName, url);      

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

        let oneTokenCount = await factory.oneTokenCount();

        assert.strictEqual(parseInt(oneTokenCount.toString(10)), 2, "there are not exactly 2 oneTokens deployed");
    });
});


