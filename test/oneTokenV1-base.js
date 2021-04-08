const { assert } = require("chai");
const truffleAssert = require('truffle-assertions');

const
    OneToken = artifacts.require("OneTokenV1"),
    Factory = artifacts.require("OneTokenFactory"),
    ControllerNull = artifacts.require("NullController"),
    MintMasterIncremental = artifacts.require("Incremental"),
    OraclePegged = artifacts.require("ICHIPeggedOracle"),
    MemberToken = artifacts.require("MemberToken"),
    CollateralToken = artifacts.require("CollateralToken"),
    NullStrategy = artifacts.require("NullStrategy"),
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
        let f = await oneToken.factory();
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

    it("should allow a change of controller", async () => {

        msg1 = "ICHIOwnable: caller is not the owner";
        msg2 = "OneTokenV1Base: controller is not registered in the factory";
        msg3 = "OneTokenV1Base: unknown controller";

        await oneToken.changeController(controller.address, { from: governance });
        await truffleAssert.reverts(oneToken.changeController(badAddress, { from: badAddress }), msg1);
        await truffleAssert.reverts(oneToken.changeController(badAddress, { from: governance }), msg2);
        await truffleAssert.reverts(oneToken.changeController(mintMaster.address, { from: governance }), msg3);
        let c = await oneToken.controller();
        assert.strictEqual(c, controller.address, "controller is not set");
    });

    it("should allow a change of factory", async () => {

        msg1 = "ICHIOwnable: caller is not the owner";
        msg2 = "OneTokenV1Base: proposed factory does not emit factory fingerprint";

        await oneToken.setFactory(factory.address, { from: governance });
        await truffleAssert.reverts(
            oneToken.setFactory(badAddress, { from: badAddress }), msg1);
        await truffleAssert.reverts(
            oneToken.setFactory(controller.address, { from: governance }), msg2);
        await truffleAssert.reverts(
            oneToken.setFactory(badAddress, { from: governance }), ""); // reverts without reason

        // this one is expected to fail with "reverted without a reason"
        /*
        try {
            await oneToken.setFactory(badAddress, { from: governance });
        } catch (e) {
            console.log("Expected Error = "+ e);
        }
        */
        
        let f = await oneToken.factory();
        assert.strictEqual(f, factory.address, "factory is not set");
    });

    it("should allow a change of mintMaster", async () => {

        let msg1 = "ICHIOwnable: caller is not the owner";
        let msg2 = "OneTokenV1Base: mintMaster is not registered in the factory";
        let msg3 = "OneTokenV1Base: unknown mintMaster";

        await oneToken.changeMintMaster(mintMaster.address, { from: governance });
        await truffleAssert.reverts(oneToken.changeMintMaster(badAddress, { from: badAddress }), msg1);
        await truffleAssert.reverts( oneToken.changeMintMaster(badAddress, { from: governance }), msg2);
        await truffleAssert.reverts(oneToken.changeMintMaster(controller.address, { from: governance }), msg3);
        let m = await oneToken.mintMaster();
        assert.strictEqual(m, mintMaster.address, "mintMaster is not set");
    });

    it("should permit adding an asset", async () => {

        let msg1 = "ICHIOwnable: caller is not the owner";
        let msg2 = "OneTokenV1Base: unknown oracle or token";
        let msg3 = "OneTokenV1Base: collateral already exists";
        
        // deploy a new token
        let newToken = await CollateralToken.new();

        // register in the factory via factory governance
        await factory.admitForeignToken(newToken.address, true, oracle.address);

        // guards
        await truffleAssert.reverts(oneToken.addAsset(newToken.address, oracle.address, { from: badAddress }), msg1);
        await truffleAssert.reverts(oneToken.addAsset(badAddress, oracle.address, { from: governance }), msg2);
        await truffleAssert.reverts(oneToken.addAsset(newToken.address, badAddress, { from: governance }), msg2);
        await truffleAssert.reverts(oneToken.addAsset(collateralToken.address, oracle.address, { from: governance }), msg3);

        // admit the asset
        await oneToken.addAsset(newToken.address, oracle.address);

        let assetCount = await oneToken.assetCount();
        assert.strictEqual(parseInt(assetCount.toString(10)), 3, "there are not exactly three assets");

        let isAsset = await oneToken.isAsset(newToken.address);
        assert.strictEqual(isAsset, true, "assets should be there");

        let assetAtIndex = await oneToken.assetAtIndex(assetCount-1);
        assert.strictEqual(newToken.address, assetAtIndex, "last asset in the set should match the last one added");
    });

    it("should permit removing an asset", async () => {

        let beforeCount;
        let newCount;
        let delta;
        let msg1 = "ICHIOwnable: caller is not the owner";
        let msg2 = "OneTokenV1Base: unknown token";

        await truffleAssert.reverts(oneToken.removeAsset(collateralToken.address, { from: badAddress }), msg1);
        const unknownToken = await CollateralToken.new();
        await truffleAssert.reverts(oneToken.removeAsset(unknownToken.address, { from: governance }), msg2 );
        // revert reasons from the AddressSet library do not bubble up to test level
        await truffleAssert.reverts(oneToken.removeAsset(badAddress, { from: governance }));

        // remove collateral token    
        beforeCount = await oneToken.assetCount();
        beforeCount = parseInt(beforeCount.toString(10));
        await oneToken.removeAsset(collateralToken.address, { from: governance });
        newCount = await oneToken.assetCount();
        newCount = parseInt(newCount.toString(10));
        delta = beforeCount - newCount;
        assert.strictEqual(delta, 1, "there is not one less asset");

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
        let msg2 = "OneTokenV1Base: unknown oracle or token";
        let msg3 = "OneTokenV1Base: token already exists";
        
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
            strategy = await NullStrategy.new(oneToken.address, strategyName),
            collateral = await oneToken.collateralTokenAtIndex(0),
            erc20Collateral = await IERC20Extended.at(collateral);

        let msg1 = "ICHIOwnable: caller is not the owner",
            msg2 = "OneTokenV1Base: unknown token",
            msg3 = "OneTokenV1Base: strategy is not registered with the factory"
            msg4 = "OneTokenV1Base: unknown strategy",
            msg5 = "OneTokenV1Base: cannot assign strategy that doesn't recognize this vault",
            msg6 = "OneTokenV1Base: unknown strategy owner",
            msg7 = "OneTokenV1Base: not the token strategy",
            msg8 = "OneTokenV1Base: cannot remove token with non-zero balance in the vault.",
            msg9 = "OneTokenV1Base: cannot remove asset with non-zero balance in the strategy.";

        await factory.admitModule(strategy.address, moduleType.strategy, "strategy name", "url");

        // access control
        await truffleAssert.reverts(oneToken.recoverFunds(strategy.address, collateral, half, { from: badAddress }), msg1);
        await truffleAssert.reverts(oneToken.setStrategy(collateral, strategy.address, allowance, { from: badAddress }), msg1);
        await truffleAssert.reverts(oneToken.setStrategy(badAddress, strategy.address, allowance, { from: governance }), msg2);
        await truffleAssert.reverts(oneToken.setStrategy(collateral, badAddress, allowance, { from: governance }), msg3);
        await truffleAssert.reverts(oneToken.setStrategy(collateral, mintMaster.address, allowance, { from: governance }), msg4);

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
        let wrongTokenStrategy = await NullStrategy.new(oneToken_2.address, "strategy with wrong token");
        await factory.admitModule(wrongTokenStrategy.address, moduleType.strategy, "strategy with wrong token", "url");
        await truffleAssert.reverts(oneToken.setStrategy(collateral, wrongTokenStrategy.address, allowance, { from: governance }), msg5);
        // end of msg5 pre-condition check

        // more access control
        let wrongOwnerStrategy = await NullStrategy.new(oneToken.address, "strategy with wrong owner", { from: bob });
        await factory.admitModule(wrongOwnerStrategy.address, moduleType.strategy, "strategy with wrong owner", "url");
        await truffleAssert.reverts(oneToken.setStrategy(collateral, wrongOwnerStrategy.address, allowance, { from: governance }), msg6);

        // assign strategy
        await oneToken.setStrategy(collateral, strategy.address, allowance, { from: governance });
        let asset = await oneToken.assets(collateral);
        let assignedStrategy = asset["strategy"];
        let vault = await strategy.oneToken();
        assert.strictEqual(assignedStrategy, strategy.address, "the strategy is not assigned");
        assert.strictEqual(vault, oneToken.address, "the strategy is using the wrong vault");

        // funds to vault and on to strategy
        await erc20Collateral.transfer(oneToken.address, amount);
        await truffleAssert.reverts(oneToken.removeAsset(collateral, { from: governance }), msg8 ); // fails because staff in the vault
        await oneToken.toStrategy(strategy.address, collateral, amount);
        in_vault_and_strategies = in_vault_and_strategies + parseInt(amount.toString(10));
        await truffleAssert.reverts(oneToken.removeAsset(collateral, { from: governance }), msg9 ); // vault is empty now, but strategy is not, so fails
        let strategyBalance = await erc20Collateral.balanceOf(strategy.address);
        assert.strictEqual(parseInt(strategyBalance.toString(10)), parseInt(amount), "the strategy did not receive the expected funds");
        await truffleAssert.reverts(oneToken.toStrategy(wrongTokenStrategy.address, collateral, amount, { from: governance }), msg7);

        // partial funds back to vault
        await oneToken.fromStrategy(strategy.address, collateral, half);
        vaultBalance = await erc20Collateral.balanceOf(oneToken.address);
        assert.strictEqual(parseInt(vaultBalance.toString(10)), parseInt(half), "the vault didn't withdraw the first half of the funds");
        await truffleAssert.reverts(oneToken.fromStrategy(wrongTokenStrategy.address, collateral, half, { from: governance }), msg7);
        
        // remove the strategy
        await truffleAssert.reverts(oneToken.removeStrategy(collateral, { from: badAddress }), msg1);
        await oneToken.removeStrategy(collateral, { from: governance });
        asset = await oneToken.assets(collateral);
        assignedStrategy = asset["strategy"];
        assert.strictEqual(assignedStrategy, NULL_ADDRESS, "this strategy wasn't removed");

        // recover remaining funds from de-activated strategy
        await oneToken.recoverFunds(strategy.address, collateral, half);
        vaultBalance = await erc20Collateral.balanceOf(oneToken.address);
        assert.strictEqual(parseInt(vaultBalance.toString(10)), parseInt(amount), "the vault didn't recover the second half of the funds");
    });

    it("should set a strategy allowance", async () => {
        
        let strategyName = "Do Nothing Strategy",
            allowance = "10",
            getAllowance,
            strategy = await NullStrategy.new(oneToken.address, strategyName),
            collateral = await oneToken.collateralTokenAtIndex(0),
            erc20Collateral = await IERC20Extended.at(collateral);
        
        let msg1 = "ICHIOwnable: caller is not the owner",
            msg2 = "OneTokenV1Base: unknown token",
            msg3 = "OneTokenV1Base: strategy is not registered with the factory"
            msg4 = "OneTokenV1Base: not owner or controller.";

        // assign strategy
        await factory.admitModule(strategy.address, moduleType.strategy, "strategy name", "url")
        await oneToken.setStrategy(collateral, strategy.address, allowance, { from: governance });

        // access control
        await truffleAssert.reverts(oneToken.setStrategyAllowance(collateral, allowance, { from: badAddress }), msg4);

        // adjust allowance
        await oneToken.setStrategyAllowance(collateral, allowance);
        getAllowance = await erc20Collateral.allowance(oneToken.address, strategy.address);
        assert.strictEqual(parseInt(getAllowance.toString(10)), parseInt(allowance), "the initial allowance was not set");

        await erc20Collateral.transfer(strategy.address, 1);
        in_vault_and_strategies = in_vault_and_strategies + 1;
        await oneToken.setStrategyAllowance(collateral, allowance);
        getAllowance = await erc20Collateral.allowance(oneToken.address, strategy.address);
        assert.strictEqual(parseInt(getAllowance.toString(10)), parseInt(allowance) - 1, "the initial allowance was not set");

        await erc20Collateral.transfer(strategy.address, 20);
        in_vault_and_strategies = in_vault_and_strategies + 20;
        await oneToken.setStrategyAllowance(collateral, allowance);
        getAllowance = await erc20Collateral.allowance(oneToken.address, strategy.address);
        assert.strictEqual(parseInt(getAllowance.toString(10)), 0, "the initial allowance should be 0");

        // quick separate check for strategy balance
        let initialBalance = await oneToken.getHoldings(collateral);
        assert.strictEqual(parseInt(initialBalance[1].toString(10)), 21, "the strategy balance should be 21");
    });

    it("should close all strategy positions", async () => {

        let vaultBalance,
            strategyName = "Do Nothing Strategy",
            allowance = "10",
            amount = "1000",
            strategy = await NullStrategy.new(oneToken.address, strategyName),
            collateral = await oneToken.collateralTokenAtIndex(0),
            erc20Collateral = await IERC20Extended.at(collateral);

        let msg1 = "ICHIOwnable: caller is not the owner",
            msg2 = "OneTokenV1Base: unknown token",
            msg3 = "OneTokenV1Base: strategy is not registered with the factory",
            msg4 = "OneTokenV1Base::closeStrategy: unknown token";

        await factory.admitModule(strategy.address, moduleType.strategy, "strategy name", "url");

        // access control
        await truffleAssert.reverts(oneToken.recoverFunds(strategy.address, collateral, amount, { from: badAddress }), msg1);
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
            getAllowance,
            strategy = await NullStrategy.new(oneToken.address, strategyName),
            collateral = await oneToken.collateralTokenAtIndex(0),
            erc20Collateral = await IERC20Extended.at(collateral);
        
        // assign strategy
        await factory.admitModule(strategy.address, moduleType.strategy, "strategy name", "url")
        await oneToken.setStrategy(collateral, strategy.address, allowance, { from: governance });
    
        let strategyName2 = "Do Nothing Strategy 2",
            allowance2 = "10",
            getAllowance2,
            strategy2 = await NullStrategy.new(oneToken.address, strategyName2),
            collateral2 = await oneToken.collateralTokenAtIndex(0),
            erc20Collateral2 = await IERC20Extended.at(collateral2);

        // access control
        await factory.admitModule(strategy2.address, moduleType.strategy, "strategy name 2", "url")
        await oneToken.setStrategy(collateral2, strategy2.address, allowance2, { from: governance });
    })
    
});
