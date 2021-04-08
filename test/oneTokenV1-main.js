const { assert, expect } = require("chai");
const truffleAssert = require('truffle-assertions');
const { time, prepare, deploy, getBigNumber, ADDRESS_ZERO } = require("./utilities")

const 
    OneToken = artifacts.require("OneTokenV1"),
    Factory = artifacts.require("OneTokenFactory"),
    ControllerNull = artifacts.require("NullController"),
    MintMasterIncremental = artifacts.require("Incremental"),
    TestMintMaster = artifacts.require("TestMintMaster"),
    OraclePegged = artifacts.require("ICHIPeggedOracle"),
    MemberToken = artifacts.require("MemberToken"),
    CollateralToken = artifacts.require("CollateralToken"),
    NullStrategy = artifacts.require("NullStrategy"),
    IERC20Extended = artifacts.require("IERC20Extended");

const 
    NULL_ADDRESS = "0x0000000000000000000000000000000000000000",
    RATIO_50 = "500000000000000000", // 50%
    RATIO_95 = "950000000000000000", // 95%
    RATIO_90 = "900000000000000000", // 90%
    STEP_002 =   "2000000000000000"  // 0.2%
    FEE =        "2000000000000000"; // 0.2%
    FEE_20 =   "200000000000000000"; // 20%

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
    testMintMaster,
    oracle,
    memberToken,
    collateralToken;

