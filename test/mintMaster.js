const { assert } = require("chai");
const truffleAssert = require('truffle-assertions');
const { expectEvent } = require("@openzeppelin/test-helpers");

const 
    OneToken = artifacts.require("OneTokenV1"),
    Factory = artifacts.require("OneTokenFactory"),
    ControllerNull = artifacts.require("NullController"),
    MintMasterIncremental = artifacts.require("Incremental"),
    DummyMintMaster = artifacts.require("DummyMintMaster"),
    OraclePegged = artifacts.require("ICHIPeggedOracle"),
    TestOracle = artifacts.require("TestOracle"),
    MemberToken = artifacts.require("MemberToken"),
    OneTokenProxyAdmin = artifacts.require("OneTokenProxyAdmin"),
    CollateralToken = artifacts.require("CollateralToken");

const 
    NULL_ADDRESS = "0x0000000000000000000000000000000000000000",
    RATIO_40 =   "400000000000000000", // 40%
    RATIO_50 =   "500000000000000000", // 50%
    RATIO_501 =  "501000000000000000", // 50.1%
    RATIO_95 =   "950000000000000000", // 95%
    RATIO_60 =   "600000000000000000", // 60%
    RATIO_90 =   "900000000000000000", // 90%
    RATIO_949 =  "949000000000000000", // 94.9%
    RATIO_100 = "1000000000000000000", // 100%
    RATIO_110 = "1100000000000000000", // 110% - invalid
    STEP_002 =     "2000000000000000" // 0.2%

const moduleType = {
    version: 0, 
    controller: 1, 
    strategy: 2, 
    mintMaster: 3, 
    oracle: 4, 
    voterRoll: 5
}

let governance,
    badAddress,
    commonUser,
    version,
    factory,
    oneToken,
    secondOneToken,
    secondOneTokenAddress,
    controller,
    mintMaster,
    oracle,
    dummyMintMaster,
    testOracle,
    memberToken,
    collateralToken;

