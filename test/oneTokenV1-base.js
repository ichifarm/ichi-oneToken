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
    collateralToken;

contract("OneToken V1 Base", accounts => {

    beforeEach(async () => {
        let oneTokenAddress;
        governance = accounts[0];
        badAddress = accounts[1];
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
        assert.strictEqual(m, mintMaster.address, "the controller address is unknown");
    });
    
    it("should know the oneToken's member token", async () => {
        let m = await oneToken.memberToken();
        assert.strictEqual(m, memberToken.address, "the controller address is unknown");
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

        await oneToken.changeController(controller.address, { from: governance });
        await truffleAssert.reverts(
            oneToken.changeController(badAddress, { from: badAddress }), msg1);
        await truffleAssert.reverts(
            oneToken.changeController(badAddress, { from: governance }), msg2);
        let c = await oneToken.controller();
        assert.strictEqual(c, controller.address, "controller is not set");
    });

    it("should allow a change of mintMaster", async () => {

        let msg1 = "ICHIOwnable: caller is not the owner";
        let msg2 = "OneTokenV1Base: mintMaster is not registered in the factory";

        await oneToken.changeMintMaster(mintMaster.address, { from: governance });
        await truffleAssert.reverts(oneToken.changeMintMaster(badAddress, { from: badAddress }), msg1);
        await truffleAssert.reverts( oneToken.changeMintMaster(badAddress, { from: governance }), msg2);
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
    });

    it("should permit removing an asset", async () => {

        let beforeCount;
        let newCount;
        let delta;
        let msg1 = "ICHIOwnable: caller is not the owner";

        await truffleAssert.reverts(oneToken.removeAsset(collateralToken.address, { from: badAddress }), msg1);
        // revert reasons from the AddressSet library do not bubble up to test level
        await truffleAssert.reverts(oneToken.removeAsset(badAddress, { from: governance }) /*, msg2 */);
        beforeCount = await oneToken.assetCount();
        beforeCount = parseInt(beforeCount.toString(10));
        await oneToken.removeAsset(collateralToken.address, { from: governance });
        newCount = await oneToken.assetCount();
        newCount = parseInt(newCount.toString(10));
        delta = beforeCount - newCount;
        assert.strictEqual(delta, 1, "there is not one less asset");
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
            msg3 = "OneTokenV1Base: strategy is not registered with the factory";

        await factory.admitModule(strategy.address, moduleType.strategy, "strategy name", "url");

        // access control
        await truffleAssert.reverts(oneToken.recoverFunds(strategy.address, collateral, half, { from: badAddress }), msg1);
        await truffleAssert.reverts(oneToken.setStrategy(collateral, strategy.address, allowance, { from: badAddress }), msg1);
        await truffleAssert.reverts(oneToken.setStrategy(badAddress, strategy.address, allowance, { from: governance }), msg2);
        await truffleAssert.reverts(oneToken.setStrategy(collateral, badAddress, allowance, { from: governance }), msg3);

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
        let strategyBalance = await erc20Collateral.balanceOf(strategy.address);
        assert.strictEqual(parseInt(strategyBalance.toString(10)), parseInt(amount), "the strategy did not receive the expected funds");

        // partial funds back to vault
        await oneToken.fromStrategy(strategy.address, collateral, half);
        vaultBalance = await erc20Collateral.balanceOf(oneToken.address);
        assert.strictEqual(parseInt(vaultBalance.toString(10)), parseInt(half), "the vault didn't withdraw the first half of the funds");
        
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
            msg3 = "OneTokenV1Base: strategy is not registered with the factory";

        // assign strategy
        await factory.admitModule(strategy.address, moduleType.strategy, "strategy name", "url")
        await oneToken.setStrategy(collateral, strategy.address, allowance, { from: governance });

        // access control

        // adjust allowance
        await oneToken.setStrategyAllowance(collateral, allowance);
        getAllowance = await erc20Collateral.allowance(oneToken.address, strategy.address);
        assert.strictEqual(parseInt(getAllowance.toString(10)), parseInt(allowance), "the initial allowance was not set");

        await erc20Collateral.transfer(strategy.address, 1);
        await oneToken.setStrategyAllowance(collateral, allowance);
        getAllowance = await erc20Collateral.allowance(oneToken.address, strategy.address);
        assert.strictEqual(parseInt(getAllowance.toString(10)), parseInt(allowance) - 1, "the initial allowance was not set");
    })

});
