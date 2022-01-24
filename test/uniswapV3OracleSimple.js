const { assert } = require("chai");
const { expectEvent } = require("@openzeppelin/test-helpers");
const truffleAssert = require('truffle-assertions');
const { getBigNumber } = require("./utilities");

const
	UniswapV3OracleSimple = artifacts.require("UniswapV3OracleSimple"),
	OneTokenFactory = artifacts.require("OneTokenFactory"),
    MintMasterIncremental = artifacts.require("Incremental"),
    OraclePegged = artifacts.require("ICHIPeggedOracle"),
	MemberToken = artifacts.require("MemberToken"),
	CollateralToken = artifacts.require("CollateralToken"),
	OneToken = artifacts.require("OneTokenV1"),
    ControllerNull = artifacts.require("NullController");

const moduleType = {
	version: 0,
	controller: 1,
	strategy: 2,
	mintMaster: 3,
	oracle: 4,
	voterRoll: 5
}

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000"
const HOUR_PERIOD = 3600
const DAY_PERIOD = 86400
const _5MIN_PERIOD = 300
const POOL_FEE = 10000
const ETH_POOL_FEE = 500

const ONE_USD = getBigNumber(1,18);
const ONE_TOKEN = getBigNumber(1,18);
const ONE_USDT = getBigNumber(1,6);

const uni_v3_factory = '0x1F98431c8aD98523631AE4a59f267346ea31F984'
const fuse = '0x970B9bB2C0444F5E81e9d0eFb84C8ccdcdcAf84d'
const _1inch = '0x111111111117dC0aa78b770fA6A738034120C302'
const gtc = '0xDe30da39c46104798bB5aA3fe8B9e0e1F348163F'
const ichi = '0x903bEF1736CDdf2A537176cf3C64579C3867A881'
const usdc = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const usdt = '0xdac17f958d2ee523a2206206994597c13d831ec7'

let governance,
	badAddress,
	uniswapOracleSimple,
	oneTokenFactory,
	oneToken,
	oneTokenAddress,
    secondOneToken,
    secondOneTokenAddress,
	controller,
	memberToken,
	memberTokenAddress,
	collateralToken,
	tempToken,
	collateralTokenAddress;