contract("OneToken V1 Main", accounts => {

    beforeEach(async () => {
        let oneTokenAddress;
        governance = accounts[0];
        badAddress = accounts[1];
        bob = accounts[2];
        version = await OneToken.deployed();
        factory = await Factory.deployed();
        controller = await ControllerNull.deployed();
        mintMaster = await MintMasterIncremental.deployed();
        testMintMaster = await TestMintMaster.deployed();
        oracle = await OraclePegged.deployed();
        memberToken = await MemberToken.deployed();
        collateralToken = await CollateralToken.deployed();
        oneTokenAddress = await factory.oneTokenAtIndex(0);
        oneToken = await OneToken.at(oneTokenAddress);
    });

    it("should be ready to test", async () => {
        assert.isAtLeast(accounts.length, 3, "There are not at least three accounts to work with");
    });
    
    it("should return 0 as initial user balance for tokens", async () => {
        let userBalance = await oneToken.balanceOf(bob, { from: bob });
        assert.strictEqual(parseInt(userBalance.toString(10)), 0, "user balance should be 0 for oneToken");

        let userBalanceCollateral = await oneToken.availableBalance(bob, collateralToken.address, { from: bob });
        assert.strictEqual(parseInt(userBalanceCollateral.toString(10)), 0, "user balance should be 0 for collateral token");
    });

    it("should not able to withdraw when balance is 0", async () => {
        let msg1 = "OneTokenV1: insufficient available funds."
            msg2 = "OneTokenV1: withdrawal amount must greater than zero.";

        await truffleAssert.reverts(oneToken.withdraw(collateralToken.address, 1, { from: bob }), msg1);
        
        await truffleAssert.reverts(oneToken.withdraw(collateralToken.address, 0, { from: bob }), msg2);
    });

    it("should be able to mint", async () => {
        let msg1 = "OneTokenV1: offer a collateral token",
            msg2 = "OneTokenV1: request oneTokens quantity",
            msg3 = "OneTokenV1: orders exceeds temporary limit."
            msg4 = "OneTokenV1: sender has insufficient member token balance.",
            msg5 = "OneTokenV1: sender has insufficient collateral token balance.";

        await truffleAssert.reverts(oneToken.mint(memberToken.address, 1, { from: bob }), msg1);
        await truffleAssert.reverts(oneToken.mint(collateralToken.address, 0, { from: bob }), msg2);

        await testMintMaster.setParams(oneToken.address, 
            RATIO_50, RATIO_95, STEP_002, RATIO_90, { from: governance });
        await testMintMaster.changeOracle(oneToken.address, oracle.address, { from: governance });

        await oneToken.changeMintMaster(testMintMaster.address, { from: governance });

        let theRatio = await oneToken.getMintingRatio();
        await truffleAssert.reverts(oneToken.mint(collateralToken.address, parseInt(theRatio[1].toString(10)) + 1, { from: bob }), msg3);
        
        // no allowance for member token, should fail on collateral balance check
        await truffleAssert.reverts(oneToken.mint(collateralToken.address, parseInt(theRatio[1].toString(10)) - 1, { from: bob }), msg5);

        // adding allowance for member token, should fail of member token balance check
        await memberToken.approve(oneToken.address, 1, { from: bob });
        await truffleAssert.reverts(oneToken.mint(collateralToken.address, parseInt(theRatio[1].toString(10)) - 1, { from: bob }), msg4);

        // adding allowance for collateral token
        await collateralToken.approve(oneToken.address, 3000, { from: bob });

        // transferring some member and collateral tokens to bob to work with
        await collateralToken.approve(bob, 3000, { from: governance });
        await memberToken.approve(bob, 3000, { from: governance });
        await collateralToken.transfer(bob, 2000, { from: governance });
        await memberToken.transfer(bob, 2000, { from: governance });
        
        // minting 999 oneTokens!
        await oneToken.mint(collateralToken.address, 999, { from: bob });
        let userCollateralBalance = await collateralToken.balanceOf(bob);
        let userMemberBalance = await memberToken.balanceOf(bob);
        // should take 998 collateral tokens because ran 1 member token allowance
        assert.strictEqual(parseInt(userCollateralBalance.toString(10)), 1002, "user collateral token balance should be 1002");
        assert.strictEqual(parseInt(userMemberBalance.toString(10)), 1999, "user member token balance should be 1999");

        // minting 1 more oneToken
        await oneToken.mint(collateralToken.address, 1, { from: bob });
        userCollateralBalance = await collateralToken.balanceOf(bob);
        // should take 1 collateral token because ran out of member token allowance
        assert.strictEqual(parseInt(userCollateralBalance.toString(10)), 1001, "user collateral token balance should be 1001");

        // checking the balance
        let userBalance = await oneToken.balanceOf(bob, { from: bob });
        assert.strictEqual(parseInt(userBalance.toString(10)), 1000, "user balance should be 1000 for oneToken");

        // adding bigger allowance for member token now so we can test the ratio (90%)
        await memberToken.approve(oneToken.address, 3000, { from: bob });
        await oneToken.mint(collateralToken.address, 1000, { from: bob });
        userCollateralBalance = await collateralToken.balanceOf(bob);
        // should take 900 collateral token because ran out of member token allowance
        assert.strictEqual(parseInt(userCollateralBalance.toString(10)), 101, "user collateral token balance should be 101");

        // return 101 collateral back to governance to make redeem tests easiere
        await collateralToken.approve(governance, 2000, { from: bob });
        await collateralToken.transfer(governance, 101, { from: bob });
    });

    it("should be able to redeem", async () => {
        let msg1 = "OneTokenV1: insufficient available funds.",
            msg2 = "OneTokenV1: withdrawal amount must greater than zero.",
            msg3 = "OneTokenV1: requested token is not collateral."
            msg4 = "OneTokenV1: sender has insufficient member token balance.",
            msg5 = "OneTokenV1: sender has insufficient collateral token balance.",
            msg6 = "OneTokenV1: collateral not recognized.";

        // initial liabilities are 0
        let liabilities = await oneToken.liabilities(collateralToken.address);
        assert.strictEqual(parseInt(liabilities.toString(10)), 0, "oneToken liabilities for collateral should be 0");

        // set fee to 20%
        await oneToken.setFee(FEE_20, { from: governance });

        // adding allowance for oneToken
        await oneToken.approve(bob, 1000, { from: bob });

        // trying to redeem into non-collateral
        await truffleAssert.reverts(oneToken.redeem(badAddress, 100, { from: bob }), msg6);

        // redeem 100 oneTokens
        await oneToken.redeem(collateralToken.address, 100, { from: bob });

        let collateralUserBalance = await oneToken.availableBalance(bob, collateralToken.address);
        assert.strictEqual(parseInt(collateralUserBalance.toString(10)), 0, "user available balance should be 0 for collateral token because we are in the same block as redeem call");

        liabilities = await oneToken.liabilities(collateralToken.address);
        assert.strictEqual(parseInt(liabilities.toString(10)), 80, "oneToken liabilities for collateral should be 80");

        // let's advance a block
        await time.advanceBlock();
        
        // checking the balance
        let userBalance = await oneToken.balanceOf(bob, { from: bob });
        assert.strictEqual(parseInt(userBalance.toString(10)), 1900, "user balance should be 1900 for oneToken");

        // now it should be 80
        collateralUserBalance = await oneToken.availableBalance(bob, collateralToken.address);
        assert.strictEqual(parseInt(collateralUserBalance.toString(10)), 80, "user available balance should be 80 for collateral token");

        await oneToken.redeem(collateralToken.address, 100, { from: bob });
        await time.advanceBlock();

        collateralUserBalance = await oneToken.availableBalance(bob, collateralToken.address, { from: bob });
        assert.strictEqual(parseInt(collateralUserBalance.toString(10)), 160, "user available balance should be 160 for collateral token");

        // trying to withdraw too much
        await truffleAssert.reverts(oneToken.withdraw(collateralToken.address, 10000, { from: bob }), msg1);
        // trying to withdraw 0
        await truffleAssert.reverts(oneToken.withdraw(collateralToken.address, 0, { from: bob }), msg2);

        // trying to withdraw non-collateral
        await truffleAssert.reverts(oneToken.withdraw(badAddress, 100, { from: bob }), msg3);

        let userCollateralBalance1 = await collateralToken.balanceOf(bob);

        // now let's withdraw 100
        await oneToken.withdraw(collateralToken.address, 100, { from: bob });

        let userCollateralBalance2 = await collateralToken.balanceOf(bob);
        assert.strictEqual(parseInt(userCollateralBalance2.toString(10))-100, parseInt(userCollateralBalance1.toString(10)), "user collateral holding should increase by 100");

        liabilities = await oneToken.liabilities(collateralToken.address);
        assert.strictEqual(parseInt(liabilities.toString(10)), 60, "oneToken liabilities for collateral should be 60");

        await time.advanceBlock();

        collateralUserBalance = await oneToken.availableBalance(bob, collateralToken.address);

        // minting 50 more oneToken (45 collateral should come from pending balance)
        await oneToken.mint(collateralToken.address, 50, { from: bob });
        let userCollateralBalance3 = await collateralToken.balanceOf(bob);
        assert.strictEqual(parseInt(userCollateralBalance3.toString(10)), parseInt(userCollateralBalance2.toString(10)), "user collateral holding should remain the same");
        // liabilities should drop to 15
        liabilities = await oneToken.liabilities(collateralToken.address);
        assert.strictEqual(parseInt(liabilities.toString(10)), 15, "oneToken liabilities for collateral should be 0");
    });

});
