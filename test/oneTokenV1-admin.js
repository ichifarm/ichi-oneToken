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

const 
    NULL_ADDRESS = "0x0000000000000000000000000000000000000000",
    NEW_RATIO = "500000000000000000", // 50%
    FEE =         "2000000000000000"; // 0.2%
    MAX_FEE =  "1000000000000000000"; // 100%

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

contract("OneToken V1 Admin", accounts => {

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
    
    it("should set the redemption fee", async () => {
        let msg1 = "ICHIOwnable: caller is not the owner"
            msg2 = "OneTokenV1: fee must be between 0 and 100%";

        truffleAssert.reverts(oneToken.setFee(MAX_FEE+1, { from: governance }), msg2);

        truffleAssert.reverts(oneToken.setFee(FEE, { from: badAddress }), msg1);
        await oneToken.setFee(FEE, { from: governance });
        let newFee = await oneToken.fee();
        assert.strictEqual(newFee.toString(10), FEE, "redemption fee did not set");
    });

    it("should adjust the minting ratio", async () => {
        
        let 
            theRatio,
            paramters,
            msg1 = "ICHIModuleCommon: msg.sender is not oneToken owner";
        
        await truffleAssert.reverts(mintMaster.setMinRatio(oneToken.address, NEW_RATIO, { from: badAddress }), msg1);
        await truffleAssert.reverts(mintMaster.setRatio(oneToken.address, NEW_RATIO, { from: badAddress }), msg1);
        
        await mintMaster.setMinRatio(oneToken.address, NEW_RATIO, { from: governance });
        await mintMaster.setRatio(oneToken.address, NEW_RATIO, { from: governance });
        theRatio = await mintMaster.getMintingRatio(oneToken.address);
        assert.strictEqual(theRatio[0].toString(10), NEW_RATIO, "mintMaster didn't set a new ratio");

        await oneToken.updateMintingRatio();
        theRatio = await oneToken.getMintingRatio();
        assert.strictEqual(theRatio[0].toString(10), NEW_RATIO, "the minting ratio did not update as expected");
    });

    it("should report holdings of any token", async () => {
        let initialBalance,
            newBalance,
            increase,
            amount = "1000";

        // unexpected receipt
        initialBalance = await oneToken.getHoldings(collateralToken.address);
        await collateralToken.transfer(oneToken.address, amount);
        newBalance = await oneToken.getHoldings(collateralToken.address);
        increase = parseInt(newBalance[0].toString(10)) - parseInt(initialBalance[0].toString(10));
        assert.strictEqual(increase, parseInt(amount), "reported token holdings did not adjust as expected");
    });

});
