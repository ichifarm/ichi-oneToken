const { assert } = require("chai");
const truffleAssert = require('truffle-assertions');
const { expectEvent } = require("@openzeppelin/test-helpers");

const
	Factory = artifacts.require("OneTokenFactory"),	
	ICHIPeggedOracle = artifacts.require("ICHIPeggedOracle"),
	ICHICompositeOracle = artifacts.require("ICHICompositeOracle"),
	OneToken = artifacts.require("OneTokenV1");

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
	compositeOracle, 
	compositeOracle_0_Dec, 
	compositeOracle_18_Dec, 
	interimOracle1, 
	interimOracle2, 
	interimOracle3, 
	interimOracle4, 
	token_0_Dec, 
	token_18_Dec, 
	token2, 
	token1, 
	factory;

contract("ICHICompositeOracle", accounts => {
	
	beforeEach(async () => {
		governance = accounts[0];

		factory = await Factory.deployed();

		// these are 0 decimals
		token1 = await OneToken.new()
		token2 = await OneToken.new()
		token_0_Dec = await OneToken.new()

        oneTokenAddress = await factory.oneTokenAtIndex(0);
		// this is 18 decimals
		token_18_Dec = await OneToken.at(oneTokenAddress);

		interimOracle1 = await ICHIPeggedOracle.new(factory.address, "ICHIPeggedOracle", token_0_Dec.address);
		interimOracle2 = await ICHIPeggedOracle.new(factory.address, "ICHIPeggedOracle", token_0_Dec.address);
		interimOracle3 = await ICHIPeggedOracle.new(factory.address, "ICHIPeggedOracle", token_18_Dec.address);
		interimOracle4 = await ICHIPeggedOracle.new(factory.address, "ICHIPeggedOracle", token_18_Dec.address);

		await factory.admitModule(interimOracle1.address, moduleType.oracle, "interim oracle", "#");
        await factory.admitModule(interimOracle2.address, moduleType.oracle, "interim oracle", "#");
		await factory.admitModule(interimOracle3.address, moduleType.oracle, "interim oracle", "#");
        await factory.admitModule(interimOracle4.address, moduleType.oracle, "interim oracle", "#");
	});
	
	it("description is required", async () => {
		let msg1 = "ICHIModuleCommon: description cannot be empty";

        truffleAssert.reverts(ICHIPeggedOracle.new(factory.address, "", token_0_Dec.address), msg1);
	});
	
	it("should be ready to test", async () => {
		assert.isAtLeast(accounts.length, 2, "There are not at least two accounts to work with");
	});
	
	it("should be constructed", async () => {
		let msg1 = "ICHICompositeOracle: unequal interimTokens and Oracles list lengths",
			msg2 = "ICHIModuleCommon: oneTokenFactory cannot be empty",
			msg3 = "OracleCommon: indexToken cannot be empty";

		await truffleAssert.reverts(ICHICompositeOracle.new(NULL_ADDRESS, "ICHICompositeOracle", token2.address, [token_18_Dec.address], [interimOracle3.address], { from: governance }), msg2);
		await truffleAssert.reverts(ICHICompositeOracle.new(factory.address, "ICHICompositeOracle", NULL_ADDRESS, [token_18_Dec.address], [interimOracle3.address], { from: governance }), msg3);

		truffleAssert.reverts(ICHICompositeOracle.new(factory.address, "ICHICompositeOracle", token2.address, [], [interimOracle1.address]), msg1);
		compositeOracle = await ICHICompositeOracle.new(factory.address, "ICHICompositeOracle", token_18_Dec.address, [token_18_Dec.address], [interimOracle3.address]);
		assert.isNotNull(compositeOracle.address, "ICHICompositeOracle should be constructed");

		expectEvent.inConstruction(compositeOracle, 'OracleDeployed', {
			sender: governance,
			description: "ICHICompositeOracle",
			indexToken: token_18_Dec.address
		})
	});

	it("can be initialized with oracles in the chain initialize as well", async () => {
		compositeOracle_18_Dec = await ICHICompositeOracle.new(factory.address, "ICHICompositeOracle", token2.address, 
			[token1.address, token2.address], [interimOracle3.address, interimOracle4.address]);

		compositeOracle_0_Dec = await ICHICompositeOracle.new(factory.address, "ICHICompositeOracle", token2.address, 
			[token1.address, token2.address], [interimOracle1.address, interimOracle2.address]);

		await factory.admitModule(compositeOracle_0_Dec.address, moduleType.oracle, "token2 oracle", "#");
		let tx = await factory.admitForeignToken(token1.address, false, compositeOracle_0_Dec.address);

		// test event from ICHICompositeOracle
		expectEvent.inTransaction(tx.tx, ICHICompositeOracle, 'OracleInitialized', {
			sender: factory.address,
			baseToken: token1.address,
			indexToken: token2.address
		})

		// test event from ICHIPeggedOracle - oracle initialized from a composite oracle
		expectEvent.inTransaction(tx.tx, ICHIPeggedOracle, 'OracleInitialized', {
			sender: compositeOracle_0_Dec.address,
			baseToken: token1.address,
			indexToken: token_0_Dec.address
		})

		// test event from ICHIPeggedOracle - oracle initialized from a composite oracle
		expectEvent.inTransaction(tx.tx, ICHIPeggedOracle, 'OracleInitialized', {
			sender: compositeOracle_0_Dec.address,
			baseToken: token2.address,
			indexToken: token_0_Dec.address
		})
	});
	
	it("should be able to update", async () => {
		const updateTx = await compositeOracle.update(token1.address);
		assert.isNotNull(updateTx.transactionHash, "ICHICompositeOracle should be able to update interim oracle");
	});

	it("should be configured", async () => {
		const oracleCount = await compositeOracle_18_Dec.oracleCount();
		assert.equal(oracleCount.toString(10), "2", "ICHICompositeOracle.oracleCount() should return proper count");

		let interimOracle = await compositeOracle_18_Dec.oracleAtIndex(0);
		interimOracle = await ICHIPeggedOracle.at(interimOracle[0]);
		let interimQuote = await interimOracle.read(token1.address, "1000");
		assert.equal(interimQuote[0].toString(10), "1000000000000000000000", "ICHIPeggedOracle.read() should return proper amount");

		interimOracle = await compositeOracle_0_Dec.oracleAtIndex(0);
		interimOracle = await ICHIPeggedOracle.at(interimOracle[0]);
		interimQuote = await interimOracle.read(token1.address, "1000");
		assert.equal(interimQuote[0].toString(10), "1000000000000000000000", "ICHIPeggedOracle.read() should return proper amount");

	})

	it("read should return proper value", async () => {
		const value = "10001000000000000000000";
		const { amountUsd, volatility } = await compositeOracle.read(token2.address, value);
		assert.equal(amountUsd.toString(10), value, "ICHICompositeOracle.read() should return proper amountOut");
		assert.equal(volatility.toString(10), 1, "ICHICompositeOracle.read() should return proper volatility");
	})
	
	it("amountRequired should return proper value", async () => {
		const value = "10001000000000000000000";
		const { amountTokens, volatility } = await compositeOracle.amountRequired(token2.address, value);
		assert.equal(amountTokens.toString(10), value, "ICHICompositeOracle.amountRequired() should return proper amount of tokens");
		assert.equal(volatility.toString(10), 1, "ICHICompositeOracle.amountRequired() should return proper volatility");
	});
	
});
