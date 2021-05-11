const { assert } = require("chai");
const truffleAssert = require('truffle-assertions');
const { expectEvent } = require("@openzeppelin/test-helpers");
const { getBigNumber } = require("./utilities");
const time = require("@openzeppelin/test-helpers/src/time");

const TEST_TIME_PERIOD = 60000

const
	Factory = artifacts.require("OneTokenFactory"),	
	ICHICompositeOracle = artifacts.require("ICHICompositeOracle"),
	Token6 = artifacts.require("Token6"),
	Token9 = artifacts.require("Token9"),
	Token18 = artifacts.require("Token18"),
	UniswapV2Factory = artifacts.require("UniswapV2Factory"),
	UniswapOracleSimple = artifacts.require("UniswapOracleSimple"),
	UniswapV2Pair = artifacts.require("UniswapV2Pair");
		
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
	bob,
	alice, 
	memberToken,
	collateralToken,
	compositeOracle, 
	token_18_Dec,
	uniswapPair_6_18, 
	uniswapPair_9_18, 
	uniswapV2Factory,
	interimOracle_6_18,
	interimOracle_9_18,
	factory;

contract("ICHICompositeOracleDecimals", accounts => {
	
	beforeEach(async () => {
		governance = accounts[0];
		alice = accounts[1];
		bob = accounts[2];

		factory = await Factory.deployed();

    	// this is 18 decimals
		token_18_Dec = await Token18.deployed();
		// this is 6 decimals
		collateralToken = await Token6.deployed();
		// this is 9 decimals
        memberToken = await Token9.deployed();

	});

	async function transferSomeTokensToBob(amount) {
		// transfer some funds to bob to buy one token
		await collateralToken.transfer(bob, getBigNumber(amount,6), { from: governance });
		await memberToken.transfer(bob, getBigNumber(amount,9), { from: governance });
	}

	async function setupCompositeOracle(reserve1, reserve2) {
		uniswapV2Factory = await UniswapV2Factory.new(governance);

		await uniswapV2Factory.createPair(token_18_Dec.address, collateralToken.address);
		uniswapPair_6_18 = await uniswapV2Factory.getPair(token_18_Dec.address, collateralToken.address)
		await token_18_Dec.transfer(uniswapPair_6_18, getBigNumber(reserve1,18))
		await collateralToken.transfer(uniswapPair_6_18, getBigNumber(reserve2,6))
		let uniswapPair = await UniswapV2Pair.at(uniswapPair_6_18);
		await uniswapPair.sync();
		await time.increase(TEST_TIME_PERIOD);
		interimOracle_6_18 = await UniswapOracleSimple.new(factory.address, uniswapV2Factory.address, collateralToken.address, TEST_TIME_PERIOD);
		await interimOracle_6_18.update(token_18_Dec.address)
		await time.increase(TEST_TIME_PERIOD);
		await interimOracle_6_18.update(token_18_Dec.address)
		await factory.admitModule(interimOracle_6_18.address, moduleType.oracle, "interimOracle_6_18", url);

		await uniswapV2Factory.createPair(token_18_Dec.address, memberToken.address);
		uniswapPair_9_18 = await uniswapV2Factory.getPair(token_18_Dec.address, memberToken.address)
		await token_18_Dec.transfer(uniswapPair_9_18, getBigNumber(reserve1,18))
		await memberToken.transfer(uniswapPair_9_18, getBigNumber(reserve2,9))
		uniswapPair = await UniswapV2Pair.at(uniswapPair_9_18);
		await uniswapPair.sync();
		await time.increase(TEST_TIME_PERIOD);
		interimOracle_9_18 = await UniswapOracleSimple.new(factory.address, uniswapV2Factory.address, token_18_Dec.address, TEST_TIME_PERIOD);
		await interimOracle_9_18.update(memberToken.address)
		await time.increase(TEST_TIME_PERIOD);
		await interimOracle_9_18.update(memberToken.address)
		await factory.admitModule(interimOracle_9_18.address, moduleType.oracle, "interimOracle_9_18", url);

		compositeOracle = await ICHICompositeOracle.new(factory.address, "ICHICompositeOracle", memberToken.address, [memberToken.address, token_18_Dec.address], [interimOracle_9_18.address, interimOracle_6_18.address]);
		assert.isNotNull(compositeOracle.address, "ICHICompositeOracle should be constructed");

		expectEvent.inConstruction(compositeOracle, 'OracleDeployed', {
			sender: governance,
			description: "ICHICompositeOracle",
			indexToken: memberToken.address
		})

		await factory.admitModule(compositeOracle.address, moduleType.oracle, "composite oracle", "#");
		let tx = await factory.admitForeignToken(memberToken.address, true, compositeOracle.address);

		// test event from ICHICompositeOracle
		expectEvent.inTransaction(tx.tx, ICHICompositeOracle, 'OracleInitialized', {
			sender: compositeOracle.address,
			baseToken: memberToken.address,
			indexToken: token_18_Dec.address
		})

	}
	
	it("should be able to update", async () => {
		await setupCompositeOracle(100,100);

		const updateTx = await compositeOracle.update(collateralToken.address);
		assert.isNotNull(updateTx.transactionHash, "ICHICompositeOracle should be able to update interim oracle");
	});

	it("should be configured", async () => {
		const oracleCount = await compositeOracle.oracleCount();
		assert.equal(oracleCount.toString(10), "2", "ICHICompositeOracle.oracleCount() should return proper count");
	})

	it("read should return proper value", async () => {
		//let readRes = await compositeOracle.read(memberToken.address, getBigNumber(1,9).toString());
		//console.log("quote from compositeOracle oracle = "+readRes[0].toString());

		// passing 1 memberToken, expecting 10 ** 18 back. But have to account for rounding after 6 decimals
		const value = getBigNumber(1,18).toString();
		const { amountUsd, volatility } = await compositeOracle.read(memberToken.address, getBigNumber(1,9).toString());

		assert.isTrue(Number(amountUsd) == Number(value) + 10**12 || 
			Number(amountUsd) + 10**12 == Number(value) ||
			Number(amountUsd) == Number(value) )

		assert.equal(volatility.toString(10), 1, "ICHICompositeOracle.read() should return proper volatility");
	})
	
	it("amountRequired should return proper value", async () => {
		// passing 10 ** 18, expecting 1 memberToken back. But have to account for rounding after 6 decimals
		const value = getBigNumber(1,18).toString();
		const { amountTokens, volatility } = await compositeOracle.amountRequired(memberToken.address, value);

		const expectedValue = getBigNumber(1,9).toString();
		assert.isTrue(Number(amountTokens) == Number(expectedValue) + 10**3 || 
			Number(amountTokens) + 10**3 == Number(expectedValue) ||
			Number(amountTokens) == Number(expectedValue) )

		assert.equal(volatility.toString(10), 1, "ICHICompositeOracle.amountRequired() should return proper volatility");
	});

	it("should update ratios in interim oracles", async () => {
		let reserveIncreaseAmount = 100;

		// new ratios: memberToken:token_18_Dec - 2:1
		// new ratios: collateralToken:token_18_Dec - 1:2
		// so memberToken:collateralToken should be 4:1

		await memberToken.transfer(uniswapPair_9_18, getBigNumber(reserveIncreaseAmount,9))
		await time.increase(TEST_TIME_PERIOD);
		let uniswapPair = await UniswapV2Pair.at(uniswapPair_9_18);
		await uniswapPair.sync();
		await interimOracle_9_18.update(memberToken.address)
		// calling update the second time after sync and appropriate time period, so we get two clean points
		await time.increase(TEST_TIME_PERIOD);
		await interimOracle_9_18.update(memberToken.address)

		await token_18_Dec.transfer(uniswapPair_6_18, getBigNumber(reserveIncreaseAmount,18))
		await time.increase(TEST_TIME_PERIOD);
		uniswapPair = await UniswapV2Pair.at(uniswapPair_6_18);
		await uniswapPair.sync();
		await interimOracle_6_18.update(token_18_Dec.address)
		// calling update the second time after sync and appropriate time period, so we get two clean points
		await time.increase(TEST_TIME_PERIOD);
		await interimOracle_6_18.update(token_18_Dec.address)
	})

	it("read should return proper value with new LP ratios", async () => {
		//let readRes = await compositeOracle.read(memberToken.address, getBigNumber(1,9).toString());
		//console.log("quote from compositeOracle oracle = "+readRes[0].toString());

		// passing 1 memberToken, expecting 0.25 * 10 ** 18 back. But have to account for rounding after 6 decimals
		const value = getBigNumber(25,16).toString();
		const { amountUsd, volatility } = await compositeOracle.read(memberToken.address, getBigNumber(1,9).toString());

		assert.isTrue(Number(amountUsd) == Number(value) + 10**12 || 
			Number(amountUsd) + 10**12 == Number(value) ||
			Number(amountUsd) == Number(value) )

		assert.equal(volatility.toString(10), 1, "ICHICompositeOracle.read() should return proper volatility");
	})
	
	it("amountRequired should return proper value with new LP ratios", async () => {
		// passing 10 ** 18, expecting 4 memberToken back. But have to account for rounding after 6 decimals
		const value = getBigNumber(1,18).toString();
		const { amountTokens, volatility } = await compositeOracle.amountRequired(memberToken.address, value);

		//console.log(amountTokens.toString());
		const expectedValue = getBigNumber(4,9).toString();
		if (Number(amountTokens) >= Number(expectedValue)) {
			assert.isTrue(Number(amountTokens) - Number(expectedValue) <= 10**5 || 
				Number(amountTokens) == Number(expectedValue) )
		} else {
			assert.isTrue(Number(expectedValue) - Number(amountTokens) <= 10**5)
		}

		assert.equal(volatility.toString(10), 1, "ICHICompositeOracle.amountRequired() should return proper volatility");
	});


	
});
