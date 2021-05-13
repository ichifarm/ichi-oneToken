const { assert } = require("chai");
const { expectEvent } = require("@openzeppelin/test-helpers");
const { getBigNumber } = require("./utilities");
const time = require("@openzeppelin/test-helpers/src/time");
const { BigNumber } = require("ethers");

const OneTokenFactory = artifacts.require("OneTokenFactory");
const OneToken = artifacts.require("OneTokenV1");
const MemberToken = artifacts.require("MemberToken");
const CollateralToken = artifacts.require("CollateralToken");
const IncrementalMintMaster = artifacts.require("Incremental");
const ICHIPeggedOracle = artifacts.require("ICHIPeggedOracle");
const UniswapOracleSimple = artifacts.require("UniswapOracleSimple");
const UniswapV2Factory = artifacts.require("UniswapV2Factory");
const ArbitraryStrategy = artifacts.require("Arbitrary");
const UniswapV2Pair = artifacts.require("UniswapV2Pair")
const NullController = artifacts.require("NullController");

const TEST_TIME_PERIOD = 60000

const
	PRECISION = getBigNumber(1), // 50%
	RATIO_50 = "500000000000000000", // 50%
	RATIO_95 = "950000000000000000", // 95%
	RATIO_90 = "900000000000000000", // 90%
	STEP_002 = "2000000000000000", // 0.2%
	MAX_VOL = "9999999999999999999999999999999999999999999999999"; // approximately unlimited

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
	oneTokenAddress,
	oneToken,
	oneTokenProxy
;

