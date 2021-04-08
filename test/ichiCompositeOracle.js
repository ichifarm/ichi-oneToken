const { assert } = require("chai");

const
	ICHIPeggedOracle = artifacts.require("ICHIPeggedOracle"),
	ICHICompositeOracle = artifacts.require("ICHICompositeOracle"),
	OneToken = artifacts.require("OneTokenV1");

let compositeOracle, interimOracle, token1, interimToken, token2;

contract("ICHICompositeOracle", accounts => {
	
	beforeEach(async () => {
		token1 = await OneToken.new()
		interimToken = await OneToken.new()
		token2 = await OneToken.new()
		interimOracle = await ICHIPeggedOracle.new("ICHIPeggedOracle", interimToken.address);
	});
	
	it("should be ready to test", async () => {
		assert.isAtLeast(accounts.length, 2, "There are not at least two accounts to work with");
	});
	
	it("should be constructed", async () => {
		compositeOracle = await ICHICompositeOracle.new("ICHICompositeOracle", token1.address, [interimToken.address], [interimOracle.address]);
		assert.isNotNull(compositeOracle.address, "ICHICompositeOracle should be constructed");
	});
	
	it("should be able to init", async () => {
		const initTx = await compositeOracle.init(token1.address);
		assert.isNotNull(initTx.transactionHash, "ICHICompositeOracle should be able to init interim oracle");
	});
	
	it("should be able to update", async () => {
		const updateTx = await compositeOracle.update(token1.address);
		assert.isNotNull(updateTx.transactionHash, "ICHICompositeOracle should be able to update interim oracle");
	});
	
	it("read should return proper value", async () => {
		const value = 1;
		const { amountOut, volatility } = await compositeOracle.read(token2.address, value);
		assert.equal(amountOut.toNumber(), value, "ICHICompositeOracle.read() should return proper amountOut");
		assert.equal(volatility.toNumber(), 0, "ICHICompositeOracle.read() should return proper volatility");
	})
	
	it("amountRequired should return proper value", async () => {
		const value = 1;
		const { tokens, volatility } = await compositeOracle.amountRequired(token2.address, value);
		assert.equal(tokens.toNumber(), value, "ICHICompositeOracle.amountRequired() should return proper amount of tokens");
		assert.equal(volatility.toNumber(), 0, "ICHICompositeOracle.amountRequired() should return proper volatility");
	});
	
	
});
