const { assert } = require("chai");
const { expectEvent } = require("@openzeppelin/test-helpers");
const { getBigNumber } = require("./utilities");
const time = require("@openzeppelin/test-helpers/src/time");
const { BigNumber } = require("ethers");

const OneTokenFactory = artifacts.require("OneTokenFactory");
const OneToken = artifacts.require("OneTokenV1");
const Token6 = artifacts.require("Token6");
const Token9 = artifacts.require("Token9");
const IncrementalMintMaster = artifacts.require("Incremental");
const ICHIPeggedOracle = artifacts.require("ICHIPeggedOracle");
const UniswapOracleSimple = artifacts.require("UniswapOracleSimple");
const UniswapV2Factory = artifacts.require("UniswapV2Factory");
const ArbitraryStrategy = artifacts.require("Arbitrary");
const UniswapV2Pair = artifacts.require("UniswapV2Pair")
const NullController = artifacts.require("NullController");

const TEST_TIME_PERIOD = 60000

const
	PRECISION = getBigNumber(1,18),  // 10 ** 18
	RATIO_50 = "500000000000000000", // 50%
	RATIO_95 = "950000000000000000", // 95%
	RATIO_90 = "900000000000000000", // 90%
	RATIO_75 = "750000000000000000", // 75%
	STEP_002 =   "2000000000000000"  // 0.2%

const url = "#"

const moduleType = {
	version: 0,
	controller: 1,
	strategy: 2,
	mintMaster: 3,
	oracle: 4,
	voterRoll: 5
}

let
	governance,
	alice,
	bob,
	oneTokenFactory,
	memberToken,
	collateralToken,
	version,
	incrementalMintMaster,
	memberTokenArbitraryStrategy,
	collateralTokenArbitraryStrategy,
	memberTokenOracle,
	collateralTokenOracle,
	nullController,
	oneTokenOracle,
	uniswapV2Factory,
	memberTokenUsdtUniswapPair,
	oneToken,
	oneTokenProxy
;

