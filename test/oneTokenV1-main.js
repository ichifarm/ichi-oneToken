const { assert } = require("chai");
const truffleAssert = require('truffle-assertions');
const { expectEvent } = require("@openzeppelin/test-helpers");
const { time } = require("./utilities")

const
    OneToken = artifacts.require("OneTokenV1"),
    Factory = artifacts.require("OneTokenFactory"),
    ControllerNull = artifacts.require("NullController"),
    MintMasterIncremental = artifacts.require("Incremental"),
    TestMintMaster = artifacts.require("TestMintMaster"),
    OraclePegged = artifacts.require("ICHIPeggedOracle"),
    MemberToken = artifacts.require("MemberToken"),
    CollateralToken = artifacts.require("CollateralToken");

const
    NULL_ADDRESS = "0x0000000000000000000000000000000000000000",
    RATIO_50 =   "500000000000000000", // 50%
    RATIO_95 =   "950000000000000000", // 95%
    RATIO_110 = "1100000000000000000", // 110%
    RATIO_90 =   "900000000000000000", // 90%
    STEP_002 =     "2000000000000000", // 0.2%
    FEE =          "2000000000000000"; // 0.2%
    FEE_20 =     "200000000000000000"; // 20%
    FEE_10 =     "100000000000000000"; // 10%
    MAX_ORDER =      "10000000000000000000000"; // 10000
    DBL_MAX_ORDER =  "20000000000000000000000"; // 20000
    BIG_ORDER =      "10000000000000000001000"; // 10000 + some

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
    bob,
    jane,
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
        jane = accounts[3];
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
    });

    it("should not able to withdraw when balance is 0", async () => {
        let msg1 = "OTV1: amount must be > 0";

        await truffleAssert.reverts(oneToken.redeem(collateralToken.address, 0, { from: bob }), msg1);
    });

    it("should be able to mint", async () => {
        let msg1 = "OTV1: offer a collateral token",
            msg2 = "OTV1: order must be > 0",
            msg3 = "OTV1: order exceeds limit",
            msg4 = "OTV1: NSF: member token",
            msg5 = "OTV1: NSF: collateral token";

        await truffleAssert.reverts(oneToken.mint(memberToken.address, 1, { from: bob }), msg1);
        await truffleAssert.reverts(oneToken.mint(collateralToken.address, 0, { from: bob }), msg2);

        //let newOracle = await OraclePegged.new(factory.address, "new oracle", oneToken.address);
        //await factory.admitModule(newOracle.address, moduleType.oracle, "new oracle", "#");
        //await factory.assignOracle(oneToken.address, newOracle.address);

        await oneToken.changeMintMaster(testMintMaster.address, oracle.address, { from: governance });
        // has to setParams after changeMintMaster - because it's relinitialized
        await testMintMaster.setParams(oneToken.address,
            RATIO_50, RATIO_95, STEP_002, RATIO_90, { from: governance });

        let theRatio = await oneToken.getMintingRatio(collateralToken.address);
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
        let tx = await oneToken.mint(collateralToken.address, 999, { from: bob });
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

        expectEvent(tx, 'Minted', {
			sender: bob,
			collateral: collateralToken.address,
            oneTokens: "999",
            memberTokens: "1",
            collateralTokens: "998"
		})
    });

    it("should be able to redeem", async () => {
        let msg1 = "OTV1: NSF: oneToken",
            msg2 = "OTV1: amount must be > 0",
            msg3 = "OTV1: unknown collateral";

        // set fee to 20%
        let tx = await oneToken.setRedemptionFee(FEE_20, { from: governance });

        expectEvent(tx, 'NewRedemptionFee', {
            sender: governance,
			fee: FEE_20
		})

        // adding allowance for oneToken
        // approval is implied
        // await oneToken.approve(bob, 1000, { from: bob });

        // trying to redeem into non-collateral
        await truffleAssert.reverts(oneToken.redeem(badAddress, 100, { from: bob }), msg3);

        // redeem 100 oneTokens
        await oneToken.redeem(collateralToken.address, 100, { from: bob });

        // let's advance a block
        await time.advanceBlock();
        
        // checking the balance
        let userBalance = await oneToken.balanceOf(bob, { from: bob });
        assert.strictEqual(parseInt(userBalance.toString(10)), 1900, "user balance should be 1900 for oneToken");

        tx = await oneToken.redeem(collateralToken.address, 100, { from: bob });
        await time.advanceBlock();

        expectEvent(tx, 'Redeemed', {
			sender: bob,
			collateral: collateralToken.address,
            amount: "100"
		})

        // trying to withdraw too much
        await truffleAssert.reverts(oneToken.redeem(collateralToken.address, 10000, { from: bob }), msg1);
        // trying to withdraw 0
        await truffleAssert.reverts(oneToken.redeem(collateralToken.address, 0, { from: bob }), msg2);

        let userCollateralBalance1 = await collateralToken.balanceOf(bob);

        // now let's withdraw 100
        await oneToken.redeem(collateralToken.address, 100, { from: bob });

        let userCollateralBalance2 = await collateralToken.balanceOf(bob);
        // with 20% redemption fee, only get 80 collateral back
        assert.strictEqual(parseInt(userCollateralBalance2.toString(10))-80, parseInt(userCollateralBalance1.toString(10)), "user collateral holding should increase by 100");

    });
    
    it("should be able to set minting fee", async () => {
        let tx = await oneToken.setMintingFee(0, { from: governance });

        expectEvent(tx, 'NewMintingFee', {
            sender: governance,
			fee: "0"
		})

        tx = await oneToken.setMintingFee( FEE_10, { from: governance } );

        expectEvent(tx, 'NewMintingFee', {
            sender: governance,
			fee: FEE_10
		})

        // ratio = 90, need 90 coll and 10 mem tokens
        // with 10% minting fee, need 10 more coll token, so 100 coll tokens
        // minus 15 liabilities, so need 85 coll tokens
        let startCollBalance = parseInt((await collateralToken.balanceOf(bob)).toString(10));
        let startMemBalance = parseInt((await memberToken.balanceOf(bob)).toString(10));
        
        tx = await oneToken.mint(collateralToken.address, 100, { from: bob });

        let endCollBalance = parseInt((await collateralToken.balanceOf(bob)).toString(10));
        let endMemBalance = parseInt((await memberToken.balanceOf(bob)).toString(10));

        let reqCollateral = (100 * 90 + 100 * 10) / 100;
        let reqMember = 100 * 10 / 100;

        assert.strictEqual( reqCollateral, startCollBalance - endCollBalance, "user remaining collateral tokens should match");
        assert.strictEqual( reqMember, startMemBalance - endMemBalance, "user remaining member tokens should match");
    });
    
    it("should revert on set minting fee if not between 0 and 100 percents", async () => {
        let msg1 = "OTV1: fee must be <= 100%";

        await truffleAssert.reverts(oneToken.setMintingFee( RATIO_110, { from: governance }), msg1);
    });

    it("should apply minting fee correctly in all cases", async () => {

        await oneToken.changeMintMaster(testMintMaster.address, oracle.address, { from: governance });
        // has to setParams after changeMintMaster - because it's relinitialized
        await testMintMaster.setParams(oneToken.address,
            RATIO_50, RATIO_95, STEP_002, RATIO_90, { from: governance });

        await oneToken.setMintingFee( FEE_10, { from: governance } );

        let theRatio = await oneToken.getMintingRatio(collateralToken.address);

        // adding allowance for member token
        await memberToken.approve(oneToken.address, 10, { from: jane });

        // adding allowance for collateral token
        await collateralToken.approve(oneToken.address, 3000, { from: jane });

        // transferring some member and collateral tokens to jane to work with
        await collateralToken.approve(jane, 3000, { from: governance });
        await memberToken.approve(jane, 3000, { from: governance });
        await collateralToken.transfer(jane, 3000, { from: governance });
        await memberToken.transfer(jane, 2000, { from: governance });
        
        // minting 1000 oneTokens!
        let tx = await oneToken.mint(collateralToken.address, 1000, { from: jane });
        let userCollateralBalance = await collateralToken.balanceOf(jane);
        let userMemberBalance = await memberToken.balanceOf(jane);

        // should have 1910 collateral tokens left: 3000 - (1000 - 10) - (1000 * 0.1) (low member allowance + fee)
        assert.strictEqual(parseInt(userCollateralBalance.toString(10)), 1910, "user collateral token balance should be 1910");
        assert.strictEqual(parseInt(userMemberBalance.toString(10)), 1990, "user member token balance should be 1990");

        // approving more member tokens for minting and minting 1000 more oneToken
        await memberToken.approve(oneToken.address, 200, { from: jane });
        await oneToken.mint(collateralToken.address, 1000, { from: jane });
        userCollateralBalance = await collateralToken.balanceOf(jane);
        userMemberBalance = await memberToken.balanceOf(jane);

        // should have 910 collateral tokens left: 1910 - (1000 - 100) - (1000 * 0.1) (just fee)
        assert.strictEqual(parseInt(userCollateralBalance.toString(10)), 910, "user collateral token balance should be 910");
        assert.strictEqual(parseInt(userMemberBalance.toString(10)), 1890, "user member token balance should be 1890");

        // checking the balance
        let userBalance = await oneToken.balanceOf(jane, { from: jane });
        assert.strictEqual(parseInt(userBalance.toString(10)), 2000, "user balance should be 2000 for oneToken");
    });

    it("should adhere to mintMaster's maxOrder setting", async () => {
        let msg1 = "OTV1: order exceeds limit";

        await oneToken.changeMintMaster(mintMaster.address, oracle.address, { from: governance });
        // has to setParams after changeMintMaster - because it's relinitialized
        await mintMaster.setParams(oneToken.address,
            RATIO_50, RATIO_95, STEP_002, RATIO_90, MAX_ORDER, { from: governance });

        // adding allowance for member token
        await memberToken.approve(oneToken.address, DBL_MAX_ORDER, { from: jane });

        // adding allowance for collateral token
        await collateralToken.approve(oneToken.address, DBL_MAX_ORDER, { from: jane });

        // transferring some member and collateral tokens to jane to work with
        await collateralToken.approve(jane, DBL_MAX_ORDER, { from: governance });
        await memberToken.approve(jane, DBL_MAX_ORDER, { from: governance });
        await collateralToken.transfer(jane, DBL_MAX_ORDER, { from: governance });
        await memberToken.transfer(jane, DBL_MAX_ORDER, { from: governance });
        
        let startUserBalance = await oneToken.balanceOf(jane, { from: jane });

        // should fail because we exceed maxOrderLimit
        await truffleAssert.reverts(oneToken.mint(collateralToken.address, 
            BIG_ORDER, { from: jane }), msg1);

        // minting 1000 oneTokens!
        await oneToken.mint(collateralToken.address, 1000, { from: jane });

        let endUserBalance = await oneToken.balanceOf(jane, { from: jane });
        assert.strictEqual(parseInt(endUserBalance.toString(10)) - parseInt(startUserBalance.toString(10)), 1000, "user balance should have increased by 1000 oneToken");
    });

});
