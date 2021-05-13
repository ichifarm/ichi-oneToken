const truffleAssert = require("truffle-assertions");
const { assert } = require("chai");
const { expectEvent } = require("@openzeppelin/test-helpers");

const
	ArbitraryStrategy = artifacts.require("Arbitrary"),
	NullStrategy = artifacts.require("NullStrategy"),
	OraclePegged = artifacts.require("ICHIPeggedOracle"),
	Factory = artifacts.require("OneTokenFactory"),
    ControllerNull = artifacts.require("NullController"),
    MintMasterIncremental = artifacts.require("Incremental"),
    MemberToken = artifacts.require("MemberToken"),
	CollateralToken = artifacts.require("CollateralToken"),
	StrategyCommon = artifacts.require("StrategyCommon"),
    OneTokenProxyAdmin = artifacts.require("OneTokenProxyAdmin"),
	OneToken = artifacts.require("OneTokenV1");

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

let governance, 
	oneTokenAddress, 
	oneToken, 
    secondOneToken,
    secondOneTokenAddress,
	factory, 
	arbitraryStrategy, 
    controller,
    mintMaster,
    oracle,
    memberToken,
	collateralToken;

const moduleType = {
	version: 0,
	controller: 1,
	strategy: 2,
	mintMaster: 3,
	oracle: 4,
	voterRoll: 5
}

