const { assert } = require("chai");
const truffleAssert = require('truffle-assertions');
const { expectEvent } = require("@openzeppelin/test-helpers");

const
    OneToken = artifacts.require("OneTokenV1"),
    Factory = artifacts.require("OneTokenFactory"),
    ControllerNull = artifacts.require("NullController"),
    MintMasterIncremental = artifacts.require("Incremental"),
    OraclePegged = artifacts.require("ICHIPeggedOracle"),
    MemberToken = artifacts.require("MemberToken"),
    CollateralToken = artifacts.require("CollateralToken");

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

const
    versionName = "OneTokenV1",
    newVersionName = "OneToken Version MK I",
    controllerName = "Null Controller",
    mintMasterName = "Simple Incremental",
    oracleName = "CTTest-Pegged Oracle",
    newOracleName = "New CTTest-Pegged Oracle";
    tempOracleName = "Temp CTTest-Pegged Oracle";
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
        badAddress = accounts[1];
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
        let firstForeignToken = await factory.foreignTokenAtIndex(0);
        let secondForeignToken = await factory.foreignTokenAtIndex(1);
        let memberTokenInfo = await factory.foreignTokenInfo(memberToken.address);
        let collateralTokenInfo = await factory.foreignTokenInfo(collateralToken.address);
        let oneTokenInfo = await factory.foreignTokenInfo(oneToken.address); // oneTokens are de facto collateral

        let memberTokenOracle = await factory.foreignTokenOracleAtIndex(memberToken.address, 0);
        let collateralTokenOracle = await factory.foreignTokenOracleAtIndex(collateralToken.address, 0);
        let oneTokenOracle = await factory.foreignTokenOracleAtIndex(oneToken.address, 0);

        assert.strictEqual(parseInt(oneTokenCount.toString(10)), 1, "There is not exactly 1 oneToken");
        assert.strictEqual(parseInt(moduleCount.toString(10)), 6, "There are not exactly 5 modules");

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
        assert.strictEqual(firstForeignToken, memberToken.address, "the first foreign token is not the member token");
        assert.strictEqual(secondForeignToken, collateralToken.address, "the second foreign token is not the collateral token");
        
        assert.strictEqual(memberTokenInfo["collateral"], false, "member token is marked collateral");
        assert.strictEqual(collateralTokenInfo["collateral"], true, "collateral token is not marked collateral");
        assert.strictEqual(oneTokenInfo["collateral"], true, "one token is not marked collateral");

        assert.strictEqual(parseInt(memberTokenInfo["oracleCount"].toString(10)), 1, "member token doesn't have exactly 1 oracle");
        assert.strictEqual(parseInt(collateralTokenInfo["oracleCount"].toString(10)), 1, "collateral token doesn't have exactly 1 oracle");
        assert.strictEqual(parseInt(oneTokenInfo["oracleCount"].toString(10)), 1, "oneToken doesn't have exactly 1 oracle");
        
        assert.strictEqual(memberTokenOracle, oracle.address, "incorrect member token oracle");
        assert.strictEqual(collateralTokenOracle, oracle.address, "incorrect collateral token oracle");
        assert.strictEqual(oneTokenOracle, oracle.address, "incorrect oneToken oracle");
    });

    it("should update module metadata", async () => {
        let msg1 = "OneTokenFactory, Set: unknown module";
        await truffleAssert.reverts(factory.updateModule(badAddress, newVersionName, url), msg1);

        let tx = await factory.updateModule(version.address, newVersionName, url);
        let versionInfo = await factory.moduleInfo(version.address);
        assert.strictEqual(versionInfo["name"], newVersionName, "version was not renamed");
        assert.strictEqual(versionInfo["url"], url, "url was overwritten");

        expectEvent(tx, 'ModuleUpdated', {
			sender: governance,
            module: version.address,
			name: newVersionName,
            url: url
		})
    });

    it("should admit a module", async () => {
        let moduleCount,
            tokenOracleCount,
            secondTokenOracle,
            msg1 = "OneTokenFactory: invalid fingerprint for module type",
            msg2 = "OneTokenFactory: oracle is not registered.",
            msg3 = "OneTokenFactory, Set: unknown oracle";

        const factory = await Factory.deployed();
        let newOracle = await OraclePegged.new(factory.address, newOracleName, collateralToken.address);
        await truffleAssert.reverts(factory.admitModule(newOracle.address, moduleType.mintMaster, newOracleName, url), msg1);
        let tx = await factory.admitModule(newOracle.address, moduleType.oracle, newOracleName, url);
        moduleCount = await factory.moduleCount();

        expectEvent(tx, 'ModuleAdmitted', {
			sender: governance,
            module: newOracle.address,
            moduleType: moduleType.oracle.toString(),
			name: newOracleName,
            url: url
		})

        let moduleAtIndex = await factory.moduleAtIndex(moduleCount-1);
        assert.strictEqual(newOracle.address, moduleAtIndex, "moduleAtIndex should return correct module address");
        
        await factory.assignOracle(collateralToken.address, newOracle.address);
        tokenOracleCount = await factory.foreignTokenOracleCount(collateralToken.address);
        secondTokenOracle = await factory.foreignTokenOracleAtIndex(collateralToken.address,1);

        assert.strictEqual(parseInt(moduleCount.toString(10)), 7, "there are not exactly 6 modules now");
        assert.strictEqual(parseInt(tokenOracleCount.toString(10)), 2, "collateral doesn't have exactly two oracles");
        assert.strictEqual(secondTokenOracle, newOracle.address, "unexpected second collateral token oracle");

        // check fail conditions for admitForeignToken
        await truffleAssert.reverts(
            factory.admitForeignToken(memberToken.address, collateralToken.address, badAddress, { from: governance }), msg2);
        await truffleAssert.reverts(
            factory.admitForeignToken(memberToken.address, collateralToken.address, version.address, { from: governance }), msg3);
    
    });

    it("should remove a module", async () => {
        let moduleCount;
        let newModuleCount;
        let delta;
        let msg1 = "OneTokenFactory, Set: unknown module";

        await truffleAssert.reverts(factory.removeModule(badAddress), msg1);

        moduleCount = await factory.moduleCount();
        let tx = await factory.removeModule(oracle.address);
        newModuleCount = await factory.moduleCount();
        delta = parseInt(moduleCount.toString(10)) - parseInt(newModuleCount.toString(10));
        assert.strictEqual(delta, 1, "the module count was not reduced by one");

        expectEvent(tx, 'ModuleRemoved', {
			sender: governance,
            module: oracle.address
		})
    });
    
    it("should assign and remove an oracle", async () => {
        let tokenOracleCount;
        let msg1 = "OneTokenFactory: unknown foreign token",
            msg2 = "OneTokenFactory: Internal error checking oracle",
            msg3 = "OneTokenFactory: Oracle Index Token is not registered collateral",
            msg4 = "OneTokenFactory: oracle is not registered.";

        const factory = await Factory.deployed();
        let newOracle = await OraclePegged.new(factory.address, tempOracleName, collateralToken.address);
        await factory.admitModule(newOracle.address, moduleType.oracle, tempOracleName, url);
        moduleCount = await factory.moduleCount();

        // should fail with bad inputs
        await truffleAssert.reverts(factory.assignOracle(collateralToken.address, badAddress), msg4);
        await truffleAssert.reverts(factory.assignOracle(badAddress, newOracle.address), msg1);
        await truffleAssert.reverts(factory.assignOracle(collateralToken.address, version.address), msg2);
        
		let badToken = await OneToken.new();
        let badOracle = await OraclePegged.new(factory.address, tempOracleName, badToken.address);
		await factory.admitModule(badOracle.address, moduleType.oracle, "badOracle", "#");
		await factory.admitForeignToken(badToken.address, false, badOracle.address);
        await truffleAssert.reverts(factory.assignOracle(collateralToken.address, badOracle.address), msg3);

        let tx = await factory.assignOracle(collateralToken.address, newOracle.address);
        expectEvent(tx, 'AddOracle', {
			sender: governance,
            foreignToken: collateralToken.address,
            oracle: newOracle.address
		})
        tokenOracleCount = await factory.foreignTokenOracleCount(collateralToken.address);
        assert.strictEqual(parseInt(tokenOracleCount.toString(10)), 3, "collateral doesn't have exactly three oracles");
        tx = await factory.removeOracle(collateralToken.address, newOracle.address);
        expectEvent(tx, 'RemoveOracle', {
			sender: governance,
            foreignToken: collateralToken.address,
            oracle: newOracle.address
		})

        tokenOracleCount = await factory.foreignTokenOracleCount(collateralToken.address);
        assert.strictEqual(parseInt(tokenOracleCount.toString(10)), 2, "collateral doesn't have exactly two oracles");
    });

    it("should transfer governance", async () => {
        let checkOwner;
        let newOwner = accounts[1];

        checkOwner = await factory.owner();
        assert.strictEqual(checkOwner, governance, "incorrect factory ownership")
        await factory.transferOwnership(newOwner);
        checkOwner = await factory.owner();
        assert.strictEqual(checkOwner, newOwner, "incorrect new factory ownership");
        let tx = await factory.transferOwnership(governance, { from: newOwner });
        checkOwner = await factory.owner();
        assert.strictEqual(checkOwner, governance, "governance failed to recover factory ownership")

        expectEvent(tx, 'OwnershipTransferred', {
            previousOwner: newOwner,
			newOwner: governance
		})
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
        let msg1 = "OneTokenFactory: token name is required",
            msg2 = "OneTokenfactory: token symbol is required",
            msg3 = "OneTokenFactory: governance address is required",
            msg4 = "OneTokenFactory: version is not approved",
            msg5 = "OneTokenFactory: controller is not approved",
            msg6 = "OneTokenFactory: mintMaster is not approved",
            msg7 = "OneTokenFactory: oneTokenOracle is not approved",
            msg8 = "OneTokenFactory: version, wrong MODULE_TYPE",
            msg9 = "OneTokenFactory: controller, wrong MODULE_TYPE",
            msg10 = "OneTokenFactory: mintMaster, wrong MODULE_TYPE",
            msg11 = "OneTokenFactory: oneTokenOracle, wrong MODULE_TYPE",
            msg12 = "OneTokenFactory: unknown member token",
            msg13 = "OneTokenFactory: unknown collateral",
            msg14 = "OneTokenFactory: specified token is not recognized as collateral";

        governance = accounts[0];
        factory = await Factory.deployed();
        version = await OneToken.deployed();
        controllerNull = await ControllerNull.deployed();
        mintMasterIncremental = await MintMasterIncremental.deployed();
        oraclePegged = await OraclePegged.deployed();
        memberToken = await MemberToken.deployed();
        collateralToken = await CollateralToken.deployed();

        await factory.admitModule(oraclePegged.address, moduleType.oracle, oracleName, url);

        // all these should fail
        await truffleAssert.reverts(factory.deployOneTokenProxy("", symbol, governance,
            version.address, controllerNull.address, mintMasterIncremental.address,
            oraclePegged.address, memberToken.address, collateralToken.address), msg1);
        await truffleAssert.reverts(factory.deployOneTokenProxy(oneTokenName, "", governance,
            version.address, controllerNull.address, mintMasterIncremental.address,
            oraclePegged.address, memberToken.address, collateralToken.address), msg2);
        await truffleAssert.reverts(factory.deployOneTokenProxy(oneTokenName, symbol, NULL_ADDRESS,
            version.address, controllerNull.address, mintMasterIncremental.address,
            oraclePegged.address, memberToken.address, collateralToken.address), msg3);
        await truffleAssert.reverts(factory.deployOneTokenProxy(oneTokenName, symbol, governance,
            badAddress, controllerNull.address, mintMasterIncremental.address,
            oraclePegged.address, memberToken.address, collateralToken.address), msg4);
        await truffleAssert.reverts(factory.deployOneTokenProxy(oneTokenName, symbol, governance,
            version.address, badAddress, mintMasterIncremental.address,
            oraclePegged.address, memberToken.address, collateralToken.address), msg5);
        await truffleAssert.reverts(factory.deployOneTokenProxy(oneTokenName, symbol, governance,
            version.address, controllerNull.address, badAddress,
            oraclePegged.address, memberToken.address, collateralToken.address), msg6);
        await truffleAssert.reverts(factory.deployOneTokenProxy(oneTokenName, symbol, governance,
            version.address, controllerNull.address, mintMasterIncremental.address,
            badAddress, memberToken.address, collateralToken.address), msg7);
        await truffleAssert.reverts(factory.deployOneTokenProxy(oneTokenName, symbol, governance,
            controllerNull.address, controllerNull.address, mintMasterIncremental.address,
            oraclePegged.address, memberToken.address, collateralToken.address), msg8);
        await truffleAssert.reverts(factory.deployOneTokenProxy(oneTokenName, symbol, governance,
            version.address, version.address, mintMasterIncremental.address,
            oraclePegged.address, memberToken.address, collateralToken.address), msg9);
        await truffleAssert.reverts(factory.deployOneTokenProxy(oneTokenName, symbol, governance,
            version.address, controllerNull.address, oraclePegged.address,
            oraclePegged.address, memberToken.address, collateralToken.address), msg10);
        await truffleAssert.reverts(factory.deployOneTokenProxy(oneTokenName, symbol, governance,
            version.address, controllerNull.address, mintMasterIncremental.address,
            mintMasterIncremental.address, memberToken.address, collateralToken.address), msg11);
        await truffleAssert.reverts(factory.deployOneTokenProxy(oneTokenName, symbol, governance,
            version.address, controllerNull.address, mintMasterIncremental.address,
            oraclePegged.address, badAddress, collateralToken.address), msg12);
        await truffleAssert.reverts(factory.deployOneTokenProxy(oneTokenName, symbol, governance,
            version.address, controllerNull.address, mintMasterIncremental.address,
            oraclePegged.address, memberToken.address, badAddress), msg13);
        await truffleAssert.reverts(factory.deployOneTokenProxy(oneTokenName, symbol, governance,
            version.address, controllerNull.address, mintMasterIncremental.address,
            oraclePegged.address, memberToken.address, memberToken.address), msg14);
            
        // should work
        let tx = await factory.deployOneTokenProxy(
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
        let newProxy = await factory.oneTokenAtIndex(oneTokenCount-1);

        assert.strictEqual(parseInt(oneTokenCount.toString(10)), 2, "there are not exactly 2 oneTokens deployed");

        expectEvent(tx, 'OneTokenDeployed', {
			sender: governance,
			newOneTokenProxy: newProxy,
			name: oneTokenName,
			symbol: symbol,
			governance: governance,
			version: version.address,
			controller: controllerNull.address,
			mintMaster: mintMasterIncremental.address,
            oneTokenOracle: oraclePegged.address,
			memberToken: memberToken.address,
            collateral: collateralToken.address
		})

        // test event from OneTokenV1Base
        expectEvent.inTransaction(tx.tx, OneToken, 'Initialized', {
			sender: factory.address,
			name: oneTokenName,
			symbol: symbol,
			controller: controllerNull.address,
			mintMaster: mintMasterIncremental.address,
			memberToken: memberToken.address,
            collateral: collateralToken.address
		})
    });

    it("should update foreign token", async () => {
        let isCollateral;
        let collateralTokenInfo;
        
        await factory.updateForeignToken(collateralToken.address, false);
        collateralTokenInfo = await factory.foreignTokenInfo(collateralToken.address);
        isCollateral = await oneToken.isCollateral(collateralToken.address);

        assert.strictEqual(isCollateral, true, "collateralToken should remain a colateral for the oneToken");
        assert.strictEqual(collateralTokenInfo["collateral"], false, "collateralToken should not be a collateral anymore (for future one tokens)");
        
        let tx = await factory.updateForeignToken(collateralToken.address, true);
        collateralTokenInfo = await factory.foreignTokenInfo(collateralToken.address);
        assert.strictEqual(collateralTokenInfo["collateral"], true, "collateralToken should be a collateral again (for future one tokens)");

        expectEvent(tx, 'ForeignTokenUpdated', {
			sender: governance,
			foreignToken: collateralToken.address,
            isCollateral: true
		})
    });

    it("should remove foreign token", async () => {
        let msg1 = "OneTokenFactory, Set: unknown foreign token";
        let isCollateral;

        let tx = await factory.removeForeignToken(collateralToken.address);
        expectEvent(tx, 'ForeignTokenRemoved', {
			sender: governance,
			foreignToken: collateralToken.address
		})

        isCollateral = await factory.isCollateral(collateralToken.address);
        assert.strictEqual(isCollateral, false, "collateralToken should not be a collateral in the factory anymore");

        numOracles = await factory.foreignTokenOracleCount(collateralToken.address);
        assert.strictEqual(parseInt(numOracles.toString(10)), 0, "collateralToken should not have oracles anymore");
        
        isCollateral = await oneToken.isCollateral(collateralToken.address);
        assert.strictEqual(isCollateral, true, "collateralToken should remain a colateral for the oneToken");

        truffleAssert.reverts(factory.removeForeignToken(collateralToken.address), msg1);
        truffleAssert.reverts(factory.updateForeignToken(collateralToken.address, true), msg1);
    });
});