contract("Integration tests with 6/9 decimals", accounts => {
	
	beforeEach(async () => {
		governance = accounts[0];
		alice = accounts[1];
		bob = accounts[2];
		
		collateralToken = await Token6.deployed();
        memberToken = await Token9.deployed();

		oneTokenFactory = await OneTokenFactory.new();
		version = await OneToken.new();
		nullController = await NullController.new(oneTokenFactory.address);
		expectEvent.inConstruction(nullController, 'ControllerDeployed', {
			sender: governance,
			oneTokenFactory: oneTokenFactory.address,
			description: "Null Controller"
		})
		
		incrementalMintMaster = await IncrementalMintMaster.new(oneTokenFactory.address, "IncrementalMintMaster");
		oneTokenOracle = await ICHIPeggedOracle.new(oneTokenFactory.address, "oneTokenOracle", collateralToken.address);
		
		await oneTokenFactory.admitModule(version.address, moduleType.version, "versionName", url);
		await oneTokenFactory.admitModule(nullController.address, moduleType.controller, "controllerName", url);
		await oneTokenFactory.admitModule(incrementalMintMaster.address, moduleType.mintMaster, "mintMasterName", url);
		await oneTokenFactory.admitModule(oneTokenOracle.address, moduleType.oracle, "oracleName", url);
		
		collateralTokenOracle = await ICHIPeggedOracle.new(oneTokenFactory.address, "collateralTokenOracle", collateralToken.address);
		
		// build UniswapOracleSimple
		memberTokenOracle = await ICHIPeggedOracle.new(oneTokenFactory.address, "memberTokenOracle", collateralToken.address);
		
		await oneTokenFactory.admitModule(memberTokenOracle.address, moduleType.oracle, "memberTokenOracle", url);
		await oneTokenFactory.admitModule(collateralTokenOracle.address, moduleType.oracle, "collateralTokenOracle", url);
		
		await oneTokenFactory.admitForeignToken(memberToken.address, false, memberTokenOracle.address);
		await oneTokenFactory.admitForeignToken(collateralToken.address, true, collateralTokenOracle.address);
		
		const deployOneTokenProxyParams = [
			"OneTokenProxy",
			"OneTP",
			governance,
			version.address,
			nullController.address,
			incrementalMintMaster.address,
			oneTokenOracle.address,
			memberToken.address,
			collateralToken.address
		];
		
		const {
			newOneTokenProxy,
			proxyAdmin
		} = await oneTokenFactory.deployOneTokenProxy.call(...deployOneTokenProxyParams);
		const deployOneTokenProxyTx = await oneTokenFactory.deployOneTokenProxy(...deployOneTokenProxyParams);
		expectEvent(deployOneTokenProxyTx, 'OneTokenDeployed')
		
		oneTokenProxy = newOneTokenProxy;
		oneTokenAddress = await oneTokenFactory.oneTokenAtIndex(0);
		oneToken = await OneToken.at(oneTokenProxy);
		
		memberTokenArbitraryStrategy = await ArbitraryStrategy.new(oneTokenFactory.address, newOneTokenProxy, "memberTokenArbitraryStrategy");
		collateralTokenArbitraryStrategy = await ArbitraryStrategy.new(oneTokenFactory.address, newOneTokenProxy, "collateralTokenArbitraryStrategy");
		
		
		await memberToken.approve(oneToken.address, getBigNumber(1000,9), { from: bob });
		await collateralToken.approve(oneToken.address, getBigNumber(1000,6), { from: bob });
		
	});
	
	it("should be deployed", async () => {
		assert.isNotNull(oneTokenFactory.address, "oneTokenFactory must be deployed");
		assert.isNotNull(memberToken.address, "memberToken must be deployed");
		assert.isNotNull(collateralToken.address, "collateralToken must be deployed");
		assert.isNotNull(incrementalMintMaster.address, "incrementalMintMaster must be deployed");
		assert.isNotNull(nullController.address, "nullController must be deployed");
		assert.isNotNull(memberTokenArbitraryStrategy.address, "memberTokenArbitraryStrategy must be deployed");
		assert.isNotNull(collateralTokenArbitraryStrategy.address, "collateralTokenArbitraryStrategy must be deployed");
	});
	
	async function transferSomeTokensToBob(amount) {
		// transfer some funds to bob to buy one token
		await collateralToken.transfer(bob, getBigNumber(amount,6), { from: governance });
		await memberToken.transfer(bob, getBigNumber(amount,9), { from: governance });
	}
	
	it("Bob should be able to mint one Token with Pegged Oracle for member", async () => {
		const initialAmount = 100;
		await transferSomeTokensToBob(initialAmount);
		
		const bobCollateralBalanceBefore = await collateralToken.balanceOf(bob);
		const bobMemberBalanceBefore = await memberToken.balanceOf(bob);
		
		const expectedAmount = 100;
		assert.equal(bobCollateralBalanceBefore.toString(), getBigNumber(expectedAmount,6).toString(), `bobCollateralBalanceBefore must have ${expectedAmount} of tokens`);
		assert.equal(bobMemberBalanceBefore.toString(), getBigNumber(expectedAmount,9).toString(), `bobMemberBalanceBefore must have ${expectedAmount} of tokens`);
		
		const mintingAmount = 10;
		// ratio wasn't set, so should use 100% collateral
		await oneToken.mint(collateralToken.address, getBigNumber(mintingAmount,18), { from: bob });
		
		const bobCollateralBalanceAfter = await collateralToken.balanceOf(bob);
		const bobMemberBalanceAfter = await memberToken.balanceOf(bob);
		
		assert.equal(
			bobCollateralBalanceBefore.sub(bobCollateralBalanceAfter).toString(),
			getBigNumber(mintingAmount,6).toString(),
			`bobCollateralBalanceAfter must be ${mintingAmount} less`
		);
		assert.equal(
			bobMemberBalanceBefore.sub(bobMemberBalanceAfter),
			0,
			`bobMemberBalanceAfter must remain the same`
		);
	})
	
	
	async function setupUniswapOracle(reserve1, reserve2) {
		uniswapV2Factory = await UniswapV2Factory.new(governance);
		await uniswapV2Factory.createPair(memberToken.address, collateralToken.address);
		memberTokenUsdtUniswapPair = await uniswapV2Factory.getPair(memberToken.address, collateralToken.address)
		await memberToken.transfer(memberTokenUsdtUniswapPair, getBigNumber(reserve1,9))
		await collateralToken.transfer(memberTokenUsdtUniswapPair, getBigNumber(reserve2,6))
		const uniswapPair = await UniswapV2Pair.at(memberTokenUsdtUniswapPair);
		await time.increase(TEST_TIME_PERIOD);
		await uniswapPair.sync();
		memberTokenOracle = await UniswapOracleSimple.new(oneTokenFactory.address, uniswapV2Factory.address, collateralToken.address, TEST_TIME_PERIOD);
		await memberTokenOracle.update(memberToken.address)
		await time.increase(TEST_TIME_PERIOD);
		// must update twice to have proper values
		await memberTokenOracle.update(memberToken.address)
		await oneTokenFactory.admitModule(memberTokenOracle.address, moduleType.oracle, "memberTokenOracle", url);
		await oneTokenFactory.assignOracle(memberToken.address, memberTokenOracle.address);
		await oneToken.removeAsset(memberToken.address)
		await oneToken.addAsset(memberToken.address, memberTokenOracle.address)
	}
	
	it("Bob should be able to mint one Token with Uniswap Oracle simple", async () => {
		let reserve1 = 100;
		let reserve2 = 200;
		await setupUniswapOracle(reserve1, reserve2);
		
		const amount = 100;
		await transferSomeTokensToBob(amount);
		
		await incrementalMintMaster.setParams(oneToken.address,
			RATIO_50, RATIO_95, STEP_002, RATIO_90, { from: governance });
		
		const bobCollateralBalanceBefore = await collateralToken.balanceOf(bob);
		const bobMemberBalanceBefore = await memberToken.balanceOf(bob);
		const bobOneTokenBalanceBefore = await oneToken.balanceOf(bob);

		//console.log("collateral before minting = "+bobCollateralBalanceBefore.toString());
		//console.log("member token before minting = "+bobMemberBalanceBefore.toString());

		let theRatio = await oneToken.getMintingRatio(collateralToken.address);
 		//console.log("ratio before minting = "+theRatio[0].toString());

		let readRes = await oneTokenOracle.read(oneToken.address, getBigNumber(1,18).toString());
		//console.log("quote from oneToken oracle = "+readRes[0].toString());

		const mintingAmount = 1;
		await oneToken.mint(collateralToken.address, getBigNumber(mintingAmount,6), { from: bob });
		
		theRatio = await oneToken.getMintingRatio(collateralToken.address);
 		//console.log("ratio after minting = "+theRatio[0].toString());

		const bobCollateralBalanceAfter = await collateralToken.balanceOf(bob);
		const bobMemberBalanceAfter = await memberToken.balanceOf(bob);
		const bobOneTokenBalanceAfter = await oneToken.balanceOf(bob);
		
		//console.log("collateral after minting = "+bobCollateralBalanceAfter.toString());
		//console.log("member token after minting = "+bobMemberBalanceAfter.toString());

		// collateral spent = 1 * 0.9
		/*assert.equal(
			bobCollateralBalanceBefore.sub(bobCollateralBalanceAfter).toString(),
			getBigNumber(mintingAmount,18).mul(RATIO_90).div(PRECISION).div(10 ** 12).toString(),
			`bobCollateralBalanceAfter wrong`);
		
		// member token spent = 1 * 0.1 / 2 (1:2 price should come from UNI oracle)	
		assert.equal(
			bobMemberBalanceBefore.sub(bobMemberBalanceAfter).toString(),
			getBigNumber(mintingAmount,18).mul(PRECISION.sub(RATIO_90)).div(PRECISION).div(10 ** 9).div(reserve2 / reserve1).toString(),
			`bobCollateralBalanceAfter wrong`);
		
		assert.equal(
			bobOneTokenBalanceAfter.sub(bobOneTokenBalanceBefore).toString(),
			getBigNumber(mintingAmount,18).toString(),
			`bobOneTokenBalanceAfter wrong`);*/
	})
	
	it("Bob transfers some of her oneTokens to Alice", async () => {
		let reserve1 = 100;
		let reserve2 = 200;
		await setupUniswapOracle(reserve1, reserve2);
		
		const amount = 100;
		await transferSomeTokensToBob(amount);
		
		await incrementalMintMaster.setParams(oneToken.address,
			RATIO_50, RATIO_95, STEP_002, RATIO_90, { from: governance });
		
		const mintingAmount = 1;
		await oneToken.mint(collateralToken.address, getBigNumber(mintingAmount,18), { from: bob });
		
		const transferHalfAmount = getBigNumber(mintingAmount,18).div(2);
		await oneToken.transfer(alice, transferHalfAmount.toString(), { from: bob });
		
		assert.equal(
			(await oneToken.balanceOf(bob)).toString(),
			transferHalfAmount.toString(),
			`bob balance after must be ${transferHalfAmount.toString()}`);
		
		assert.equal(
			(await oneToken.balanceOf(alice)).toString(),
			transferHalfAmount.toString(),
			`alice balance after must be ${transferHalfAmount.toString()}`);
	})
	
	it("Oracle price adjustment, member token UP", async () => {
		let reserve1 = 100;
		let reserve2 = 200;
		await setupUniswapOracle(reserve1, reserve2);
		
		const infoBefore = await memberTokenOracle.pairInfo(memberToken.address)
		
		let reserve1IncreaseAmount = 100;
		await memberToken.transfer(memberTokenUsdtUniswapPair, getBigNumber(reserve1IncreaseAmount,9))
		await time.increase(TEST_TIME_PERIOD);
		const uniswapPair = await UniswapV2Pair.at(memberTokenUsdtUniswapPair);
		await uniswapPair.sync();
		await memberTokenOracle.update(memberToken.address)
		
		const infoAfter = await memberTokenOracle.pairInfo(memberToken.address)

/*		console.log(memberToken.address);

		console.log(infoBefore.token0);
		console.log(infoBefore.token1);
		console.log(infoBefore.price0Average.toString());
		console.log(infoBefore.price1Average.toString());

		console.log(infoAfter.token0);
		console.log(infoAfter.token1);
		console.log(infoAfter.price0Average.toString());
		console.log(infoAfter.price1Average.toString());*/

		//assert.isTrue(infoBefore.price1Average.eq(infoBefore.price0Average))
		if (memberToken.address == infoBefore.token1.toString()) {
			assert.isTrue(infoBefore.price0Average.lt(infoAfter.price0Average))
			//assert.isTrue(infoBefore.price1Average.gt(infoAfter.price1Average))
			//assert.isTrue(infoAfter.price0Average.gt(infoAfter.price1Average))
		} else {
			// flipped tokens in the pair
			assert.isTrue(infoBefore.price0Average.gt(infoAfter.price0Average))
			//assert.isTrue(infoBefore.price1Average.lt(infoAfter.price1Average))
			//assert.isTrue(infoAfter.price0Average.lt(infoAfter.price1Average))
		}
	})
	
	it("Bob redeems tokens, gets collateral", async () => {
		let reserve1 = 100;
		let reserve2 = 200;
		await setupUniswapOracle(reserve1, reserve2);
		
		const amount = 100;
		await transferSomeTokensToBob(amount);
		
		await incrementalMintMaster.setParams(oneToken.address,
			RATIO_50, RATIO_95, STEP_002, RATIO_90, { from: governance });
		
		const mintingAmount = 1;
		await oneToken.mint(collateralToken.address, getBigNumber(mintingAmount,18), { from: bob });
		
		const bobCollateralBalanceBefore = await collateralToken.balanceOf(bob);
		const bobMemberBalanceBefore = await memberToken.balanceOf(bob);
		const bobOneTokenBalanceBefore = await oneToken.balanceOf(bob);
		
		// redeem half
		let redeemAmount = getBigNumber(mintingAmount,18).div(2);
		await oneToken.redeem(collateralToken.address, redeemAmount, { from: bob });
		
		const bobCollateralBalanceAfter = await collateralToken.balanceOf(bob);
		const bobMemberBalanceAfter = await memberToken.balanceOf(bob);
		const bobOneTokenBalanceAfter = await oneToken.balanceOf(bob);
		
		assert.isTrue(Number(bobCollateralBalanceBefore) == (Number(bobCollateralBalanceAfter) - Number(redeemAmount) / 10 ** 12))
		assert.isTrue(bobMemberBalanceBefore.eq(bobMemberBalanceAfter))
		assert.equal(BigNumber.from(bobOneTokenBalanceBefore.toString()).sub(redeemAmount).toString(), bobOneTokenBalanceAfter.toString())
	})
});
