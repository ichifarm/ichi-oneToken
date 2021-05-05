const { assert } = require("chai");
const truffleAssert = require('truffle-assertions');
const { expectEvent } = require("@openzeppelin/test-helpers");

const
	OraclePegged = artifacts.require("ICHIPeggedOracle"),
	CollateralToken = artifacts.require("CollateralToken"),
	Factory = artifacts.require("OneTokenFactory"),
	ICHIModuleCommon = artifacts.require("ICHIModuleCommon"),
	OneToken = artifacts.require("OneTokenV1");

const
	newName = "Renamed Oracle",
	failedName = "I should not be here";

const moduleType = {
	version: 0,
	controller: 1,
	strategy: 2,
	mintMaster: 3,
	oracle: 4,
	voterRoll: 5
}
	
let oracle,
	token,
	factory,
	governance,
	badAddress;

contract("ICHIPeggedOracle", accounts => {
	
	beforeEach(async () => {
		governance = accounts[0];
		badAddress = accounts[1];
		factory = await Factory.deployed();
		oracle = await OraclePegged.deployed();
		token = await CollateralToken.deployed();
	});
	
	it("should be ready to test", async () => {
		assert.isAtLeast(accounts.length, 2, "There are not at least two accounts to work with");
	});
	
	it("should emit event when being deployed", async () => {
		interimToken = await CollateralToken.new()
		interimOracle = await OraclePegged.new(factory.address, "ICHIPeggedOracle", interimToken.address);
	
		expectEvent.inConstruction(interimOracle, 'OracleDeployed', {
			sender: governance,
			description: "ICHIPeggedOracle",
			indexToken: interimToken.address
		})
		expectEvent.inConstruction(interimOracle, 'ModuleDeployed', {
			sender: governance,
			moduleType: moduleType.oracle.toString(),
			description: "ICHIPeggedOracle"
		})
	});
	
	it("initialized from the Factory on foreignToken admission", async () => {
		let token1 = await OneToken.new()
        await factory.admitModule(interimOracle.address, moduleType.oracle, "interimToken oracle", "#");
		let tx = await factory.admitForeignToken(token1.address, false, interimOracle.address);
	
		// test event from ICHIPeggedOracle
		expectEvent.inTransaction(tx.tx, OraclePegged, 'OracleInitialized', {
			sender: factory.address,
			baseToken: token1.address,
			indexToken: interimToken.address
		})
	});
	
	it("should update the module description", async () => {
		msg1 = "ICHIOwnable: caller is not the owner";
		let tx = await oracle.updateDescription(newName, { from: governance });
		await truffleAssert.reverts(oracle.updateDescription(newName, { from: badAddress }), msg1);
		let newDescription = await oracle.moduleDescription();
		assert.strictEqual(newDescription, newName, "the module isn't correctly renamed");

		// test event from ICHIModuleCommon
		expectEvent.inTransaction(tx.tx, ICHIModuleCommon, 'DescriptionUpdated', {
			sender: governance,
			description: newName
		})
		
	});
	
	it("read should return equivalent amount of index tokens for an amount of baseTokens", async () => {
		let amount = 1;
		const { amountUsd, volatility } = await oracle.read(token.address, amount);
		assert.strictEqual(amount, amountUsd.toNumber());
		assert.strictEqual(volatility.toNumber(), 1);
	});
	
	it("amountRequired should return the tokens needed to reach a target usd value", async () => {
		let amountUsd = 1;
		const { tokens, volatility } = await oracle.amountRequired(token.address, amountUsd);
		assert.strictEqual(amountUsd, tokens.toNumber());
		assert.strictEqual(volatility.toNumber(), 1);
	});
	
});
