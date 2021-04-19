const { assert } = require("chai");
const truffleAssert = require('truffle-assertions');
const { expectEvent } = require("@openzeppelin/test-helpers");
const { getBigNumber } = require("./utilities");
const time = require("@openzeppelin/test-helpers/src/time");

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

contract("exploratory Integration tests", accounts => {
	
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

	pairInfo = async (oracle, token) => {
		pair = await oracle.pairInfo(token.address);
		/*
		console.log('pair info:');
		console.log('token0', pair[0]);
		console.log('token1', pair[1]);
		console.log('price0CumulativeLast', pair[2].toString(10));
		console.log('price1CumulativeLast', pair[3].toString(10));
		console.log('price0Average', pair[4].toString(10));
		console.log('price1Average', pair[5].toString(10));
		console.log('timeStamp', pair[6].toString(10));
		console.log();
		*/
	}
	
	it("Oracle simple should work for the memberToken", async () => {
		const amount1 = "100";
		const amount2 = "200";
		msg1 = "UniswapOracleSimple: Gathering history. Try again later";
		
		// create the pool
		uniswapV2Factory = await UniswapV2Factory.new(governance);
		await uniswapV2Factory.createPair(memberToken.address, collateralToken.address);
		memberTokenUsdtUniswapPair = await uniswapV2Factory.getPair(memberToken.address, collateralToken.address)

		// capitalize the pool
		await memberToken.transfer(memberTokenUsdtUniswapPair, amount2);
		await collateralToken.transfer(memberTokenUsdtUniswapPair, amount1);
		await memberTokenOracle.update(memberToken.address);

		// sync uniswap test pool
		const uniswapPair = await UniswapV2Pair.at(memberTokenUsdtUniswapPair);
		await uniswapPair.sync();

		// create an oracle to watch pools of the collateralToken type
		memberTokenOracle = await UniswapOracleSimple.new(oneTokenFactory.address, uniswapV2Factory.address, collateralToken.address, TEST_TIME_PERIOD);	

		// admit the oracle into the factory. Factory initializes the oracle for the memberToken
		await oneTokenFactory.admitModule(memberTokenOracle.address, moduleType.oracle, "memberTokenOracle", url);
		await oneTokenFactory.assignOracle(memberToken.address, memberTokenOracle.address);

		await pairInfo(memberTokenOracle, memberToken);

		truffleAssert.reverts(memberTokenOracle.consult(memberToken.address, amount1), msg1);

		// fast-forward and update again to ensure a price history
		await time.increase(TEST_TIME_PERIOD);
		await memberTokenOracle.update(memberToken.address);

		await pairInfo(memberTokenOracle, memberToken);
		
		const consultMember = await memberTokenOracle.consult(memberToken.address, amount1);
		// console.log('consult:', amount1, 'member tokens is collateral value:', consultMember.toString(10));

		const amountReq = await memberTokenOracle.amountRequired(memberToken.address, amount2);
		// console.log('amountRequired:', amount2, 'collateralRequired is', amountReq[0].toString(10), 'memberTokens');

		assert.strictEqual(consultMember.toString(10), "50", "Member token value incorrectly reported");
		assert.strictEqual(amountReq[0].toString(10), "400", "member tokens required incorrected reported.");
		
	})
});