contract("Integration tests", accounts => {
	
	beforeEach(async () => {
		governance = accounts[0];
		alice = accounts[1];
		bob = accounts[2];
		
		oneTokenFactory = await OneTokenFactory.new();
		memberToken = await MemberToken.new();
		collateralToken = await CollateralToken.new();
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
		
		
		await memberToken.approve(oneToken.address, getBigNumber(1000), { from: bob });
		await collateralToken.approve(oneToken.address, getBigNumber(1000), { from: bob });
		
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
		// transfer some tokens to bob to buy one token
		await collateralToken.transfer(bob, amount, { from: governance });
		await memberToken.transfer(bob, amount, { from: governance });
	}
	
	it("Bob should be able to mint one Token with Pegged Oracle for member", async () => {
		const amount = getBigNumber(100);
		await transferSomeTokensToBob(amount);
		
		const bobCollateralBalanceBefore = await collateralToken.balanceOf(bob);
		const bobMemberBalanceBefore = await memberToken.balanceOf(bob);
		
		const expectedAmountStr = amount.toString();
		assert.equal(bobCollateralBalanceBefore.toString(), expectedAmountStr, `bobCollateralBalanceBefore must have ${expectedAmountStr} of tokens`);
		assert.equal(bobMemberBalanceBefore.toString(), expectedAmountStr, `bobMemberBalanceBefore must have ${expectedAmountStr} of tokens`);
		
		const mintingAmount = getBigNumber(10);
		let tx = await oneToken.mint(collateralToken.address, mintingAmount, { from: bob });
		
		const bobCollateralBalanceAfter = await collateralToken.balanceOf(bob);
		
		assert.equal(
			bobCollateralBalanceBefore.sub(bobCollateralBalanceAfter).toString(),
			mintingAmount.toString(),
			`bobCollateralBalanceAfter must be ${mintingAmount} less`
		);
	})
	
	
	async function setupUniswapOracle(reserve1, reserve2) {
		uniswapV2Factory = await UniswapV2Factory.new(governance);
		await uniswapV2Factory.createPair(memberToken.address, collateralToken.address);
		memberTokenUsdtUniswapPair = await uniswapV2Factory.getPair(memberToken.address, collateralToken.address)
		await memberToken.transfer(memberTokenUsdtUniswapPair, reserve1)
		await collateralToken.transfer(memberTokenUsdtUniswapPair, reserve2)
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
		let reserve1 = getBigNumber(100);
		let reserve2 = getBigNumber(200);
		await setupUniswapOracle(reserve1, reserve2);
		
		const amount = getBigNumber(100);
		await transferSomeTokensToBob(amount);
		
		await incrementalMintMaster.setParams(oneToken.address,
			RATIO_50, RATIO_95, STEP_002, RATIO_90, MAX_VOL, { from: governance });
		
		const bobCollateralBalanceBefore = await collateralToken.balanceOf(bob);
		const bobMemberBalanceBefore = await memberToken.balanceOf(bob);
		const bobOneTokenBalanceBefore = await oneToken.balanceOf(bob);
		
		const mintingAmount = getBigNumber(1);
		let tx = await oneToken.mint(collateralToken.address, mintingAmount, { from: bob });
		
		const bobCollateralBalanceAfter = await collateralToken.balanceOf(bob);
		const bobMemberBalanceAfter = await memberToken.balanceOf(bob);
		const bobOneTokenBalanceAfter = await oneToken.balanceOf(bob);
		
		assert.equal(
			bobCollateralBalanceBefore.sub(bobCollateralBalanceAfter).toString(),
			mintingAmount.mul(RATIO_90).div(PRECISION).toString(),
			`bobCollateralBalanceAfter wrong`);
		
		assert.equal(
			bobMemberBalanceBefore.sub(bobMemberBalanceAfter).toString(),
			mintingAmount.mul(PRECISION.sub(RATIO_90)).div(PRECISION).div(reserve2.div(reserve1)).toString(),
			`bobCollateralBalanceAfter wrong`);
		
		assert.equal(
			bobOneTokenBalanceAfter.sub(bobOneTokenBalanceBefore).toString(),
			mintingAmount.toString(),
			`bobOneTokenBalanceAfter wrong`);
	})
	
	it("Bob transfers some of her oneTokens to Alice", async () => {
		let reserve1 = getBigNumber(100);
		let reserve2 = getBigNumber(200);
		await setupUniswapOracle(reserve1, reserve2);
		
		const amount = getBigNumber(100);
		await transferSomeTokensToBob(amount);
		
		await incrementalMintMaster.setParams(oneToken.address,
			RATIO_50, RATIO_95, STEP_002, RATIO_90, MAX_VOL, { from: governance });
		
		const mintingAmount = getBigNumber(1);
		await oneToken.mint(collateralToken.address, mintingAmount, { from: bob });
		
		const transferHalfAmount = mintingAmount.div(2);
		await oneToken.transfer(alice, transferHalfAmount, { from: bob });
		
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
		let reserve1 = getBigNumber(100);
		let reserve2 = getBigNumber(100);
		await setupUniswapOracle(reserve1, reserve2);
		
		const infoBefore = await memberTokenOracle.pairInfo(memberToken.address)
		
		let reserve1IncreaseAmount = getBigNumber(100);
		await memberToken.transfer(memberTokenUsdtUniswapPair, reserve1IncreaseAmount)
		await time.increase(TEST_TIME_PERIOD);
		const uniswapPair = await UniswapV2Pair.at(memberTokenUsdtUniswapPair);
		await uniswapPair.sync();
		await memberTokenOracle.update(memberToken.address)
		
		const infoAfter = await memberTokenOracle.pairInfo(memberToken.address)

		assert.isTrue(infoBefore.price1Average.eq(infoBefore.price0Average))
		if (memberToken.address == infoBefore.token1.toString()) {
			assert.isTrue(infoBefore.price0Average.lt(infoAfter.price0Average))
			assert.isTrue(infoBefore.price1Average.gt(infoAfter.price1Average))
			assert.isTrue(infoAfter.price0Average.gt(infoAfter.price1Average))
		} else {
			// flipped tokens in the pair
			assert.isTrue(infoBefore.price0Average.gt(infoAfter.price0Average))
			assert.isTrue(infoBefore.price1Average.lt(infoAfter.price1Average))
			assert.isTrue(infoAfter.price0Average.lt(infoAfter.price1Average))
		}
	})
	
	it("Bob redeems tokens, gets USD", async () => {
		let reserve1 = getBigNumber(100);
		let reserve2 = getBigNumber(200);
		await setupUniswapOracle(reserve1, reserve2);
		
		const amount = getBigNumber(100);
		await transferSomeTokensToBob(amount);
		
		await incrementalMintMaster.setParams(oneToken.address,
			RATIO_50, RATIO_95, STEP_002, RATIO_90, MAX_VOL, { from: governance });
		
		const mintingAmount = getBigNumber(1);
		await oneToken.mint(collateralToken.address, mintingAmount, { from: bob });
		
		const bobCollateralBalanceBefore = await collateralToken.balanceOf(bob);
		const bobMemberBalanceBefore = await memberToken.balanceOf(bob);
		const bobOneTokenBalanceBefore = await oneToken.balanceOf(bob);
		
		// redeem half
		let redeemAmount = mintingAmount.div(2);
		await oneToken.redeem(collateralToken.address, redeemAmount, { from: bob });
		
		const bobCollateralBalanceAfter = await collateralToken.balanceOf(bob);
		const bobMemberBalanceAfter = await memberToken.balanceOf(bob);
		const bobOneTokenBalanceAfter = await oneToken.balanceOf(bob);
		
		assert.isTrue(Number(bobCollateralBalanceBefore) == (Number(bobCollateralBalanceAfter) - Number(redeemAmount)))
		assert.isTrue(bobMemberBalanceBefore.eq(bobMemberBalanceAfter))
		assert.equal(BigNumber.from(bobOneTokenBalanceBefore.toString()).sub(redeemAmount).toString(), bobOneTokenBalanceAfter.toString())
	})
});