contract("Arbitrary strategy", accounts => {
	
	beforeEach(async () => {
		governance = accounts[0];
        badAddress = accounts[1];
		factory = await Factory.deployed();
        controller = await ControllerNull.deployed();
        mintMaster = await MintMasterIncremental.deployed();
        oracle = await OraclePegged.deployed();
        memberToken = await MemberToken.deployed();
        collateralToken1 = await CollateralToken.deployed();
		oneTokenAddress = await factory.oneTokenAtIndex(0);
		oneToken = await OneToken.at(oneTokenAddress);

		// deploy second oneToken
        const 
            oneTokenName = "Second OneToken Instance",
            symbol = "OTI-2",
            versionName = "OneTokenV1-2",
            url = "#";
        secondOneToken  = await OneToken.new();
        OneToken.setAsDeployed(secondOneToken);
        await factory.admitModule(secondOneToken.address, moduleType.version, versionName, url);
        await factory.deployOneTokenProxy(
            oneTokenName,
            symbol,
            governance,
            secondOneToken.address,
            controller.address,
            mintMaster.address,
            oracle.address,
            memberToken.address,
            collateralToken1.address
        )
        secondOneTokenAddress = await factory.oneTokenAtIndex(1);
        secondOneToken = await OneToken.at(secondOneTokenAddress);
	});
	
	it("should be ready to test", async () => {
		assert.isAtLeast(accounts.length, 2, "There are not at least two accounts to work with");
		assert.isNotNull(oneToken.address, "There is no token for strategy");
	});
	
	
	it("should be constructed with one token", async () => {
		const factory = await Factory.deployed();
		let contract = arbitraryStrategy = await ArbitraryStrategy.new(factory.address, oneTokenAddress, "Test StrategyCommon")
		assert.isNotNull(arbitraryStrategy.address, "There is no token for strategy");

		expectEvent.inConstruction(contract, 'StrategyDeployed', {
			sender: governance
		})
	});
	
	it("should have 0 allowance before init", async () => {
		const allowance = await oneToken.allowance(oneTokenAddress, arbitraryStrategy.address)
		assert.equal(allowance.toNumber(), 0, "should have 0 allowance before init");
	});
	
	it("should be failed with random token", async () => {
		const randomToken = await OneToken.new();
		const factory = await Factory.deployed();
		assert.isNotNull(randomToken.address, "There is no token for strategy");
		truffleAssert.reverts(ArbitraryStrategy.new(factory.address, randomToken.address, "Test failed StrategyCommon")/*, 'StrategyCommon: oneToken is unknown'*/);
		let msg1 = "StrategyCommon: oneToken cannot be NULL",
			  msg2 = "StrategyCommon: oneToken is unknown";

		await truffleAssert.reverts(ArbitraryStrategy.new(factory.address, NULL_ADDRESS,"New Strategy"), msg1);

	});
	
	it("should be able to init", async () => {
		await factory.admitModule(arbitraryStrategy.address, moduleType.strategy, "arbitraryStrategy", "#")
		
		collateralToken = await CollateralToken.new();
		const oraclePegged = await OraclePegged.new(factory.address, "oracleName", collateralToken.address);
		await factory.admitModule(oraclePegged.address, moduleType.oracle, "oraclePegged", "#")
		await factory.admitForeignToken(collateralToken.address, true, oraclePegged.address)
		await oneToken.addAsset(collateralToken.address, oraclePegged.address)
		
		// we need to init via oneToken to make it right
		let allowance1 = 1000;
		let tx = await oneToken.setStrategy(collateralToken.address, arbitraryStrategy.address, allowance1);
		expectEvent(tx, 'StrategySet', {
			sender: governance,
			token: collateralToken.address,
			strategy: arbitraryStrategy.address,
			allowance: allowance1.toString()
		})

		// test event from StrategyCommon
        expectEvent.inTransaction(tx.tx, StrategyCommon, 'StrategyInitialized', {
			sender: oneToken.address
		})
	});
	
	it("instance cannot be shared between oneTokens", async () => {
		let msg1 = "OTV1B: can't assign strategy that doesn't recognize this vault";
		let allowance1 = 1000;
		await truffleAssert.reverts(secondOneToken.setStrategy(collateralToken1.address, 
			arbitraryStrategy.address, allowance1), msg1 );
	});

	it("should not be able to init by a non oneToken user", async () => {
		let msg1 = "StrategyCommon: initialize from oneToken instance";
		await truffleAssert.reverts(arbitraryStrategy.init( { from: governance } ), msg1 );
	});
	
	it("should not be able to call execute by not owner/controller", async () => {
		let msg1 = "StrategyCommon: not token controller or owner.";
		await truffleAssert.reverts(arbitraryStrategy.execute( { from: badAddress } ), msg1 );
	});
	
	it("setAllowance to non-zero", async () => {
		const randomToken = await OneToken.new();
		let amount = 5;
		let tx = await arbitraryStrategy.setAllowance(randomToken.address, amount);
		const allowance = await randomToken.allowance(arbitraryStrategy.address, oneTokenAddress)
		assert.equal(allowance.toNumber(), amount, "should have amount allowance");

		expectEvent(tx, 'VaultAllowance', {
			sender: governance,
			token: randomToken.address,
			amount: amount.toString()
		})
	});
	
	it("setAllowance to zero", async () => {
		let msg1 = "StrategyCommon: not token controller or owner.";
		let INFINITE = "115792089237316195423570985008687907853269984665640564039457584007913129639935";

		const randomToken = await OneToken.new();
		await truffleAssert.reverts(arbitraryStrategy.setAllowance(randomToken.address, 0, { from: badAddress }), msg1);
		let tx = await arbitraryStrategy.setAllowance(randomToken.address, 0);
		const allowance = await randomToken.allowance(arbitraryStrategy.address, oneTokenAddress)
		assert.equal(allowance.toString(), INFINITE, "should have infinite allowance");

		expectEvent(tx, 'VaultAllowance', {
			sender: governance,
			token: randomToken.address,
			amount: INFINITE
		})
	});
	
	it("close all positions", async () => {
		collateralToken = await CollateralToken.new();
		const factory = await Factory.deployed();
		const oraclePegged = await OraclePegged.new(factory.address, "oracleName", collateralToken.address);
		await factory.admitModule(oraclePegged.address, 4, "oraclePegged", "#")
		await factory.admitForeignToken(collateralToken.address, true, oraclePegged.address)
		await oneToken.addAsset(collateralToken.address, oraclePegged.address)

		const transferAmount = 1;
		await collateralToken.transfer(arbitraryStrategy.address, transferAmount)
		
		const closeAllPositionsTx = await arbitraryStrategy.closeAllPositions();
		expectEvent(closeAllPositionsTx, 'ToVault', {
			token: collateralToken.address,
			sender: governance,
			amount: transferAmount.toString(10)
		})
	});
	
	it("to vault", async () => {
		const transferAmount = 1;
		await collateralToken.transfer(arbitraryStrategy.address, transferAmount)
		const toVaultTx = await arbitraryStrategy.toVault(collateralToken.address, 1)
		expectEvent(toVaultTx, 'ToVault', {
			token: collateralToken.address,
			sender: governance,
			amount: transferAmount.toString(10)
		})
	})
	
	it("governance could increase and descrease strategy allowance", async () => {
		const factory = await Factory.deployed();
		let strategy = await NullStrategy.new(factory.address, oneToken.address, "strategy name");
        await factory.admitModule(strategy.address, moduleType.strategy, "strategy name", "url")
        await oneToken.setStrategy(collateralToken.address, strategy.address, 1, { from: governance });

		const transferAmount = 1;
		let tx = await oneToken.increaseStrategyAllowance(collateralToken.address, transferAmount)

		expectEvent(tx, 'StrategyAllowanceIncreased', {
			sender: governance,
			token: collateralToken.address,
			strategy: strategy.address,
			amount: transferAmount.toString(10)
		})

		let allowance = await collateralToken.allowance(oneToken.address, strategy.address)
		assert.equal(allowance.toString(), "2", "should have allowance set to 2"); // initial + 1

		tx = await oneToken.decreaseStrategyAllowance(collateralToken.address, transferAmount)

		expectEvent(tx, 'StrategyAllowanceDecreased', {
			sender: governance,
			token: collateralToken.address,
			strategy: strategy.address,
			amount: transferAmount.toString(10)
		})

		allowance = await collateralToken.allowance(oneToken.address, strategy.address)
		assert.equal(allowance.toString(), "1", "should have allowance set to 1");

		await strategy.closeAllPositions();
	})

	it("from vault", async () => {
		const factory = await Factory.deployed();
		let strategy = await NullStrategy.new(factory.address, oneToken.address, "strategy name");
        await factory.admitModule(strategy.address, moduleType.strategy, "strategy name", "url")
        await oneToken.setStrategy(collateralToken.address, strategy.address, 0, { from: governance });

		const transferAmount = 1;
		await oneToken.increaseStrategyAllowance(collateralToken.address, transferAmount)

		let allowance = await collateralToken.allowance(oneToken.address, strategy.address)
		assert.equal(allowance.toString(), "1", "should have allowance set to 1");

		const fromVaultTx = await strategy.fromVault(collateralToken.address, transferAmount);
		expectEvent(fromVaultTx, 'FromVault', {
			token: collateralToken.address,
			sender: governance,
			amount: transferAmount.toString(10)
		})

		// fromVault decreases the strategy allowance
		allowance = await collateralToken.allowance(oneToken.address, strategy.address)
		assert.equal(allowance.toString(), "0", "should have allowance set to 0");

		await strategy.closeAllPositions();
	});
	
	it("from vault original", async () => {
		const transferAmount = 1;
		// arbitrary strategy doesn't seem to be assigned to collateral at this stage, so assigning it
		await oneToken.setStrategy(collateralToken.address, arbitraryStrategy.address, transferAmount);
		await oneToken.increaseStrategyAllowance(collateralToken.address, transferAmount)
		const fromVaultTx = await arbitraryStrategy.fromVault(collateralToken.address, transferAmount);
		expectEvent(fromVaultTx, 'FromVault', {
			token: collateralToken.address,
			sender: governance,
			amount: transferAmount.toString(10)
		})
	});

	it("execute transaction without signature", async () => {
		let msg1 = "OneTokenV1::executeTransaction: Transaction execution reverted.";

		const wrongCallData = web3.eth.abi.encodeFunctionCall({
			name: 'someFunction',
			type: 'function',
			inputs: [{
				type: 'address',
				name: 'account'
			}]
		}, [oneTokenAddress]);
		await truffleAssert.reverts(arbitraryStrategy.executeTransaction.call(collateralToken.address, 0, '', wrongCallData), msg1);
		
		const balance = await collateralToken.balanceOf(oneTokenAddress)
		const callData = web3.eth.abi.encodeFunctionCall({
			name: 'balanceOf',
			type: 'function',
			inputs: [{
				type: 'address',
				name: 'account'
			}]
		}, [oneTokenAddress]);
		const txResult = await arbitraryStrategy.executeTransaction.call(collateralToken.address, 0, '', callData);
		assert.notEqual(balance.toNumber(), 0, "should have positive balance");
		assert.equal(balance.toNumber(), web3.utils.hexToNumber(txResult), "should return same balance");
		await arbitraryStrategy.executeTransaction(oneToken.address, 0, '', callData);
	});
	
	it("execute transaction with signature", async () => {
		const balance = await collateralToken.balanceOf(oneTokenAddress)
		const signature = "balanceOf(address)";
		const parameters = web3.eth.abi.encodeParameter('address', oneTokenAddress);
		const txResult = await arbitraryStrategy.executeTransaction.call(collateralToken.address, 0, signature, parameters);
		assert.notEqual(balance.toNumber(), 0, "should have positive balance");
		assert.equal(balance.toNumber(), web3.utils.hexToNumber(txResult), "should return same balance");
		await arbitraryStrategy.executeTransaction(collateralToken.address, 0, signature, parameters);
	});

    it("access control should follow oneToken change of ownership", async () => {
        let 
            msg1 = "StrategyCommon: not token controller or owner.";
	
		const transferAmount = 1;

		let proxyAdminAddress;
        let proxyAdmin;
        let newOwner = accounts[1];

        proxyAdminAddress = await factory.oneTokenProxyAdmins(oneToken.address);
        proxyAdmin = await OneTokenProxyAdmin.at(proxyAdminAddress);
    
        // set new governance
        await oneToken.transferOwnership(newOwner);
        await proxyAdmin.transferOwnership(newOwner);
    
		await collateralToken.transfer(arbitraryStrategy.address, transferAmount)
		await truffleAssert.reverts(arbitraryStrategy.toVault(collateralToken.address, 1, {from: governance}), msg1);
		let tx = await arbitraryStrategy.toVault(collateralToken.address, 1, {from: newOwner})
		expectEvent(tx, 'ToVault', {
			token: collateralToken.address,
			sender: newOwner,
			amount: transferAmount.toString(10)
		})

        // restore old governance 
        await proxyAdmin.transferOwnership(governance, { from: newOwner });
        await oneToken.transferOwnership(governance, { from: newOwner });

		await collateralToken.transfer(arbitraryStrategy.address, transferAmount)
		await truffleAssert.reverts(arbitraryStrategy.toVault(collateralToken.address, 1, {from: newOwner}), msg1);
		tx = await arbitraryStrategy.toVault(collateralToken.address, 1, {from: governance})
		expectEvent(tx, 'ToVault', {
			token: collateralToken.address,
			sender: governance,
			amount: transferAmount.toString(10)
		})
    });
	
});
