const { assert } = require("chai");
const time = require("@openzeppelin/test-helpers/src/time");
const { expectEvent } = require("@openzeppelin/test-helpers");
const truffleAssert = require('truffle-assertions');

const
	UniswapOracleSimple = artifacts.require("UniswapOracleSimple"),
	UniswapV2Factory = artifacts.require("UniswapV2Factory"),
	OneTokenFactory = artifacts.require("OneTokenFactory"),
    MintMasterIncremental = artifacts.require("Incremental"),
    OraclePegged = artifacts.require("ICHIPeggedOracle"),
	MemberToken = artifacts.require("MemberToken"),
	CollateralToken = artifacts.require("CollateralToken"),
	UniswapV2Pair = artifacts.require("UniswapV2Pair"),
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
const TEST_TIME_PERIOD = 60000

let governance,
	badAddress,
	uniswapV2Factory,
	uniswapOracleSimple,
	oneTokenFactory,
	oneToken,
	oneTokenAddress,
    secondOneToken,
    secondOneTokenAddress,
	uniswapPairAddress,
	controller,
	memberToken,
	memberTokenAddress,
	collateralToken,
	tempToken,
	collateralTokenAddress;

contract("UniswapOracleSimple", accounts => {
	
	beforeEach(async () => {
		governance = accounts[0];
		badAddress = accounts[1];
		uniswapV2Factory = await UniswapV2Factory.deployed();
		uniswapOracleSimple = await UniswapOracleSimple.deployed();
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
		let tempOracle = await UniswapOracleSimple.new(oneTokenFactory.address,
							uniswapV2Factory.address, tempToken.address, TEST_TIME_PERIOD);
							
		expectEvent.inConstruction(tempOracle, 'OracleDeployed', {
			sender: governance,
			description: "ICHI Simple Uniswap Oracle",
			indexToken: tempToken.address
		})
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
	
	it("should fail to init when initialized from outside", async () => {
		let msg1 = "ICHIModuleCommon: msg.sender is not module owner, token factory or registed module";

		await truffleAssert.reverts(uniswapOracleSimple.init(memberTokenAddress), msg1);
	});

	it("should fail to init when the pair has no liquidity", async () => {
		let msg1 = "UniswapOracleSimple: NO_RESERVES";

		await oneTokenFactory.admitModule(uniswapOracleSimple.address, moduleType.oracle, "token oracle", "#");
		await truffleAssert.reverts(oneTokenFactory.admitForeignToken(memberTokenAddress, false, uniswapOracleSimple.address), msg1);
	});

	it("should sync the pair after mint", async () => {
		let reserve0 = 10E8;
		await memberToken.transfer(uniswapPairAddress, reserve0)
		let reserve1 = 20E8;
		await collateralToken.transfer(uniswapPairAddress, reserve1)
		const uniswapPair = await UniswapV2Pair.at(uniswapPairAddress);
		const syncTx = await uniswapPair.sync()
		// may be reordered
		try {
			expectEvent(syncTx, 'Sync', { reserve0: reserve0.toString(), reserve1: reserve1.toString() })
		} catch (e) {
			expectEvent(syncTx, 'Sync', { reserve1: reserve0.toString(), reserve0: reserve1.toString() })
		}
	});
	
	it("calling update before init should not fail, but it also shouldn't do anything", async () => {
		await uniswapOracleSimple.update(memberTokenAddress);

		let info = await uniswapOracleSimple.pairInfo(memberTokenAddress)
		assert.equal(info.token0, NULL_ADDRESS);
		assert.equal(info.token1, NULL_ADDRESS);
		assert.equal(info.price0CumulativeLast, 0);
		assert.equal(info.price1CumulativeLast, 0);
		assert.equal(info.price0Average, 0);
		assert.equal(info.price1Average, 0);
	});

	it("always initialized when admitted to factory", async () => {
		let tx = await oneTokenFactory.assignOracle(memberTokenAddress, uniswapOracleSimple.address);
	
		// test event from ICHIPeggedOracle
		expectEvent.inTransaction(tx.tx, UniswapOracleSimple, 'OracleInitialized', {
			sender: oneTokenFactory.address,
			baseToken: memberTokenAddress,
			indexToken: collateralTokenAddress
		})
	});

	it("first call for consult should revert", async () => {
		let msg1 = "UniswapOracleSimple: Gathering history. Try again later",
			msg2 = "UniswapOracleSimple: INVALID_TOKEN";
		await truffleAssert.reverts(uniswapOracleSimple.consult(memberTokenAddress, 1), msg1);
		await truffleAssert.reverts(uniswapOracleSimple.consult(badAddress, 1), msg2);
	});
	
	it("first call for amountRequired should revert", async () => {
		let msg1 = "UniswapOracleSimple: Gathering history. Try again later",
			msg2 = "UniswapOracleSimple: INVALID_TOKEN";
		await truffleAssert.reverts(uniswapOracleSimple.amountRequired(memberTokenAddress, 1), msg1);
		await truffleAssert.reverts(uniswapOracleSimple.amountRequired(badAddress, 1), msg2);
	});
	
	it("consult should return not 0 after update", async () => {
		await truffleAssert.reverts(uniswapOracleSimple.consult(memberTokenAddress, 1), "UniswapOracleSimple: Gathering history. Try again later");
		await time.increase(TEST_TIME_PERIOD)

		await truffleAssert.reverts(uniswapOracleSimple.consult(memberTokenAddress, 1), "UniswapOracleSimple: Gathering history. Try again later");
		
		const uniswapPair = await UniswapV2Pair.at(uniswapPairAddress);
		await uniswapPair.sync()

		await uniswapOracleSimple.update(memberTokenAddress)
		await time.increase(TEST_TIME_PERIOD)
		await uniswapOracleSimple.update(memberTokenAddress) // second quick call to test time period branch
		
		const amountOutAfterUpdate = await uniswapOracleSimple.consult(memberTokenAddress, 10000)
		assert.notEqual(amountOutAfterUpdate, 0, "amountOutAfterUpdate should be not 0");
		assert.equal(amountOutAfterUpdate, 10000*2, "amountOutAfterUpdate should be 2x of the amount");
	});
	
	it("read should return not 0", async () => {
		const amountOut = await uniswapOracleSimple.read(memberTokenAddress, 1)
		assert.notEqual(amountOut, 0, "amountOutAfterUpdate should be not 0");
	});
	
	it("amountRequired should return not 0", async () => {
		const amountOut = await uniswapOracleSimple.amountRequired(memberTokenAddress, 1)
		assert.notEqual(amountOut, 0, "amountOutAfterUpdate should be not 0");
	});
	
	it("should return pair info", async () => {
		let info = await uniswapOracleSimple.pairInfo(memberTokenAddress)
		let old_price0CumulativeLast = info.price0CumulativeLast;
		let old_price1CumulativeLast = info.price1CumulativeLast;
		try {
			assert.equal(info.token0, collateralTokenAddress);
			assert.equal(info.token1, memberTokenAddress);
		} catch (e) {
			// check vice versa
			assert.equal(info.token1, collateralTokenAddress);
			assert.equal(info.token0, memberTokenAddress);
		}

		await uniswapOracleSimple.update(memberTokenAddress)
		info = await uniswapOracleSimple.pairInfo(memberTokenAddress)
		let new_price0CumulativeLast = info.price0CumulativeLast;
		let new_price1CumulativeLast = info.price1CumulativeLast;
		// no time passed, values should remain the same
		assert.equal(new_price0CumulativeLast.toString(10), old_price0CumulativeLast.toString(10));
		assert.equal(new_price1CumulativeLast.toString(10), old_price1CumulativeLast.toString(10));

		await time.increase(TEST_TIME_PERIOD)
		await uniswapOracleSimple.update(memberTokenAddress)
		info = await uniswapOracleSimple.pairInfo(memberTokenAddress)
		new_price0CumulativeLast = info.price0CumulativeLast;
		new_price1CumulativeLast = info.price1CumulativeLast;
		// now values should change
		assert.notEqual(new_price0CumulativeLast.toString(10), old_price0CumulativeLast.toString(10));
		assert.notEqual(new_price1CumulativeLast.toString(10), old_price1CumulativeLast.toString(10));
	})
	
	it("should fail to create UNI oracle with bad input parameters", async () => {
		let msg1 = "UniswapOracleSimple: uniswapFactory cannot be empty",
			msg2 = "ICHIModuleCommon: oneTokenFactory cannot be empty",
			msg3 = "OracleCommon: indexToken cannot be empty",
			msg4 = "UniswapOracleSimple: period must be > 0";

		await truffleAssert.reverts(UniswapOracleSimple.new(oneTokenFactory.address, NULL_ADDRESS, memberToken.address, TEST_TIME_PERIOD), msg1);
        await truffleAssert.reverts(UniswapOracleSimple.new(NULL_ADDRESS, uniswapV2Factory.address, memberToken.address, TEST_TIME_PERIOD), msg2);
        await truffleAssert.reverts(UniswapOracleSimple.new(oneTokenFactory.address, uniswapV2Factory.address, NULL_ADDRESS, TEST_TIME_PERIOD), msg3);
        await truffleAssert.reverts(UniswapOracleSimple.new(oneTokenFactory.address, uniswapV2Factory.address, memberToken.address, 0), msg4);
	});

	it("multiple oneToken implementations can share an Oracle", async () => {
		
        let newOracle = await OraclePegged.new(oneTokenFactory.address, "new oracle", collateralToken.address);
        OraclePegged.setAsDeployed(newOracle);
		await oneTokenFactory.admitModule(newOracle.address, moduleType.oracle, "new oracle", "#");

		await oneTokenFactory.assignOracle(oneToken.address, newOracle.address);
		let mintMansterAddress = await oneToken.mintMaster();
        let mintMaster = await MintMasterIncremental.at(mintMansterAddress);
        tx = await mintMaster.changeOracle(oneToken.address, newOracle.address, { from: governance });
        expectEvent(tx, 'OneTokenOracleChanged', {
			sender: governance,
            oneToken: oneToken.address,
            oracle: newOracle.address
		})

		await oneTokenFactory.assignOracle(secondOneToken.address, newOracle.address);
		mintMansterAddress = await secondOneToken.mintMaster();
        mintMaster = await MintMasterIncremental.at(mintMansterAddress);
        tx = await mintMaster.changeOracle(secondOneToken.address, newOracle.address, { from: governance });
        expectEvent(tx, 'OneTokenOracleChanged', {
			sender: governance,
            oneToken: secondOneToken.address,
            oracle: newOracle.address
		})
	});

	it("should be able to switch from Pegged oracle to UniswapOracleSimple", async () => {
		// minting some oneTokens
		await memberToken.approve(oneToken.address, 10000);
        await collateralToken.approve(oneToken.address, 10000);
        await oneToken.mint(collateralToken.address, 1000);
		
		// setting up oneToken-collateralToken pair
		await uniswapV2Factory.createPair(oneTokenAddress, collateralTokenAddress)
		let newPairAddress = await uniswapV2Factory.getPair(oneTokenAddress, collateralTokenAddress)
		let reserve0 = 800;
		await oneToken.transfer(newPairAddress, reserve0)
		let reserve1 = 400;
		await collateralToken.transfer(newPairAddress, reserve1)
		let uniswapPair = await UniswapV2Pair.at(newPairAddress);
		await uniswapPair.sync()

		// switching the oracle to UNI
		await oneTokenFactory.assignOracle(oneToken.address, uniswapOracleSimple.address);
		let mintMansterAddress = await oneToken.mintMaster();
        let mintMaster = await MintMasterIncremental.at(mintMansterAddress);
        tx = await mintMaster.changeOracle(oneToken.address, uniswapOracleSimple.address, { from: governance });
        expectEvent(tx, 'OneTokenOracleChanged', {
			sender: governance,
            oneToken: oneToken.address,
            oracle: uniswapOracleSimple.address
		})

		// now do the same for secondOneToken
		// minting some secondOneTokens
		await memberToken.approve(secondOneToken.address, 10000);
        await collateralToken.approve(secondOneToken.address, 10000);
        await secondOneToken.mint(collateralToken.address, 1000);
		
		// setting up oneToken-collateralToken pair
		await uniswapV2Factory.createPair(secondOneTokenAddress, collateralTokenAddress)
		newPairAddress = await uniswapV2Factory.getPair(secondOneTokenAddress, collateralTokenAddress)
		reserve0 = 400;
		await secondOneToken.transfer(newPairAddress, reserve0)
		reserve1 = 800;
		await collateralToken.transfer(newPairAddress, reserve1)
		uniswapPair = await UniswapV2Pair.at(newPairAddress);
		await uniswapPair.sync()

		// switching the oracle to UNI
		await oneTokenFactory.assignOracle(secondOneToken.address, uniswapOracleSimple.address);
		mintMansterAddress = await secondOneToken.mintMaster();
        mintMaster = await MintMasterIncremental.at(mintMansterAddress);
        tx = await mintMaster.changeOracle(secondOneToken.address, uniswapOracleSimple.address, { from: governance });
        expectEvent(tx, 'OneTokenOracleChanged', {
			sender: governance,
            oneToken: secondOneToken.address,
            oracle: uniswapOracleSimple.address
		})

	});

	it("one oracle can manage multiple currency quotes", async () => {
		await time.increase(TEST_TIME_PERIOD)
		await uniswapOracleSimple.update(oneToken.address)
		await uniswapOracleSimple.update(secondOneToken.address)
		await time.increase(TEST_TIME_PERIOD)

		let amountOut = await uniswapOracleSimple.read(oneToken.address, 100)
		assert.equal(amountOut[0].toString(10), "50");

		amountOut = await uniswapOracleSimple.read(oneToken.address, 50)
		assert.equal(amountOut[0].toString(10), "25");
	});

	it("shared oracle handling N currency pairs", async () => {
		await time.increase(TEST_TIME_PERIOD)
		await uniswapOracleSimple.update(oneToken.address)
		await uniswapOracleSimple.update(secondOneToken.address)
		await time.increase(TEST_TIME_PERIOD)

		let amountOut = await uniswapOracleSimple.read(oneToken.address, 100)
		assert.equal(amountOut[0].toString(10), "50");

		amountOut = await uniswapOracleSimple.read(secondOneToken.address, 100)
		assert.equal(amountOut[0].toString(10), "200");
	});

	it("always updated when selected by oneToken for any foreign token in the vault", async () => {
		let newCollateralToken = await CollateralToken.new();

		// setting up oneToken-collateralToken pair
		await uniswapV2Factory.createPair(newCollateralToken.address, collateralTokenAddress)
		let newPairAddress = await uniswapV2Factory.getPair(newCollateralToken.address, collateralTokenAddress)
		let reserve0 = 500;
		await newCollateralToken.transfer(newPairAddress, reserve0)
		let reserve1 = 500;
		await collateralToken.transfer(newPairAddress, reserve1)
		let uniswapPair = await UniswapV2Pair.at(newPairAddress);
		await uniswapPair.sync()

		await time.increase(TEST_TIME_PERIOD)
		// update wasn't called so should be failing
		await truffleAssert.reverts(uniswapOracleSimple.read(newCollateralToken.address, 100), "UniswapOracleSimple: INVALID_TOKEN");

		await oneTokenFactory.admitForeignToken(newCollateralToken.address, true, uniswapOracleSimple.address)
		
		amountOut = await uniswapOracleSimple.read(newCollateralToken.address, 100)
		// now it works because update was called via admitForeignToken
		assert.equal(amountOut[0].toString(10), "100");

		await time.increase(TEST_TIME_PERIOD)

		await oneToken.addAsset(newCollateralToken.address, uniswapOracleSimple.address)
		amountOut = await uniswapOracleSimple.read(newCollateralToken.address, 100)
		// continues working after another update from addAsset
		assert.equal(amountOut[0].toString(10), "100");
	});

	it("could deploy and admit multiple instances", async () => {
		let oracleCount_1 = await oneTokenFactory.foreignTokenOracleCount(collateralToken.address);

		let tempOracle = await UniswapOracleSimple.new(oneTokenFactory.address,
			uniswapV2Factory.address, oneToken.address, 100);
		await oneTokenFactory.admitModule(tempOracle.address, moduleType.oracle, "new oracle", "#");
		await oneTokenFactory.assignOracle(collateralToken.address, tempOracle.address);

		tempOracle = await UniswapOracleSimple.new(oneTokenFactory.address,
			uniswapV2Factory.address, oneToken.address, 200);
		await oneTokenFactory.admitModule(tempOracle.address, moduleType.oracle, "new oracle", "#");
		await oneTokenFactory.assignOracle(collateralToken.address, tempOracle.address);

		let oracleCount_2 = await oneTokenFactory.foreignTokenOracleCount(collateralToken.address);
		assert.equal(parseInt(oracleCount_2.toString()) - parseInt(oracleCount_1.toString()), 2);

	});

	


});
