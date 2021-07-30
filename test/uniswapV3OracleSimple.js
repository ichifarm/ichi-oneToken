const { assert } = require("chai");
const { expectEvent } = require("@openzeppelin/test-helpers");
const truffleAssert = require('truffle-assertions');

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
const POOL_FEE = 10000
const ETH_POOL_FEE = 500

const uni_v3_factory = '0x1F98431c8aD98523631AE4a59f267346ea31F984'
const fuse = '0x970B9bB2C0444F5E81e9d0eFb84C8ccdcdcAf84d'
const _1inch = '0x111111111117dC0aa78b770fA6A738034120C302'
const gtc = '0xDe30da39c46104798bB5aA3fe8B9e0e1F348163F'
const usdc = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

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

/*	it("should fail to init when the pair has no liquidity", async () => {
		let msg1 = "UniswapOracleSimple: NO_RESERVES";

		await oneTokenFactory.admitModule(uniswapOracleSimple.address, moduleType.oracle, "token oracle", "#");
		//await truffleAssert.reverts(oneTokenFactory.admitForeignToken(memberTokenAddress, false, uniswapOracleSimple.address), msg1);
	}); */

	it("calling update before init should not fail", async () => {
		await uniswapOracleSimple.update(memberTokenAddress);
	});

	it("always initialized when admitted to factory", async () => {
		let tx = await oneTokenFactory.assignOracle(fuse, uniswapOracleSimple.address);
	
		expectEvent.inTransaction(tx.tx, UniswapV3OracleSimple, 'OracleInitialized', {
			sender: oneTokenFactory.address,
			baseToken: fuse,
			indexToken: usdc
		})

		await oneTokenFactory.assignOracle(_1inch, uniswapOracleSimple.address);
		await oneTokenFactory.assignOracle(gtc, uniswapOracleSimple.address);
	});
	
	it("read should return not 0 (one hop)", async () => {
		const amountOut = await uniswapOracleSimple.read(_1inch, "1000000000000000000")
		console.log("1INCH in USD = " + (Number(amountOut[0]) / 10 ** 18).toString())
		assert.notEqual(amountOut, 0, "amountOutAfterUpdate should be not 0");
	});
	
	it("amountRequired should return not 0 (one hop)", async () => {
		const amountOut = await uniswapOracleSimple.amountRequired(_1inch, "1000000000000000000")
		console.log("USD in 1INCH = " + (Number(amountOut[0]) / 10 ** 18).toString())
		assert.notEqual(amountOut, 0, "amountOutAfterUpdate should be not 0");
	});

	it("read should return not 0 (two hops)", async () => {
		const amountOut = await uniswapOracleSimple.read(gtc, "1000000000000000000")
		console.log("GTC in USD = " + (Number(amountOut[0]) / 10 ** 18).toString())
		assert.notEqual(amountOut, 0, "amountOutAfterUpdate should be not 0");
	});
	
	it("amountRequired should return not 0 (two hops)", async () => {
		const amountOut = await uniswapOracleSimple.amountRequired(gtc, "1000000000000000000")
		console.log("USD in GTC = " + (Number(amountOut[0]) / 10 ** 18).toString())
		assert.notEqual(amountOut, 0, "amountOutAfterUpdate should be not 0");
	});
	/*
	it("should fail to create UNI oracle with bad input parameters", async () => {
		let msg1 = "UniswapOracleSimple: uniswapFactory cannot be empty",
			msg2 = "ICHIModuleCommon: oneTokenFactory cannot be empty",
			msg3 = "OracleCommon: indexToken cannot be empty",
			msg4 = "UniswapOracleSimple: period must be > 0";

		await truffleAssert.reverts(UniswapOracleSimple.new(oneTokenFactory.address, NULL_ADDRESS, memberToken.address, TEST_TIME_PERIOD), msg1);
        await truffleAssert.reverts(UniswapOracleSimple.new(NULL_ADDRESS, uniswapV2Factory.address, memberToken.address, TEST_TIME_PERIOD), msg2);
        await truffleAssert.reverts(UniswapOracleSimple.new(oneTokenFactory.address, uniswapV2Factory.address, NULL_ADDRESS, TEST_TIME_PERIOD), msg3);
        await truffleAssert.reverts(UniswapOracleSimple.new(oneTokenFactory.address, uniswapV2Factory.address, memberToken.address, 0), msg4);
	});*/

/*	it("one oracle can manage multiple currency quotes", async () => {
		await time.increase(TEST_TIME_PERIOD)
		await uniswapOracleSimple.update(oneToken.address)
		await uniswapOracleSimple.update(secondOneToken.address)
		await time.increase(TEST_TIME_PERIOD)

		let amountOut = await uniswapOracleSimple.read(oneToken.address, 100)
		assert.equal(amountOut[0].toString(10), "50");

		amountOut = await uniswapOracleSimple.read(oneToken.address, 50)
		assert.equal(amountOut[0].toString(10), "25");
	});*/


});
