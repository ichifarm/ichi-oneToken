const { assert } = require("chai");
const time = require("@openzeppelin/test-helpers/src/time");
const { expectEvent } = require("@openzeppelin/test-helpers");

const
	UniswapOracleSimple = artifacts.require("UniswapOracleSimple"),
	UniswapV2Factory = artifacts.require("UniswapV2Factory"),
	OneTokenFactory = artifacts.require("OneTokenFactory"),
	MemberToken = artifacts.require("MemberToken"),
	CollateralToken = artifacts.require("CollateralToken"),
	UniswapV2Pair = artifacts.require("UniswapV2Pair")

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000"
const TEST_TIME_PERIOD = 60000

let governance,
	badAddress,
	uniswapV2Factory,
	uniswapOracleSimple,
	oneTokenFactory,
	oneTokenAddress,
	uniswapPairAddress,
	memberToken,
	memberTokenAddress,
	collateralToken,
	collateralTokenAddress

contract("UniswapOracleSimple", accounts => {
	
	beforeEach(async () => {
		governance = accounts[0];
		badAddress = accounts[1];
		uniswapV2Factory = await UniswapV2Factory.deployed();
		uniswapOracleSimple = await UniswapOracleSimple.deployed();
		oneTokenFactory = await OneTokenFactory.deployed();
		oneTokenAddress = await oneTokenFactory.oneTokenAtIndex(0);
		memberToken = await MemberToken.deployed();
		memberTokenAddress = memberToken.address;
		collateralToken = await CollateralToken.deployed();
		collateralTokenAddress = collateralToken.address;
		
	});
	
	it("should be ready to test", async () => {
		assert.isAtLeast(accounts.length, 2, "There are not at least two accounts to work with");
	});
	
	it("should know the oneTokenFactory", async () => {
		assert.notEqual(oneTokenFactory.address, NULL_ADDRESS, "oneTokenFactory adress must be not null");
	});
	
	it("should know the uniswapV2Factory", async () => {
		assert.notEqual(uniswapV2Factory.address, NULL_ADDRESS, "uniswapV2Factory adress must be not null");
	});
	
	
	it("should know the uniswapOracleSimple", async () => {
		assert.notEqual(uniswapOracleSimple.address, NULL_ADDRESS, "uniswapOracleSimple adress must be not null");
	});
	
	it("should create the pair uniswapV2Factory", async () => {
		await uniswapV2Factory.createPair(memberTokenAddress, collateralTokenAddress)
		uniswapPairAddress = await uniswapV2Factory.getPair(memberTokenAddress, collateralTokenAddress)
		assert.isDefined(uniswapPairAddress, "uniswapOracleSimple adress must be not null");
		assert.notEqual(uniswapPairAddress, NULL_ADDRESS, "uniswapOracleSimple adress must be not null");
	});
	
	it("should sync the pair after mint", async () => {
		let reserve0 = 20E8;
		memberToken.transfer(uniswapPairAddress, reserve0)
		let reserve1 = 10E8;
		collateralToken.transfer(uniswapPairAddress, reserve1)
		const uniswapPair = await UniswapV2Pair.at(uniswapPairAddress);
		const syncTx = await uniswapPair.sync()
		// may be reordered
		try {
			expectEvent(syncTx, 'Sync', { reserve0: reserve0.toString(), reserve1: reserve1.toString() })
		} catch (e) {
			expectEvent(syncTx, 'Sync', { reserve1: reserve0.toString(), reserve0: reserve1.toString() })
		}
	});
	
	it("should init with the pair in uniswapV2Factory", async () => {
		const res = await uniswapOracleSimple.init(collateralTokenAddress)
		assert.isNotEmpty(res.logs, "Should have Initialized event");
		assert.equal(res.logs[0].event, 'Initialized', "Should have Initialized event");
	});
	
	
	it("first call for consult should return 0", async () => {
		const amountOut = await uniswapOracleSimple.consult(collateralTokenAddress, 1)
		assert.equal(amountOut, 0, "uniswapOracleSimple first call for consult should return 0");
	});
	
	it("consult should return not 0 after update", async () => {
		const amountOut = await uniswapOracleSimple.consult(collateralTokenAddress, 1)
		assert.equal(amountOut, 0, "uniswapOracleSimple first call for consult should return 0");
		await time.increase(TEST_TIME_PERIOD)
		const amountOutAfterPeriod = await uniswapOracleSimple.consult(collateralTokenAddress, 1)
		assert.equal(amountOutAfterPeriod, 0, "amountOutAfterPeriod should return 0 without update in between");
		
		const uniswapPair = await UniswapV2Pair.at(uniswapPairAddress);
		await uniswapPair.sync()
		await uniswapOracleSimple.update(collateralTokenAddress)
		
		const amountOutAfterUpdate = await uniswapOracleSimple.consult(collateralTokenAddress, 10000)
		assert.notEqual(amountOutAfterUpdate, 0, "amountOutAfterUpdate should be not 0");
	});
	
	it("read should return not 0", async () => {
		const amountOut = await uniswapOracleSimple.read(collateralTokenAddress, 1)
		assert.notEqual(amountOut, 0, "amountOutAfterUpdate should be not 0");
	});
	
	it("amountRequired should return not 0", async () => {
		const amountOut = await uniswapOracleSimple.amountRequired(collateralTokenAddress, 1)
		assert.notEqual(amountOut, 0, "amountOutAfterUpdate should be not 0");
	});
	
	it("should return pair info", async () => {
		const info = await uniswapOracleSimple.pairInfo(collateralTokenAddress)
		try {
			assert.equal(info.token0, collateralTokenAddress);
			assert.equal(info.token1, memberTokenAddress);
		} catch (e) {
			// check vice versa
			assert.equal(info.token1, collateralTokenAddress);
			assert.equal(info.token0, memberTokenAddress);
		}
	})
	
});
