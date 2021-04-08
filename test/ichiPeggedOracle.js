const { assert } = require("chai");
const truffleAssert = require('truffle-assertions');

const
    OraclePegged = artifacts.require("ICHIPeggedOracle"),
    CollateralToken = artifacts.require("CollateralToken");

const
    newName = "Renamed Oracle",
    failedName = "I should not be here";

let oracle,
    token,
    governance,
    badAddress;

contract("ICHIPeggedOracle", accounts => {

    beforeEach(async () => {
        governance = accounts[0];
        badAddress = accounts[1];
        oracle = await OraclePegged.deployed();
        token = await CollateralToken.deployed();
    });

    it("should be ready to test", async () => {
        assert.isAtLeast(accounts.length, 2, "There are not at least two accounts to work with");
    });

    it("should update the module description", async () => {
        msg1 = "ICHIOwnable: caller is not the owner";
        await oracle.updateDescription(newName, { from: governance });
        await truffleAssert.reverts(oracle.updateDescription(newName, { from: badAddress }), msg1);
        let newDescription = await oracle.moduleDescription();
        assert.strictEqual(newDescription, newName, "the module isn't correctly renamed");
    });
    
    it("read should return equivalent amount of index tokens for an amount of baseTokens", async () => {
        let amount = 1;
        const amountOut = await oracle.read(token.address, amount);
        assert.strictEqual(amount, amountOut.amountOut.toNumber());
        assert.strictEqual(amountOut.volatility.toNumber(), 0);
    });
    
    it("amountRequired should return the tokens needed to reach a target usd value", async () => {
        let amountUsd = 1;
        const tokens = await oracle.amountRequired(token.address, amountUsd);
        assert.strictEqual(amountUsd, tokens.tokens.toNumber());
        assert.strictEqual(tokens.volatility.toNumber(), 0);
    });

});