contract("UniswapV3OracleSimple", accounts => {
	
	beforeEach(async () => {
		governance = accounts[0];
		badAddress = accounts[1];
		uniswapOracleSimple = await UniswapV3OracleSimple.deployed();
		oneTokenFactory = await OneTokenFactory.deployed();
		oneTokenAddress = await oneTokenFactory.oneTokenAtIndex(0);
        oneToken = await OneToken.at(oneTokenAddress);
        controller = await ControllerNull.deployed();
        mintMaster = await MintMasterIncremental.deployed();
        oracle = await OraclePegged.deployed();
		memberToken = await MemberToken.deployed();
		memberTokenAddress = memberToken.address;
		collateralToken = await CollateralToken.deployed();
		collateralTokenAddress = collateralToken.address;
		tempToken = await CollateralToken.new();

		// deploy second oneToken
		// await oneTokenFactory.admitModule(uniswapOracleSimple.address, moduleType.oracle, "token oracle", "#");
		// await oneTokenFactory.admitForeignToken(oneToken.address, true, uniswapOracleSimple.address);
        const 
            oneTokenName = "Second OneToken Instance",
            symbol = "OTI-2",
            versionName = "OneTokenV1-2",
            url = "#";
        secondOneToken  = await OneToken.new();
        OneToken.setAsDeployed(secondOneToken);
        await oneTokenFactory.admitModule(secondOneToken.address, moduleType.version, versionName, url);
        await oneTokenFactory.deployOneTokenProxy(
            oneTokenName,
            symbol,
            governance,
            secondOneToken.address,
            controller.address,
            mintMaster.address,
            oracle.address,
            memberToken.address,
            collateralToken.address
        )
        secondOneTokenAddress = await oneTokenFactory.oneTokenAtIndex(1);
        secondOneToken = await OneToken.at(secondOneTokenAddress);
	});
	
	it("should be ready to test", async () => {
		assert.isAtLeast(accounts.length, 2, "There are not at least two accounts to work with");
	});
	
	it("should emit event when being deployed", async () => {
		let tempOracle = await UniswapV3OracleSimple.new(oneTokenFactory.address,
			uni_v3_factory, tempToken.address, ETH_POOL_FEE);
							
		expectEvent.inConstruction(tempOracle, 'OracleDeployed', {
			sender: governance,
			description: "ICHI Simple Uniswap V3 Oracle",
			indexToken: tempToken.address
		})
	});
	
	it("should fail to init when initialized from outside", async () => {
		let msg1 = "ICHIModuleCommon: msg.sender is not module owner, token factory or registed module";

		await truffleAssert.reverts(uniswapOracleSimple.init(memberTokenAddress), msg1);
	});

	it("calling update before init should not fail", async () => {
		await uniswapOracleSimple.update(memberTokenAddress);
	});

	it("cannot use the oracle with unregistered tokens", async () => {
		let msg1 = "UniswapV3OracleSimple: unknown token";

		await truffleAssert.reverts(uniswapOracleSimple.read(ichi, ONE_TOKEN), msg1);
		await truffleAssert.reverts(uniswapOracleSimple.consult(ichi, ONE_TOKEN), msg1);
		await truffleAssert.reverts(uniswapOracleSimple.amountRequired(ichi, ONE_USD), msg1);
	});

	it("should check input values during token registration and re-registration", async () => {
		let msg1 = "UniswapV3OracleSimple: token is already registered",
			msg2 = "UniswapV3OracleSimple: token hasn't been registered before",
			msg3 = "UniswapV3OracleSimple: token cannot be null",
			msg4 = "UniswapV3OracleSimple: poolFee must be > 0",
			msg5 = "UniswapV3OracleSimple: unknown ETH/indexToken pair",
			msg6 = "UniswapV3OracleSimple: unknown pair";

		await truffleAssert.reverts(uniswapOracleSimple.registerToken(gtc, false, DAY_PERIOD, POOL_FEE), msg1);
		await truffleAssert.reverts(uniswapOracleSimple.reregisterToken(ichi, false, HOUR_PERIOD, POOL_FEE), msg2);

		await truffleAssert.reverts(uniswapOracleSimple.registerToken(NULL_ADDRESS, false, HOUR_PERIOD, POOL_FEE), msg3);
		await truffleAssert.reverts(uniswapOracleSimple.registerToken(ichi, false, HOUR_PERIOD, 0), msg4);
		await truffleAssert.reverts(uniswapOracleSimple.registerToken(ichi, false, HOUR_PERIOD, POOL_FEE), msg6);

		await truffleAssert.reverts(uniswapOracleSimple.reregisterToken(gtc, false, DAY_PERIOD, 0), msg4);
	});

	it("should fail to initialize if base token isn't registered with the oracle", async () => {
		let msg1 = "UniswapV3OracleSimple: token must be registered with the Oracle before it's iniialized from the Factory";

		await truffleAssert.reverts(oneTokenFactory.assignOracle(fuse, uniswapOracleSimple.address), msg1);

		await uniswapOracleSimple.registerToken(fuse, true, HOUR_PERIOD, POOL_FEE);
		await oneTokenFactory.assignOracle(fuse, uniswapOracleSimple.address);
	});

	it("always initialized when admitted to factory", async () => {
		let tx = await oneTokenFactory.assignOracle(_1inch, uniswapOracleSimple.address);
	
		expectEvent.inTransaction(tx.tx, UniswapV3OracleSimple, 'OracleInitialized', {
			sender: oneTokenFactory.address,
			baseToken: _1inch,
			indexToken: usdc
		})

		await oneTokenFactory.assignOracle(gtc, uniswapOracleSimple.address);
		await oneTokenFactory.assignOracle(usdt, uniswapOracleSimple.address);
	});
	
	it("read should return not 0 (one hop)", async () => {
		const amountOut = await uniswapOracleSimple.read(_1inch, ONE_TOKEN)
		console.log("1INCH in USD = " + (Number(amountOut[0]) / 10 ** 18).toString())
		assert.notEqual(amountOut, 0, "amountOut should be not 0");
	});
	
	it("amountRequired should return not 0 (one hop)", async () => {
		const amountOut = await uniswapOracleSimple.amountRequired(_1inch, ONE_USD)
		console.log("USD in 1INCH = " + (Number(amountOut[0]) / 10 ** 18).toString())
		assert.notEqual(amountOut, 0, "amountOut should be not 0");
	});

	it("read should return not 0 (two hops)", async () => {
		let amountOut = await uniswapOracleSimple.read(gtc, ONE_TOKEN)
		console.log("GTC in USD (with 24h twap) = " + (Number(amountOut[0]) / 10 ** 18).toString())
		assert.notEqual(amountOut, 0, "amountOut should be not 0");

		await uniswapOracleSimple.reregisterToken(gtc, false, DAY_PERIOD * 2, POOL_FEE);
		amountOut = await uniswapOracleSimple.read(gtc, ONE_TOKEN)
		console.log("GTC in USD (with 48h twap) = " + (Number(amountOut[0]) / 10 ** 18).toString())

		await uniswapOracleSimple.reregisterToken(gtc, false, HOUR_PERIOD, POOL_FEE);
		amountOut = await uniswapOracleSimple.read(gtc, ONE_TOKEN)
		console.log("GTC in USD (with 1h twap) = " + (Number(amountOut[0]) / 10 ** 18).toString())

		await uniswapOracleSimple.reregisterToken(gtc, false, 0, POOL_FEE);
		amountOut = await uniswapOracleSimple.read(gtc, ONE_TOKEN)
		console.log("GTC in USD (just spot price) = " + (Number(amountOut[0]) / 10 ** 18).toString())

		await uniswapOracleSimple.reregisterToken(gtc, false, DAY_PERIOD, POOL_FEE);
	});
	
	it("amountRequired should return not 0 (two hops)", async () => {
		let amountOut = await uniswapOracleSimple.amountRequired(gtc, ONE_USD)
		console.log("USD in GTC (with 24h twap) = " + (Number(amountOut[0]) / 10 ** 18).toString())
		assert.notEqual(amountOut, 0, "amountOut should be not 0");

		await uniswapOracleSimple.reregisterToken(gtc, false, DAY_PERIOD * 2, POOL_FEE);
		amountOut = await uniswapOracleSimple.amountRequired(gtc, ONE_USD)
		console.log("USD in GTC (with 48h twap) = " + (Number(amountOut[0]) / 10 ** 18).toString())

		await uniswapOracleSimple.reregisterToken(gtc, false, HOUR_PERIOD, POOL_FEE);
		amountOut = await uniswapOracleSimple.amountRequired(gtc, ONE_USD)
		console.log("USD in GTC (with 1h twap) = " + (Number(amountOut[0]) / 10 ** 18).toString())

		await uniswapOracleSimple.reregisterToken(gtc, false, 0, POOL_FEE);
		amountOut = await uniswapOracleSimple.amountRequired(gtc, ONE_USD)
		console.log("USD in GTC (just spot price) = " + (Number(amountOut[0]) / 10 ** 18).toString())

		await uniswapOracleSimple.reregisterToken(gtc, false, DAY_PERIOD, POOL_FEE);
	});

	it("(6 decimals) read should return not 0 (one hop)", async () => {
		const amountOut = await uniswapOracleSimple.read(usdt, ONE_USDT)
		console.log("USDT in USD = " + (Number(amountOut[0]) / 10 ** 18).toString())
		assert.notEqual(amountOut, 0, "amountOut should be not 0");
	});
	
	it("(6 decimals) amountRequired should return not 0 (one hop)", async () => {
		const amountOut = await uniswapOracleSimple.amountRequired(usdt, ONE_USD)
		console.log("USD in USDT = " + (Number(amountOut[0]) / 10 ** 6).toString())
		assert.notEqual(amountOut, 0, "amountOut should be not 0");
	});

	it("(6 decimals) read should return not 0 (two hops)", async () => {
		await uniswapOracleSimple.reregisterToken(usdt, false, _5MIN_PERIOD, ETH_POOL_FEE);
		const amountOut = await uniswapOracleSimple.read(usdt, ONE_USDT)
		console.log("USDT in USD = " + (Number(amountOut[0]) / 10 ** 18).toString())
		assert.notEqual(amountOut, 0, "amountOut should be not 0");
		await uniswapOracleSimple.reregisterToken(usdt, true, _5MIN_PERIOD, ETH_POOL_FEE);
	});
	
	it("(6 decimals) amountRequired should return not 0 (two hops)", async () => {
		await uniswapOracleSimple.reregisterToken(usdt, false, _5MIN_PERIOD, ETH_POOL_FEE);
		const amountOut = await uniswapOracleSimple.amountRequired(usdt, ONE_USD)
		console.log("USD in USDT = " + (Number(amountOut[0]) / 10 ** 6).toString())
		assert.notEqual(amountOut, 0, "amountOut should be not 0");
		await uniswapOracleSimple.reregisterToken(usdt, true, _5MIN_PERIOD, ETH_POOL_FEE);
	});

	it("valuating very small amounts - read (two hops) - 10**12 when USDC is the indexToken", async () => {
		const amount = getBigNumber(1,12);
		const amountOut = await uniswapOracleSimple.read(gtc, amount)
		assert.notEqual(amountOut, 0, "amountOut should be not 0");
	});
	
	it("valuating very small amounts - amountRequired (two hops) - 10**12 when USDC is the indexToken", async () => {
		const amount = getBigNumber(1,12);
		const amountOut = await uniswapOracleSimple.amountRequired(gtc, amount)
		assert.notEqual(amountOut, 0, "amountOut should be not 0");
	});

	it("valuating very large amounts - read (two hops) - (upper limit is between 10**36 and 10**50)", async () => {
		const msg = "SafeUint128: overflow";

		let amount = getBigNumber(1,50);
		await truffleAssert.reverts(uniswapOracleSimple.read(gtc, amount), msg);

		amount = getBigNumber(1,36);
		const amountOut = await uniswapOracleSimple.read(gtc, amount)

		assert.notEqual(amountOut, 0, "amountOut should be not 0");
	});
	
	it("valuating very large amounts - amountRequired (two hops) - (upper limit is between 10**40 and 10**50)", async () => {
		const msg = "SafeUint128: overflow";

		let amount = getBigNumber(1,50);
		await truffleAssert.reverts(uniswapOracleSimple.amountRequired(gtc, amount), msg);

		amount = getBigNumber(1,40);
		const amountOut = await uniswapOracleSimple.amountRequired(gtc, amount)

		assert.notEqual(amountOut, 0, "amountOut should be not 0");
	});
});
