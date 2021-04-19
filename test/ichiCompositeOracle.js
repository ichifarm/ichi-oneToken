const { assert } = require("chai");
const truffleAssert = require('truffle-assertions');
const { expectEvent } = require("@openzeppelin/test-helpers");

const
	Factory = artifacts.require("OneTokenFactory"),	
	ICHIPeggedOracle = artifacts.require("ICHIPeggedOracle"),
	ICHICompositeOracle = artifacts.require("ICHICompositeOracle"),
	OneToken = artifacts.require("OneTokenV1");

const moduleType = {
	version: 0,
	controller: 1,
	strategy: 2,
	mintMaster: 3,
	oracle: 4,
	voterRoll: 5
}
	
let governance, compositeOracle, interimOracle1, token1, interimToken, interimOracle2, token2, factory;

contract("ICHICompositeOracle", accounts => {
	
	beforeEach(async () => {
		governance = accounts[0];

		factory = await Factory.deployed();
		token1 = await OneToken.new()
		interimToken = await OneToken.new()
		token2 = await OneToken.new()
		interimOracle1 = await ICHIPeggedOracle.new(factory.address, "ICHIPeggedOracle", interimToken.address);
		interimOracle2 = await ICHIPeggedOracle.new(factory.address, "ICHIPeggedOracle", interimToken.address);

		await factory.admitModule(interimOracle1.address, moduleType.oracle, "interim oracle", "#");
        await factory.admitModule(interimOracle2.address, moduleType.oracle, "interim oracle", "#");
	});
	
	it("description is required", async () => {
		let msg1 = "ICHIModuleCommon: description cannot be empty";

        truffleAssert.reverts(ICHIPeggedOracle.new(factory.address, "", interimToken.address), msg1);
	});
	
	it("should be ready to test", async () => {
		assert.isAtLeast(accounts.length, 2, "There are not at least two accounts to work with");
	});
	
	it("should be constructed", async () => {
		let msg1 = "ICHICompositeOracle: unequal interimTokens and Oracles list lengths";
        truffleAssert.reverts(ICHICompositeOracle.new(factory.address, "ICHICompositeOracle", token2.address, [], [interimOracle1.address]), msg1);
		compositeOracle = await ICHICompositeOracle.new(factory.address, "ICHICompositeOracle", token2.address, [interimToken.address], [interimOracle1.address]);
		assert.isNotNull(compositeOracle.address, "ICHICompositeOracle should be constructed");

		expectEvent.inConstruction(compositeOracle, 'OracleDeployed', {
			sender: governance,
			description: "ICHICompositeOracle",
			indexToken: token2.address
		})
	});

	it("can be initialized with oracles in the chain initialize as well", async () => {
		let compositeOracle2 = await ICHICompositeOracle.new(factory.address, "ICHICompositeOracle", token2.address, 
			[token1.address, token2.address], [interimOracle1.address, interimOracle2.address]);

		await factory.admitModule(compositeOracle2.address, moduleType.oracle, "token2 oracle", "#");
		let tx = await factory.admitForeignToken(token1.address, false, compositeOracle2.address);

		// test event from ICHICompositeOracle
		expectEvent.inTransaction(tx.tx, ICHICompositeOracle, 'OracleInitialized', {
			sender: factory.address,
			baseToken: token1.address,
			indexToken: token2.address
		})

		// test event from ICHIPeggedOracle - oracle initialized from a composite oracle
		expectEvent.inTransaction(tx.tx, ICHIPeggedOracle, 'OracleInitialized', {
			sender: compositeOracle2.address,
			baseToken: token1.address,
			indexToken: interimToken.address
		})

		// test event from ICHIPeggedOracle - oracle initialized from a composite oracle
		expectEvent.inTransaction(tx.tx, ICHIPeggedOracle, 'OracleInitialized', {
			sender: compositeOracle2.address,
			baseToken: token2.address,
			indexToken: interimToken.address
		})
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
