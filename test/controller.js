const { assert } = require("chai");
const truffleAssert = require('truffle-assertions');
const { expectEvent } = require("@openzeppelin/test-helpers");

const 
    ArbitraryStrategy = artifacts.require("Arbitrary"),
	OneTokenV1Base = artifacts.require("OneTokenV1Base"),
    OneToken = artifacts.require("OneTokenV1"),
    Factory = artifacts.require("OneTokenFactory"),
    MintMasterIncremental = artifacts.require("Incremental"),
    OraclePegged = artifacts.require("ICHIPeggedOracle"),
    MemberToken = artifacts.require("MemberToken"),
    CollateralToken = artifacts.require("CollateralToken"),
    ControllerCommon = artifacts.require("ControllerCommon"),
    TestController = artifacts.require("TestController"),
    ControllerNull = artifacts.require("NullController");

const 
    NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

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
    factory,
    oneToken,
    secondOneToken,
    secondOneTokenAddress,
    arbitraryStrategy,
    controller,
    secondController,
    oneTokenAddress;

contract("Controller", accounts => {

    beforeEach(async () => {
        governance = accounts[0];
        badAddress = accounts[1];
        factory = await Factory.deployed();
        controller = await ControllerNull.deployed();
        mintMaster = await MintMasterIncremental.deployed();
        oracle = await OraclePegged.deployed();
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

        // deploy second controller
        const controllerName = "Test Controller";
        secondController  = await TestController.new(factory.address);
        TestController.setAsDeployed(secondController);
        await factory.admitModule(secondController.address, moduleType.controller, controllerName, url);
 
        // deploy a strategy for collateralToken in secondOneToken
		arbitraryStrategy = await ArbitraryStrategy.new(factory.address, secondOneTokenAddress, "Test StrategyCommon")
        await factory.admitModule(arbitraryStrategy.address, moduleType.strategy, "arbitraryStrategy", "#")
		let allowance1 = 1000;
		let tx = await secondOneToken.setStrategy(collateralToken.address, arbitraryStrategy.address, allowance1);
		expectEvent(tx, 'StrategySet', {
			sender: governance,
			token: collateralToken.address,
			strategy: arbitraryStrategy.address,
			allowance: allowance1.toString()
		})

    });

    it("should be ready to test", async () => {
        assert.isAtLeast(accounts.length, 2, "There are not at least two accounts to work with");
    });
    
	it("should fail to init when initialized from outside", async () => {
		let msg1 = "ICHIModuleCommon: msg.sender is not a known oneToken";

		await truffleAssert.reverts(controller.init(), msg1);
	});

    it("should emit Initialized event when initialized by OneToken contract", async () => {
        let tx = await oneToken.changeController(controller.address, { from: governance });

        // test event from ControllerCommon
		expectEvent.inTransaction(tx.tx, ControllerCommon, 'ControllerInitialized', {})
    });

    it("should be able to assing the same controller to multiple oneTokens", async () => {
        let tx = await oneToken.changeController(controller.address, { from: governance });
		expectEvent.inTransaction(tx.tx, ControllerNull, 'ControllerInitialized', {})
        tx = await secondOneToken.changeController(controller.address, { from: governance });
		expectEvent.inTransaction(tx.tx, ControllerNull, 'ControllerInitialized', {})
    });

    it("should emit Periodic event", async () => {
        let tx = await oneToken.changeController(secondController.address, { from: governance });

        // test event from TestController
		expectEvent.inTransaction(tx.tx, ControllerCommon, 'ControllerInitialized', {})

        tx = await secondController.periodic({ from: governance });

        // test event from ControllerCommon
        expectEvent(tx, 'ControllerPeriodic', {
			sender: governance
		})
        
        await oneToken.changeController(controller.address, { from: governance });
    });

    it("should call executeStrategy", async () => {
        let msg1 = "OTV1B:es: unknown token";

        await secondOneToken.changeController(secondController.address, { from: governance });
        await truffleAssert.reverts(secondController.executeStrategy(secondOneToken.address, badAddress, { from: governance }), msg1);
        let tx = await secondController.executeStrategy(secondOneToken.address, collateralToken.address, { from: governance });

        // test event from OneTokenV1Base
		expectEvent.inTransaction(tx.tx, OneTokenV1Base, 'StrategyExecuted', {
            sender: secondController.address,
            token: collateralToken.address,
            strategy: arbitraryStrategy.address
        })

        await secondOneToken.changeController(controller.address, { from: governance });
    });

    /*it("should call execute", async () => {
        await secondOneToken.changeController(secondController.address, { from: governance });
        let tx = await secondController.testDirectExecute(arbitraryStrategy.address, { from: governance });

        // test event from TestController
		expectEvent.inTransaction(tx.tx, StrategyCommon, 'StrategyExecuted', {
            sender: secondController.address,
            token: secondOneToken.address
        })

        await secondOneToken.changeController(controller.address, { from: governance });
    });*/

});