contract("MintMaster", accounts => {

    beforeEach(async () => {
        let oneTokenAddress;
        governance = accounts[0];
        badAddress = accounts[1];
        commonUser = accounts[2];
        version = await OneToken.deployed();
        factory = await Factory.deployed();
        controller = await ControllerNull.deployed();
        mintMaster = await MintMasterIncremental.deployed();
        oracle = await OraclePegged.deployed();
        testOracle = await TestOracle.deployed();
        memberToken = await MemberToken.deployed();
        collateralToken = await CollateralToken.deployed();
        oneTokenAddress = await factory.oneTokenAtIndex(0);
        oneToken = await OneToken.at(oneTokenAddress);

        // deploy second oneToken
        const 
            oneTokenName = "Second OneToken Instance",
            symbol = "OTI-2",
            versionName = "OneTokenV1-2",
            url = "#";
        secondOneToken  = await OneToken.new();
        OneToken.setAsDeployed(secondOneToken);
        await factory.admitModule(secondOneToken.address, moduleType.version, versionName, url);
        await factory.deployOneTokenProxy(
            oneTokenName,
            symbol,
            governance,
            secondOneToken.address,
            controller.address,
            mintMaster.address,
            oracle.address,
            memberToken.address,
            collateralToken.address
        )
        secondOneTokenAddress = await factory.oneTokenAtIndex(1);
        secondOneToken = await OneToken.at(secondOneTokenAddress);
    });

    it("should be ready to test", async () => {
        assert.isAtLeast(accounts.length, 3, "There are not at least three accounts to work with");
    });
    
    it("should not be able to re-init the mint master from outside of OneToken contract", async () => {
        let msg1 = "ICHIModuleCommon: msg.sender is not a known oneToken";
        // attempt to call init should be failing
        await truffleAssert.reverts(mintMaster.init(oracle.address), msg1);
    });

    it("should not be able to update non-initialized Incremental mint master", async () => {
        let msg1 = "Incremental: mintmaster is not initialized";

        let incMintMasterName = "Inc Mint Master";
        let incMintMaster = await MintMasterIncremental.new(factory.address, incMintMasterName);

		await truffleAssert.reverts(incMintMaster.updateMintingRatio(oneToken.address, { from: governance }), msg1);
    });

    it("should emit Initialized event when initialized by OneToken contract", async () => {
        let dummyMintMasterName = "Dummy Mint Master";
        dummyMintMaster = await DummyMintMaster.new(factory.address, dummyMintMasterName);
        DummyMintMaster.setAsDeployed(dummyMintMaster)

        await factory.admitModule(dummyMintMaster.address, moduleType.mintMaster, "Dummy Mint Master", "#")
        let tx = await oneToken.changeMintMaster(dummyMintMaster.address, oracle.address, { from: governance });

        // test event from MintMasterCommon
		expectEvent.inTransaction(tx.tx, DummyMintMaster, 'MintMasterInitialized', {
			sender: oneToken.address,
			oneToken: oneToken.address,
			oneTokenOracle: oracle.address
		})

        await oneToken.changeMintMaster(mintMaster.address, oracle.address, { from: governance });
    });

    it("should be able to assing the same mintManster to multiple oneTokens", async () => {
        let tx = await oneToken.changeMintMaster(dummyMintMaster.address, oracle.address, { from: governance });

        // test event from MintMasterCommon
		expectEvent.inTransaction(tx.tx, DummyMintMaster, 'MintMasterInitialized', {
			sender: oneToken.address,
			oneToken: oneToken.address,
			oneTokenOracle: oracle.address
		})

        tx = await secondOneToken.changeMintMaster(dummyMintMaster.address, oracle.address, { from: governance });

        // test event from MintMasterCommon
		expectEvent.inTransaction(tx.tx, DummyMintMaster, 'MintMasterInitialized', {
			sender: secondOneToken.address,
			oneToken: secondOneToken.address,
			oneTokenOracle: oracle.address
		})

        await oneToken.changeMintMaster(mintMaster.address, oracle.address, { from: governance });
        await secondOneToken.changeMintMaster(mintMaster.address, oracle.address, { from: governance });
    });

    it("should update params", async () => {
        let 
            theRatio,
            parameters,
            msg1 = "ICHIModuleCommon: msg.sender is not oneToken owner",
            msg2 = "Incremental: minRatio must be <= maxRatio",
            msg3 = "Incremental: maxRatio must be <= 10 ** 18",
            msg4 = "Incremental: stepSize must be < (max - min) or zero.",
            msg5 = "Incremental: initial ratio must be >= min ratio.",
            msg6 = "Incremental: initial ratio must be <= max ratio.";
        
        await truffleAssert.reverts(mintMaster.setParams(oneToken.address, 
            RATIO_50, RATIO_95, STEP_002, RATIO_90, { from: badAddress }), msg1);
        await truffleAssert.reverts(mintMaster.setParams(oneToken.address, 
            RATIO_100, RATIO_95, STEP_002, RATIO_90, { from: governance }), msg2);
        await truffleAssert.reverts(mintMaster.setParams(oneToken.address, 
            RATIO_50, RATIO_110, STEP_002, RATIO_90, { from: governance }), msg3);
        await truffleAssert.reverts(mintMaster.setParams(oneToken.address, 
            RATIO_50, RATIO_95, RATIO_90, RATIO_90, { from: governance }), msg4);
        await truffleAssert.reverts(mintMaster.setParams(oneToken.address, 
            RATIO_90, RATIO_95, STEP_002, RATIO_50, { from: governance }), msg5);
        await truffleAssert.reverts(mintMaster.setParams(oneToken.address, 
            RATIO_50, RATIO_95, STEP_002, RATIO_100, { from: governance }), msg6);
                            
        let tx = await mintMaster.setParams(oneToken.address, 
            RATIO_50, RATIO_95, STEP_002, RATIO_90, { from: governance });

        // minting ratio should be updated, without the updateMintingRatio call, and params has changed
        parameters = await mintMaster.parameters(oneToken.address, { from: commonUser });
        assert.strictEqual(parameters.set, true, "mintMaster didn't set the set flag");
        assert.strictEqual(parameters.stepSize.toString(10), STEP_002, "mintMaster didn't set the new step size");
        theRatio = await mintMaster.getMintingRatio2(oneToken.address, NULL_ADDRESS, { from: commonUser });
        assert.strictEqual(theRatio[0].toString(10), RATIO_90, "mintMaster didn't set a new ratio");

        // the ratio should be updated, after the updateMintingRatio call, and params has changed too
        await oneToken.updateMintingRatio(collateralToken.address);
        parameters = await mintMaster.parameters(oneToken.address, { from: commonUser });
        assert.strictEqual(parameters.stepSize.toString(10), STEP_002, "mintMaster didn't set the new step size");
        theRatio = await mintMaster.getMintingRatio2(oneToken.address, collateralToken.address, { from: commonUser });
        assert.strictEqual(theRatio[0].toString(10), RATIO_90, "mintMaster didn't set a new ratio");

        expectEvent(tx, 'SetParams', {
			sender: governance,
			oneToken: oneToken.address,
            minRatio: RATIO_50,
            maxRatio: RATIO_95,
            stepSize: STEP_002,
            initialRatio: RATIO_90
		})

    });

    it("should adjust the minting ratio", async () => {
        let 
            theRatio,
            msg1 = "ICHIModuleCommon: msg.sender is not oneToken owner",
            msg2 = "Incremental: minRatio must be <= maxRatio",
            msg3 = "Incremental: maxRatio must be >= minRatio",
            msg4 = "Incremental: maxRatio must <= 100%",
            msg5 = "Incremental: ratio must be > 0",
            msg6 = "Incremental: ratio must be <= 100%",
            msg7 = "Incremental: ratio must be >= minRatio",
            msg8 = "Incremental: ratio must be <= maxRatio",
            msg9 = "Incremental: stepSize must be < (max - min) or zero.";
        
        await truffleAssert.reverts(mintMaster.setMinRatio(oneToken.address, RATIO_50, { from: badAddress }), msg1);
        await truffleAssert.reverts(mintMaster.setMinRatio(oneToken.address, RATIO_100, { from: governance }), msg2);
        await truffleAssert.reverts(mintMaster.setMinRatio(oneToken.address, RATIO_949, { from: governance }), msg9);
        await truffleAssert.reverts(mintMaster.setMaxRatio(oneToken.address, RATIO_501, { from: governance }), msg9);
        await truffleAssert.reverts(mintMaster.setRatio(oneToken.address, RATIO_50, { from: badAddress }), msg1);
        
        // setting stepSize to 0 allows very narrow ranges
        await mintMaster.setStepSize(oneToken.address, 0, { from: governance });
        await mintMaster.setMinRatio(oneToken.address, RATIO_949, { from: governance });
        await mintMaster.setMinRatio(oneToken.address, RATIO_95, { from: governance });
        theRatio = await mintMaster.getMintingRatio2(oneToken.address, collateralToken.address, { from: commonUser });
        assert.strictEqual(theRatio[0].toString(10), RATIO_95, "mintMaster didn't set a new ratio");
        await mintMaster.setMinRatio(oneToken.address, RATIO_50, { from: governance });
        await mintMaster.setMaxRatio(oneToken.address, RATIO_501, { from: governance });
        await mintMaster.setMaxRatio(oneToken.address, RATIO_50, { from: governance });
        theRatio = await mintMaster.getMintingRatio2(oneToken.address, collateralToken.address, { from: commonUser });
        assert.strictEqual(theRatio[0].toString(10), RATIO_50, "mintMaster didn't set a new ratio");
        await mintMaster.setMaxRatio(oneToken.address, RATIO_95, { from: governance });
        await mintMaster.setStepSize(oneToken.address, STEP_002, { from: governance });

        let tx = await mintMaster.setMinRatio(oneToken.address, RATIO_50, { from: governance });
        expectEvent(tx, 'MinRatioSet', {
			sender: governance,
			oneToken: oneToken.address,
            minRatio: RATIO_50
		})
        tx = await mintMaster.setRatio(oneToken.address, RATIO_50, { from: governance });
        expectEvent(tx, 'RatioSet', {
			sender: governance,
			oneToken: oneToken.address,
            ratio: RATIO_50
		})
        theRatio = await mintMaster.getMintingRatio2(oneToken.address, collateralToken.address, { from: commonUser });
        assert.strictEqual(theRatio[0].toString(10), RATIO_50, "mintMaster didn't set a new ratio");

        await oneToken.updateMintingRatio(collateralToken.address);
        theRatio = await oneToken.getMintingRatio(collateralToken.address);
        assert.strictEqual(theRatio[0].toString(10), RATIO_50, "the minting ratio did not update as expected");

        await mintMaster.setMinRatio(oneToken.address, RATIO_60, { from: governance });
        theRatio = await mintMaster.getMintingRatio2(oneToken.address, collateralToken.address, { from: commonUser });
        assert.strictEqual(theRatio[0].toString(10), RATIO_60, "mintMaster didn't limit ratio after resetting min ratio");

        await truffleAssert.reverts(mintMaster.setMaxRatio(oneToken.address, RATIO_50, { from: governance }), msg3);
        await truffleAssert.reverts(mintMaster.setMaxRatio(oneToken.address, RATIO_110, { from: governance }), msg4);
        await truffleAssert.reverts(mintMaster.setRatio(oneToken.address, 0, { from: governance }), msg5);
        await truffleAssert.reverts(mintMaster.setRatio(oneToken.address, RATIO_110, { from: governance }), msg6);
        await truffleAssert.reverts(mintMaster.setRatio(oneToken.address, RATIO_50, { from: governance }), msg7);
        await truffleAssert.reverts(mintMaster.setRatio(oneToken.address, RATIO_100, { from: governance }), msg8);
        await mintMaster.setRatio(oneToken.address, RATIO_95, { from: governance });
        tx = await mintMaster.setMaxRatio(oneToken.address, RATIO_90, { from: governance });
        expectEvent(tx, 'MaxRatioSet', {
			sender: governance,
            oneToken: oneToken.address,
            maxRatio: RATIO_90
		})
        theRatio = await mintMaster.getMintingRatio2(oneToken.address, collateralToken.address, { from: commonUser });
        assert.strictEqual(theRatio[0].toString(10), RATIO_90, "mintMaster didn't limit ratio after resetting max ratio");
    });

    it("should update the step size", async () => {
        let 
            theRatio,
            parameters,
            msg1 = "ICHIModuleCommon: msg.sender is not oneToken owner",
            msg2 = "Incremental: stepSize must be < (max - min) or zero.",
            msg3 = "MintMasterCommon: unknown oracle",
            msg4 = "MintMasterCommon: given oracle is not valid for oneToken (msg.sender)",
            msg5 = "Incremental: oracle is not approved for oneToken";
        
        // should not allow wrong user to change the step size
        await truffleAssert.reverts(mintMaster.setStepSize(oneToken.address, STEP_002, { from: badAddress }), msg1);

        // with default PeggedOracle changing step size shouldn't affect the ratio
        let tx = await mintMaster.setStepSize(oneToken.address, STEP_002, { from: governance });
        expectEvent(tx, 'StepSizeSet', {
			sender: governance,
			oneToken: oneToken.address,
            stepSize: STEP_002
		})
        theRatio = await mintMaster.getMintingRatio2(oneToken.address, collateralToken.address, { from: commonUser });
        parameters = await mintMaster.parameters(oneToken.address, { from: commonUser });
        await truffleAssert.reverts(mintMaster.setStepSize(oneToken.address, RATIO_90, { from: governance }), msg2);
        assert.strictEqual(parameters.stepSize.toString(10), STEP_002, "mintMaster didn't set the new step size");
        assert.strictEqual(theRatio[0].toString(10), "900000000000000000", "mintMaster changed the ratio by mistake");

        // now changing the oracle so we could see how changing step size affects the ratio
        await factory.assignOracle(oneToken.address, testOracle.address);
        await truffleAssert.reverts(mintMaster.changeOracle(oneToken.address, badAddress, { from: governance }), msg5);
        //await truffleAssert.reverts(mintMaster.changeOracle(oneToken.address, controller.address, { from: governance }), msg4);
        
        tx = await mintMaster.changeOracle(oneToken.address, testOracle.address, { from: governance });
        expectEvent(tx, 'OneTokenOracleChanged', {
			sender: governance,
            oneToken: oneToken.address,
            oracle: testOracle.address
		})
        
        await mintMaster.setMaxRatio(oneToken.address, RATIO_95, { from: governance });
        await mintMaster.setStepSize(oneToken.address, STEP_002, { from: governance });
        theRatio = await mintMaster.getMintingRatio2(oneToken.address, collateralToken.address, { from: commonUser });
        parameters = await mintMaster.parameters(oneToken.address, { from: commonUser });
        assert.strictEqual(parameters.stepSize.toString(10), STEP_002, "mintMaster didn't set the new step size");
        assert.strictEqual(theRatio[0].toString(10), "902000000000000000", "mintMaster didn't change the ratio using step size (step up)");

        // taking the second step
        await oneToken.updateMintingRatio(collateralToken.address, { from: governance });
        theRatio = await mintMaster.getMintingRatio2(oneToken.address, collateralToken.address, { from: commonUser });
        assert.strictEqual(theRatio[0].toString(10), "904000000000000000", "mintMaster didn't change the ratio using step size (step up)");

        // switching the oracle "off center" direction to test "step down" logic
        await testOracle.setAdjustUp(true, { from: governance });
        theRatio = await mintMaster.getMintingRatio2(oneToken.address, collateralToken.address, { from: commonUser });
        assert.strictEqual(theRatio[0].toString(10), "900000000000000000", "mintMaster didn't change the ratio using step size (step down)");

    });

    it("should clamp rate at the top and bottom", async () => {
        let theRatio;

        // set ratio to 94.9
        await mintMaster.setParams(oneToken.address, 
            RATIO_50, RATIO_95, STEP_002, RATIO_949, { from: governance });

        // try to step over maxRatio
        await testOracle.setAdjustUp(false, { from: governance });
        await oneToken.updateMintingRatio(collateralToken.address, { from: governance });
        theRatio = await mintMaster.getMintingRatio2(oneToken.address, collateralToken.address, { from: commonUser });
        assert.strictEqual(theRatio[0].toString(10), RATIO_95, "mintMaster didn't set a new ratio");

        // set ratio to 95
        await mintMaster.setParams(oneToken.address, 
            RATIO_50, RATIO_95, STEP_002, RATIO_95, { from: governance });

        // try to step over maxRatio
        await oneToken.updateMintingRatio(collateralToken.address, { from: governance });
        theRatio = await mintMaster.getMintingRatio2(oneToken.address, collateralToken.address, { from: commonUser });
        assert.strictEqual(theRatio[0].toString(10), RATIO_95, "mintMaster didn't set a new ratio");

        // set ratio to 50.1
        await mintMaster.setParams(oneToken.address, 
            RATIO_50, RATIO_95, STEP_002, RATIO_501, { from: governance });

        // try to step over mixRatio
        await testOracle.setAdjustUp(true, { from: governance });
        await oneToken.updateMintingRatio(collateralToken.address, { from: governance });
        theRatio = await mintMaster.getMintingRatio2(oneToken.address, collateralToken.address, { from: commonUser });
        assert.strictEqual(theRatio[0].toString(10), RATIO_50, "mintMaster didn't set a new ratio");

        // set ratio to 50
        await mintMaster.setParams(oneToken.address, 
            RATIO_50, RATIO_95, STEP_002, RATIO_50, { from: governance });

        // try to step over mixRatio
        await oneToken.updateMintingRatio(collateralToken.address, { from: governance });
        theRatio = await mintMaster.getMintingRatio2(oneToken.address, collateralToken.address, { from: commonUser });
        assert.strictEqual(theRatio[0].toString(10), RATIO_50, "mintMaster didn't set a new ratio");
    });

    it("access control should follow oneToken change of ownership", async () => {
        let 
            msg1 = "ICHIModuleCommon: msg.sender is not oneToken owner";
        
        let proxyAdminAddress;
        let proxyAdmin;
        let newOwner = accounts[1];

        proxyAdminAddress = await factory.oneTokenProxyAdmins(oneToken.address);
        proxyAdmin = await OneTokenProxyAdmin.at(proxyAdminAddress);
    
        // set new governance
        await oneToken.transferOwnership(newOwner);
        await proxyAdmin.transferOwnership(newOwner);
    
        await truffleAssert.reverts(mintMaster.setMinRatio(oneToken.address, RATIO_40, { from: governance }), msg1);
        let tx = await mintMaster.setMinRatio(oneToken.address, RATIO_40, { from: newOwner });
        expectEvent(tx, 'MinRatioSet', {
			sender: newOwner,
			oneToken: oneToken.address,
            minRatio: RATIO_40
		})

        // restore old governance 
        await proxyAdmin.transferOwnership(governance, { from: newOwner });
        await oneToken.transferOwnership(governance, { from: newOwner });
    
        await truffleAssert.reverts(mintMaster.setMinRatio(oneToken.address, RATIO_50, { from: newOwner }), msg1);
        tx = await mintMaster.setMinRatio(oneToken.address, RATIO_50, { from: governance });
        expectEvent(tx, 'MinRatioSet', {
			sender: governance,
			oneToken: oneToken.address,
            minRatio: RATIO_50
		})
    });

    it("configuration changes one instance should not interfere with the configuration of any other instance", async () => {
        let theRatio;

        // set ratio to 90 for the second oneToken
        let tx = await mintMaster.setParams(secondOneToken.address, 
            RATIO_50, RATIO_95, STEP_002, RATIO_90, { from: governance });

        // set ratio to 50 for the first oneToken
        tx = await mintMaster.setRatio(oneToken.address, RATIO_50, { from: governance });
        expectEvent(tx, 'RatioSet', {
            sender: governance,
			oneToken: oneToken.address,
            ratio: RATIO_50
        })
        theRatio = await mintMaster.getMintingRatio2(oneToken.address, collateralToken.address, { from: commonUser });
        assert.strictEqual(theRatio[0].toString(10), RATIO_50, "mintMaster didn't set a new ratio");

        theRatio = await mintMaster.getMintingRatio2(secondOneToken.address, collateralToken.address, { from: commonUser });
        assert.strictEqual(theRatio[0].toString(10), RATIO_90, "mintMaster for second oneToken got updated with the first oneToken");
    });

});
