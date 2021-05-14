const { assert } = require("chai");
const truffleAssert = require('truffle-assertions');
const { expectEvent } = require("@openzeppelin/test-helpers");
const { artifacts } = require("hardhat");

const
    OneToken = artifacts.require("OneTokenV1"),
    Factory = artifacts.require("OneTokenFactory"),
    ControllerNull = artifacts.require("NullController"),
    ControllerCommon = artifacts.require("ControllerCommon"),
    MintMasterIncremental = artifacts.require("Incremental"),
    MintMasterCommon = artifacts.require("MintMasterCommon"),
    OraclePegged = artifacts.require("ICHIPeggedOracle"),
    MemberToken = artifacts.require("MemberToken"),
    CollateralToken = artifacts.require("CollateralToken"),
    NullStrategy = artifacts.require("NullStrategy"),
    OneTokenProxyAdmin = artifacts.require("OneTokenProxyAdmin"),
    IERC20Extended = artifacts.require("IERC20Extended");

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000"

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
    version,
    factory,
    oneToken,
    controller,
    mintMaster,
    oracle,
    memberToken,
    collateralToken,
    in_vault_and_strategies;

contract("OneToken V1 Base", accounts => {

    in_vault_and_strategies = 0;

    beforeEach(async () => {
        let oneTokenAddress;
        governance = accounts[0];
        badAddress = accounts[1];
        bob = accounts[2];
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

    it("should know the oneToken factory", async () => {
        let f = await oneToken.oneTokenFactory();
        assert.strictEqual(f, factory.address, "the factory address is unknown");
    });

    it("should know the oneToken's controller", async () => {
        let c = await oneToken.controller();
        assert.strictEqual(c, controller.address, "the controller address is unknown");
    });

    it("should know the oneToken's mintMaster", async () => {
        let m = await oneToken.mintMaster();
        assert.strictEqual(m, mintMaster.address, "the mint master address is unknown");
    });
    
    it("should know the oneToken's member token", async () => {
        let m = await oneToken.memberToken();
        assert.strictEqual(m, memberToken.address, "the member token address is unknown");
    });

    it("should already be initialized and reject re-initialization", async () => {
        let msg = "ICHIInitializable: contract is already initialized";

        await truffleAssert.reverts(
            oneToken.init(
                "new name",
                "NEWSYM",
                oracle.address,
                controller.address,
                mintMaster.address,
                memberToken.address,
                collateralToken.address,
                { from: governance }),
                msg);
        
        await truffleAssert.reverts(
            oneToken.init(
                "new name",
                "NEWSYM",
                oracle.address,
                controller.address,
                mintMaster.address,
                memberToken.address,
                collateralToken.address,
                { from: badAddress }),
                msg);

    });

    it("should trasfer governance", async () => {
        let checkOwner;
        let proxyAdminAddress;
        let proxyAdmin;
        let proxyAdminOwner;
        let newOwner = accounts[1];

        proxyAdminAddress = await factory.oneTokenProxyAdmins(oneToken.address);
        proxyAdmin = await OneTokenProxyAdmin.at(proxyAdminAddress);

        // set new governance
        checkOwner = await oneToken.owner();
        assert.strictEqual(checkOwner, governance, "incorrect oneToken ownership")
        await oneToken.transferOwnership(newOwner);
        checkOwner = await oneToken.owner();
        assert.strictEqual(checkOwner, newOwner, "incorrect new oneToken ownership");

        proxyAdminOwner = await proxyAdmin.owner();
        assert.strictEqual(proxyAdminOwner, governance, "incorrect proxyAdmin ownership")
        await proxyAdmin.transferOwnership(newOwner);
        proxyAdminOwner = await proxyAdmin.owner();
        assert.strictEqual(proxyAdminOwner, newOwner, "incorrect new proxyAdmin ownership");

        // restore old governance 
        await proxyAdmin.transferOwnership(governance, { from: newOwner });
        proxyAdminOwner = await proxyAdmin.owner();
        assert.strictEqual(proxyAdminOwner, governance, "governance failed to recover proxyAdmin ownership")

        await oneToken.transferOwnership(governance, { from: newOwner });
        checkOwner = await oneToken.owner();
        assert.strictEqual(checkOwner, governance, "governance failed to recover oneToken ownership")
    });

    it("should allow a change of controller", async () => {

        msg1 = "ICHIOwnable: caller is not the owner";
        msg2 = "OTV1B: unregistered controller";
        msg3 = "OTV1B: unk controller";

        let tx = await oneToken.changeController(controller.address, { from: governance });
        await truffleAssert.reverts(oneToken.changeController(badAddress, { from: badAddress }), msg1);
        await truffleAssert.reverts(oneToken.changeController(badAddress, { from: governance }), msg2);
        await truffleAssert.reverts(oneToken.changeController(mintMaster.address, { from: governance }), msg3);
        let c = await oneToken.controller();
        assert.strictEqual(c, controller.address, "controller is not set");

        expectEvent(tx, 'ControllerChanged', {
			sender: governance,
			controller: controller.address
		})

        // test event from ControllerCommon
		expectEvent.inTransaction(tx.tx, ControllerCommon, 'ControllerInitialized', {
			sender: oneToken.address
		})
    });

    it("should allow a change of factory", async () => {

        msg1 = "ICHIOwnable: caller is not the owner";
        msg2 = "OTV1B: new factory doesn't emit factory fingerprint";

        let tx = await oneToken.setFactory(factory.address, { from: governance });
        await truffleAssert.reverts(
            oneToken.setFactory(badAddress, { from: badAddress }), msg1);
        await truffleAssert.reverts(
            oneToken.setFactory(controller.address, { from: governance }), msg2);
        await truffleAssert.reverts(
            oneToken.setFactory(badAddress, { from: governance }), ""); // reverts without reason

        let f = await oneToken.oneTokenFactory();
        assert.strictEqual(f, factory.address, "factory is not set");

        expectEvent(tx, 'NewFactory', {
			sender: governance,
			factory: factory.address
		})
    });

    it("should allow a change of mintMaster", async () => {

        let msg1 = "ICHIOwnable: caller is not the owner",
            msg2 = "OTV1B: unregistered mint master",
            msg3 = "OTV1B: unk mint master",
            msg4 = "OTV1B: unregistered oneToken oracle";

        //await factory.assignOracle(oneToken.address, oracle.address);
        let tx = await oneToken.changeMintMaster(mintMaster.address, oracle.address, { from: governance });
        await truffleAssert.reverts(oneToken.changeMintMaster(badAddress, oracle.address, { from: badAddress }), msg1);
        await truffleAssert.reverts(oneToken.changeMintMaster(badAddress, oracle.address, { from: governance }), msg2);
        await truffleAssert.reverts(oneToken.changeMintMaster(controller.address, oracle.address, { from: governance }), msg3);
        await truffleAssert.reverts(oneToken.changeMintMaster(mintMaster.address, badAddress, { from: governance }), msg4);
        let m = await oneToken.mintMaster();
        assert.strictEqual(m, mintMaster.address, "mintMaster is not set");

        expectEvent(tx, 'MintMasterChanged', {
			sender: governance,
			mintMaster: mintMaster.address
		})

        // test event from MintMasterCommon
		expectEvent.inTransaction(tx.tx, MintMasterCommon, 'MintMasterInitialized', {
			sender: oneToken.address,
			oneToken: oneToken.address,
			oneTokenOracle: oracle.address
		})

        const newMintMaster = await MintMasterIncremental.new(factory.address, "new mint master");

        expectEvent.inConstruction(newMintMaster, 'MintMasterDeployed', {
			sender: governance,
			description: "new mint master"
		})

        await factory.admitModule(newMintMaster.address, moduleType.mintMaster, "new mint master", "#")
        tx = await oneToken.changeMintMaster(newMintMaster.address, oracle.address, { from: governance });

        expectEvent(tx, 'MintMasterChanged', {
			sender: governance,
			mintMaster: newMintMaster.address
		})
    });

    it("should permit adding an asset", async () => {

        let msg1 = "ICHIOwnable: caller is not the owner";
        let msg2 = "OTV1B: unk oracle or token";
        let msg3 = "OTV1B: COLLAT already exists";
        
        // deploy a new token
        let newToken = await CollateralToken.new();

        // register in the factory via factory governance
        let tx = await factory.admitForeignToken(newToken.address, true, oracle.address);

        expectEvent(tx, 'ForeignTokenAdmitted', {
			sender: governance,
			foreignToken: newToken.address,
            isCollateral: true,
            oracle: oracle.address
		})

        // guards
        await truffleAssert.reverts(oneToken.addAsset(newToken.address, oracle.address, { from: badAddress }), msg1);
        await truffleAssert.reverts(oneToken.addAsset(badAddress, oracle.address, { from: governance }), msg2);
        await truffleAssert.reverts(oneToken.addAsset(newToken.address, badAddress, { from: governance }), msg2);
        await truffleAssert.reverts(oneToken.addAsset(collateralToken.address, oracle.address, { from: governance }), msg3);

        // admit the asset
        tx = await oneToken.addAsset(newToken.address, oracle.address);

        let assetCount = await oneToken.assetCount();
        assert.strictEqual(parseInt(assetCount.toString(10)), 3, "there are not exactly three assets");

        let isAsset = await oneToken.isAsset(newToken.address);
        assert.strictEqual(isAsset, true, "assets should be there");

        let assetAtIndex = await oneToken.assetAtIndex(assetCount-1);
        assert.strictEqual(newToken.address, assetAtIndex, "last asset in the set should match the last one added");

        expectEvent(tx, 'AssetAdded', {
			sender: governance,
            token: newToken.address,
			oracle: oracle.address
		})
    });

    it("should permit removing an asset", async () => {

        let beforeCount;
        let newCount;
        let delta;
        let msg1 = "ICHIOwnable: caller is not the owner";
        let msg2 = "OTV1B: unknown token";

        await truffleAssert.reverts(oneToken.removeAsset(collateralToken.address, { from: badAddress }), msg1);
        const unknownToken = await CollateralToken.new();
        await truffleAssert.reverts(oneToken.removeAsset(unknownToken.address, { from: governance }), msg2 );
        // revert reasons from the AddressSet library do not bubble up to test level
        await truffleAssert.reverts(oneToken.removeAsset(badAddress, { from: governance }));

        // remove collateral token    
        beforeCount = await oneToken.assetCount();
        beforeCount = parseInt(beforeCount.toString(10));
        let tx = await oneToken.removeAsset(collateralToken.address, { from: governance });
        newCount = await oneToken.assetCount();
        newCount = parseInt(newCount.toString(10));
        delta = beforeCount - newCount;
        assert.strictEqual(delta, 1, "there is not one less asset");

        expectEvent(tx, 'AssetRemoved', {
			sender: governance,
            token: collateralToken.address
		})

        // remove other token
        beforeCount = newCount;
        await oneToken.removeAsset(memberToken.address, { from: governance });
        newCount = await oneToken.assetCount();
        newCount = parseInt(newCount.toString(10));
        delta = beforeCount - newCount;
        assert.strictEqual(delta, 1, "there is not one less asset");

        await oneToken.addAsset(memberToken.address, oracle.address);
    });

    it("should return correct number of collateral tokens", async () => {
        // deploy a new token
        let newToken = await CollateralToken.new();

        // register in the factory via factory governance
        await factory.admitForeignToken(newToken.address, true, oracle.address);

        let collateralTokensCount = await oneToken.collateralTokenCount();
        assert.strictEqual(parseInt(collateralTokensCount.toString(10)), 1, "there are not exactly 1 collateral token");

        // admit the asset
        await oneToken.addAsset(newToken.address, oracle.address);

        collateralTokensCount = await oneToken.collateralTokenCount();
        assert.strictEqual(parseInt(collateralTokensCount.toString(10)), 2, "there are not exactly 2 collateral tokens");

        let isCollateral = await oneToken.isCollateral(newToken.address);
        assert.strictEqual(isCollateral, true, "assets should be there");

        let collateralTokenAtIndex = await oneToken.collateralTokenAtIndex(collateralTokensCount-1);
        assert.strictEqual(newToken.address, collateralTokenAtIndex, "last asset in the set should match the last one added");
    });

    it("should permit adding a non-collateral (other) asset/token", async () => {

        let msg1 = "ICHIOwnable: caller is not the owner";
        let msg2 = "OTV1B: unk oracle or token";
        let msg3 = "OTV1B: token already exists";
        
        // deploy a new token
        let newToken = await MemberToken.new();

        // register in the factory via factory governance
        await factory.admitForeignToken(newToken.address, false, oracle.address);

        // guards
        await truffleAssert.reverts(oneToken.addAsset(newToken.address, oracle.address, { from: badAddress }), msg1);
        await truffleAssert.reverts(oneToken.addAsset(badAddress, oracle.address, { from: governance }), msg2);
        await truffleAssert.reverts(oneToken.addAsset(newToken.address, badAddress, { from: governance }), msg2);
        await truffleAssert.reverts(oneToken.addAsset(memberToken.address, oracle.address, { from: governance }), msg3);

        // admit the asset
        await oneToken.addAsset(newToken.address, oracle.address);

        let assetCount = await oneToken.assetCount();
        assert.strictEqual(parseInt(assetCount.toString(10)), 4, "there are not exactly 4 assets");

        let isAsset = await oneToken.isAsset(newToken.address);
        assert.strictEqual(isAsset, true, "assets should be there");

        let assetAtIndex = await oneToken.assetAtIndex(assetCount-1);
        assert.strictEqual(newToken.address, assetAtIndex, "last asset in the set should match the last one added");
    });

    it("should return correct number of non-collateral (other) tokens", async () => {
        // deploy a new token
        let newToken = await MemberToken.new();

        // register in the factory via factory governance
        await factory.admitForeignToken(newToken.address, false, oracle.address);

        let otherTokenCount = await oneToken.otherTokenCount();
        assert.strictEqual(parseInt(otherTokenCount.toString(10)), 2, "there are not exactly 2 other token");

        // admit the asset
        await oneToken.addAsset(newToken.address, oracle.address);

        otherTokenCount = await oneToken.otherTokenCount();
        assert.strictEqual(parseInt(otherTokenCount.toString(10)), 3, "there are not exactly 3 other tokens");

        let isOtherToken = await oneToken.isOtherToken(newToken.address);
        assert.strictEqual(isOtherToken, true, "assets should be there");

        let otherTokenAtIndex = await oneToken.otherTokenAtIndex(otherTokenCount-1);
        assert.strictEqual(newToken.address, otherTokenAtIndex, "last asset in the set should match the last one added");
    });

    it("should allow set, fund, defund and remove a strategy and funds recovery", async () => {

        let vaultBalance,
            strategyName = "Do Nothing Strategy",
            allowance = "10",
            amount = "1000",
            half = "500",
            factory = await Factory.deployed(),
            strategy = await NullStrategy.new(factory.address, oneToken.address, strategyName),
            collateral = await oneToken.collateralTokenAtIndex(0),
            erc20Collateral = await IERC20Extended.at(collateral);

        let msg1 = "ICHIOwnable: caller is not the owner",
            msg2 = "OTV1B: unknown token",
            msg3 = "OTV1B: unknown strategy"
            msg5 = "OTV1B: can't assign strategy that doesn't recognize this vault",
            msg6 = "OTV1B: unknown strategy owner",
            msg7 = "OTV1B: not the token strategy",
            msg8 = "OTV1B: can't remove token with vault balance > 0",
            msg9 = "OTV1B: can't remove asset with strategy balance > 0";

        await factory.admitModule(strategy.address, moduleType.strategy, "strategy name", "url");

        // access control
        await truffleAssert.reverts(oneToken.setStrategy(collateral, strategy.address, allowance, { from: badAddress }), msg1);
        await truffleAssert.reverts(oneToken.setStrategy(badAddress, strategy.address, allowance, { from: governance }), msg2);
        await truffleAssert.reverts(oneToken.setStrategy(collateral, badAddress, allowance, { from: governance }), msg3);
        await truffleAssert.reverts(oneToken.setStrategy(collateral, mintMaster.address, allowance, { from: governance }), msg3);

        // this whole section is to test msg5 pre-condition check
        await factory.deployOneTokenProxy(
            "oneTokenName V2",
            "symbol 2",
            governance,
            version.address,
            controller.address,
            mintMaster.address,
            oracle.address,
            memberToken.address,
            collateralToken.address
        )
        let oneTokenAddress_2 = await factory.oneTokenAtIndex(1);
        let oneToken_2 = await OneToken.at(oneTokenAddress_2);
        let wrongTokenStrategy = await NullStrategy.new(factory.address, oneToken_2.address, "strategy with wrong token");
        await factory.admitModule(wrongTokenStrategy.address, moduleType.strategy, "strategy with wrong token", "url");
        await truffleAssert.reverts(oneToken.setStrategy(collateral, wrongTokenStrategy.address, allowance, { from: governance }), msg5);
        // end of msg5 pre-condition check

        // more access control
        let wrongOwnerStrategy = await NullStrategy.new(factory.address, oneToken.address, "strategy with wrong owner", { from: bob });
        await factory.admitModule(wrongOwnerStrategy.address, moduleType.strategy, "strategy with wrong owner", "url");
        await truffleAssert.reverts(oneToken.setStrategy(collateral, wrongOwnerStrategy.address, allowance, { from: governance }), msg6);

        // assign strategy
        let tx = await oneToken.setStrategy(collateral, strategy.address, allowance, { from: governance });
        let asset = await oneToken.assets(collateral);
        let assignedStrategy = asset["strategy"];
        let vault = await strategy.oneToken();
        assert.strictEqual(assignedStrategy, strategy.address, "the strategy is not assigned");
        assert.strictEqual(vault, oneToken.address, "the strategy is using the wrong vault");

        expectEvent(tx, 'StrategySet', {
			sender: governance,
            token: collateral,
            strategy: strategy.address,
            allowance: allowance
		})

        // test re-assign strategy steps
        let newStrategy = await NullStrategy.new(factory.address, oneToken.address, "new strategy", { from: governance });
        await factory.admitModule(newStrategy.address, moduleType.strategy, "new strategy", "url");
        tx = await oneToken.setStrategy(collateral, newStrategy.address, allowance, { from: governance });
        expectEvent(tx, 'StrategySet', {
			sender: governance,
            token: collateral,
            strategy: newStrategy.address,
            allowance: allowance
		})
        tx = await oneToken.setStrategy(collateral, strategy.address, allowance, { from: governance });
        expectEvent(tx, 'StrategySet', {
			sender: governance,
            token: collateral,
            strategy: strategy.address,
            allowance: allowance
		})

        // funds to vault and on to strategy
        await erc20Collateral.transfer(oneToken.address, amount);
        await truffleAssert.reverts(oneToken.removeAsset(collateral, { from: governance }), msg8 ); // fails because staff in the vault
        tx = await oneToken.toStrategy(strategy.address, collateral, amount);
        await truffleAssert.reverts(oneToken.removeAsset(collateral, { from: governance }), msg9 ); // vault is empty now, but strategy is not, so fails
        let strategyBalance = await erc20Collateral.balanceOf(strategy.address);
        assert.strictEqual(parseInt(strategyBalance.toString(10)), parseInt(amount), "the strategy did not receive the expected funds");
        await truffleAssert.reverts(oneToken.toStrategy(wrongTokenStrategy.address, collateral, amount, { from: governance }), msg7);

        expectEvent(tx, 'ToStrategy', {
			sender: governance,
            strategy: strategy.address,
            token: collateral,
            amount: amount
		})

        // partial funds back to vault
        tx = await oneToken.fromStrategy(strategy.address, collateral, half);
        in_vault_and_strategies = in_vault_and_strategies + parseInt(half.toString(10));
        vaultBalance = await erc20Collateral.balanceOf(oneToken.address);
        assert.strictEqual(parseInt(vaultBalance.toString(10)), parseInt(half), "the vault didn't withdraw the first half of the funds");
        await truffleAssert.reverts(oneToken.fromStrategy(wrongTokenStrategy.address, collateral, half, { from: governance }), msg7);
        
        expectEvent(tx, 'FromStrategy', {
			sender: governance,
            strategy: strategy.address,
            token: collateral,
            amount: half
		})

        // remove the strategy
        await truffleAssert.reverts(oneToken.removeStrategy(collateral, { from: badAddress }), msg1);
        tx = await oneToken.removeStrategy(collateral, { from: governance });

        // removal of the strategy does not close positions
        vaultBalance = await erc20Collateral.balanceOf(oneToken.address);
        assert.strictEqual(parseInt(vaultBalance.toString(10)), parseInt(half), "the vault should not have changed");

        asset = await oneToken.assets(collateral);
        assignedStrategy = asset["strategy"];
        assert.strictEqual(assignedStrategy, NULL_ADDRESS, "this strategy wasn't removed");

        expectEvent(tx, 'StrategyRemoved', {
			sender: governance,
            token: collateral,
            strategy: strategy.address
		})

        // manually closing positions to return funds to the vault
        await strategy.closeAllPositions();
        in_vault_and_strategies = in_vault_and_strategies + parseInt(half.toString(10));
    });

    it("should set a strategy allowance", async () => {
        
        let strategyName = "Do Nothing Strategy",
            allowance = "10",
            getAllowance,

            strategy = await NullStrategy.new(factory.address, oneToken.address, strategyName),
            strategy_2 = await NullStrategy.new(factory.address, oneToken.address, "another strategy"),

            collateral = await oneToken.collateralTokenAtIndex(0),
            erc20Collateral = await IERC20Extended.at(collateral);
        
        let msg1 = "OTV1B: not owner or controller";

        // assign strategy
        await factory.admitModule(strategy.address, moduleType.strategy, "strategy name", "url")
        await factory.admitModule(strategy_2.address, moduleType.strategy, "strategy name 2", "url")
        await oneToken.setStrategy(collateral, strategy_2.address, 0, { from: governance });

        // set strategy allowance to 10 (to be closed below)
        await oneToken.increaseStrategyAllowance(collateral, allowance);
        getAllowance = await erc20Collateral.allowance(oneToken.address, strategy_2.address);
        assert.strictEqual(parseInt(getAllowance.toString(10)), parseInt(allowance), "the initial allowance was not set");

        // setting new strategy results in old one being closed, its allowance set to 0 and closeStrategy event fired
        let tx = await oneToken.setStrategy(collateral, strategy.address, allowance, { from: governance });

        getAllowance = await erc20Collateral.allowance(oneToken.address, strategy_2.address);
        assert.strictEqual(parseInt(getAllowance.toString(10)), 0, "the allowance wasn't set to 0 after closure");

        expectEvent(tx, 'StrategyClosed', {
			sender: governance,
            token: collateral,
            strategy: strategy_2.address
		})

        // access control
        await truffleAssert.reverts(oneToken.increaseStrategyAllowance(collateral, allowance, { from: badAddress }), msg1);

        // adjust allowance
        tx = await oneToken.increaseStrategyAllowance(collateral, allowance);
        getAllowance = await erc20Collateral.allowance(oneToken.address, strategy.address);
        //allowance (set from the start + additional allowance from increaseStrategyAllowance)
        assert.strictEqual(parseInt(getAllowance.toString(10)), parseInt(20), "the initial allowance was not set");

        expectEvent(tx, 'StrategyAllowanceIncreased', {
			sender: governance,
            token: collateral,
            strategy: strategy.address,
            amount: allowance
		})

        // the strategy allowance should not change due to direct transfers to the strategy
        // it changes only when the strategy itself obtains funds from the vault
        await erc20Collateral.transfer(strategy.address, 31);
        in_vault_and_strategies = in_vault_and_strategies + 31;
        await oneToken.increaseStrategyAllowance(collateral, allowance);
        getAllowance = await erc20Collateral.allowance(oneToken.address, strategy.address);
        assert.strictEqual(parseInt(getAllowance.toString(10)), 30, "the allowance should be 30");

        // quick separate check for strategy balance
        let initialBalance = await oneToken.getHoldings(collateral);
        assert.strictEqual(parseInt(initialBalance[1].toString(10)), 31, "the strategy balance should be 31");

        // manually closing positions to return funds to the vault
        await strategy.closeAllPositions();
    });

    it("should close all strategy positions", async () => {

        let vaultBalance,
            strategyName = "Do Nothing Strategy",
            allowance = "10",
            amount = "1000",
            factory = await Factory.deployed(),
            strategy = await NullStrategy.new(factory.address, oneToken.address, strategyName),
            collateral = await oneToken.collateralTokenAtIndex(0),
            erc20Collateral = await IERC20Extended.at(collateral);

        let msg1 = "ICHIOwnable: caller is not the owner",
            msg2 = "OTV1B: unknown token",
            msg3 = "OTV1B: unknown strategy",
            msg4 = "OTV1B:cs: unknown token";

        await factory.admitModule(strategy.address, moduleType.strategy, "strategy name", "url");

        // access control
        await truffleAssert.reverts(oneToken.setStrategy(collateral, strategy.address, allowance, { from: badAddress }), msg1);
        await truffleAssert.reverts(oneToken.setStrategy(badAddress, strategy.address, allowance, { from: governance }), msg2);
        await truffleAssert.reverts(oneToken.setStrategy(collateral, badAddress, allowance, { from: governance }), msg3);
        await truffleAssert.reverts(oneToken.closeStrategy(badAddress, { from: governance }), msg4);

        // assign strategy
        await oneToken.setStrategy(collateral, strategy.address, allowance, { from: governance });
        let asset = await oneToken.assets(collateral);
        let assignedStrategy = asset["strategy"];
        let vault = await strategy.oneToken();
        assert.strictEqual(assignedStrategy, strategy.address, "the strategy is not assigned");
        assert.strictEqual(vault, oneToken.address, "the strategy is using the wrong vault");

        // funds to vault and on to strategy
        await erc20Collateral.transfer(oneToken.address, amount);
        await oneToken.toStrategy(strategy.address, collateral, amount);
        in_vault_and_strategies = in_vault_and_strategies + parseInt(amount.toString(10));
        let strategyBalance = await erc20Collateral.balanceOf(strategy.address);
        assert.strictEqual(parseInt(strategyBalance.toString(10)), parseInt(amount), "the strategy did not receive the expected funds");

        // close all positions
        await strategy.closeAllPositions();
        vaultBalance = await erc20Collateral.balanceOf(oneToken.address);
        assert.strictEqual(parseInt(vaultBalance.toString(10)), in_vault_and_strategies, "the vault didn't receive funds");
    });

    it("should change a existing strategy", async () => {
        let strategyName = "Do Nothing Strategy",
            allowance = "10",
            // getAllowance,
            factory = await Factory.deployed(),
            strategy = await NullStrategy.new(factory.address, oneToken.address, strategyName),
            collateral = await oneToken.collateralTokenAtIndex(0);
        
        // assign strategy
        await factory.admitModule(strategy.address, moduleType.strategy, "strategy name", "url")
        await oneToken.setStrategy(collateral, strategy.address, allowance, { from: governance });
    
        let strategyName2 = "Do Nothing Strategy 2",
            allowance2 = "10",
            strategy2 = await NullStrategy.new(factory.address, oneToken.address, strategyName2),
            collateral2 = await oneToken.collateralTokenAtIndex(0);

        // access control
        await factory.admitModule(strategy2.address, moduleType.strategy, "strategy name 2", "url")
        await oneToken.setStrategy(collateral2, strategy2.address, allowance2, { from: governance });
    })

    it("strategy allowance should be set to 0 when it's removed or re-set", async () => {

        let vaultBalance,
            strategyName = "Do Nothing Strategy",
            allowance = "10",
            amount = "1000",
            factory = await Factory.deployed(),
            strategy_1 = await NullStrategy.new(factory.address, oneToken.address, strategyName),
            strategy_2 = await NullStrategy.new(factory.address, oneToken.address, strategyName),
            collateral = await oneToken.collateralTokenAtIndex(0),
            erc20Collateral = await IERC20Extended.at(collateral);

        await factory.admitModule(strategy_1.address, moduleType.strategy, "strategy name", "url");
        await factory.admitModule(strategy_2.address, moduleType.strategy, "strategy name", "url");

        // assign a strategy
        await oneToken.setStrategy(collateral, strategy_1.address, allowance, { from: governance });

        // funds to vault and on to the strategy
        await erc20Collateral.transfer(oneToken.address, amount);
        await oneToken.toStrategy(strategy_1.address, collateral, amount);
        let strategyBalance = await erc20Collateral.balanceOf(strategy_1.address);
        assert.strictEqual(parseInt(strategyBalance.toString(10)), parseInt(amount), "the strategy did not receive the expected funds");

        // assign new strategy
        await oneToken.setStrategy(collateral, strategy_2.address, allowance, { from: governance });

        // allowance should become 0
        let strategy_allowance = await oneToken.allowance(strategy_1.address, collateral);
		assert.equal(strategy_allowance.toNumber(), 0, "strategy_1 should have 0 allowance after it's closed");

        // old strategy should still have its positions
        vaultBalance = await erc20Collateral.balanceOf(oneToken.address);
        assert.strictEqual(parseInt(vaultBalance.toString(10)), in_vault_and_strategies, "the vault have extra funds");

        // manually closing positions to return funds to the vault
        await strategy_1.closeAllPositions();

        // old strategy should have closed its positions now
        in_vault_and_strategies = in_vault_and_strategies + parseInt(amount.toString(10));
        vaultBalance = await erc20Collateral.balanceOf(oneToken.address);
        assert.strictEqual(parseInt(vaultBalance.toString(10)), in_vault_and_strategies, "the vault didn't receive funds");

        // funds to vault and on to the new strategy
        await erc20Collateral.transfer(oneToken.address, amount);
        await oneToken.toStrategy(strategy_2.address, collateral, amount);
        strategyBalance = await erc20Collateral.balanceOf(strategy_2.address);
        assert.strictEqual(parseInt(strategyBalance.toString(10)), parseInt(amount), "the new strategy did not receive the expected funds");

        // remove strategy
        await oneToken.removeStrategy(collateral, { from: governance });

        // allowance should become 0
        strategy_allowance = await oneToken.allowance(strategy_2.address, collateral)
		assert.equal(strategy_allowance.toNumber(), 0, "strategy_1 should have 0 allowance after it's closed");

        // old strategy should still have its positions
        vaultBalance = await erc20Collateral.balanceOf(oneToken.address);
        assert.strictEqual(parseInt(vaultBalance.toString(10)), in_vault_and_strategies, "the vault have extra funds");

        // manually closing positions to return funds to the vault
        await strategy_2.closeAllPositions();

        // new strategy should have closed its positions
        in_vault_and_strategies = in_vault_and_strategies + parseInt(amount.toString(10));
        vaultBalance = await erc20Collateral.balanceOf(oneToken.address);
        assert.strictEqual(parseInt(vaultBalance.toString(10)), in_vault_and_strategies, "the vault didn't receive funds");
        strategyBalance = await erc20Collateral.balanceOf(strategy_2.address);
        assert.strictEqual(parseInt(strategyBalance.toString(10)), 0, "the new strategy did not close its positions");
    });

    it("should not allow setting strategy alowance when strategy is missing", async () => {
        let msg1 = "OTV1B: no strategy";
        let collateral = await oneToken.collateralTokenAtIndex(0);

        await truffleAssert.reverts(oneToken.increaseStrategyAllowance(collateral, "1000", { from: governance }), msg1);
    });
    
});
