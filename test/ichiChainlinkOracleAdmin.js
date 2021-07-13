const { expect, assert } = require("chai");
const { ethers, artifacts } = require("hardhat");
const truffleAssert = require('truffle-assertions');
const { getBigNumber } = require("./utilities");
const { expectEvent } = require("@openzeppelin/test-helpers");

const Factory = artifacts.require("OneTokenFactory");
const ChainlinkOracle = artifacts.require("ChainlinkOracle");
const OracleCommon = artifacts.require("OracleCommon");

const ONE_USD = getBigNumber(1,18);
const ONE_RENFIL = getBigNumber(1,18);

const CHAINLINK_RENFIL_USD = '0x1A31D42149e82Eb99777f903C08A2E41A00085d3';
const CHAINLINK_RENFIL_ETH = '0x0606Be69451B1C9861Ac6b3626b99093b713E801'; // wrong oracle
const CHAINLINK_1INCH_USD = '0xc929ad75B72593967DE83E7F7Cda0493458261D9';
const CHAINLINK_USDT_USD = '0x3E7d1eAB13ad0104d2750B8863b489D65364e32D';

const TOKEN_RENFIL = '0xD5147bc8e386d91Cc5DBE72099DAC6C9b99276F5';
const TOKEN_1INCH = '0x111111111117dC0aa78b770fA6A738034120C302';

const moduleType = {
	version: 0,
	controller: 1,
	strategy: 2,
	mintMaster: 3,
	oracle: 4,
	voterRoll: 5
}
	
let governance,
    badAddress,
    commonUser; 

contract('ChainlinkOracle', accounts => {
    let oracle, 
        factory

    beforeEach(async () => {
        governance = accounts[0];
        badAddress = accounts[1];
        commonUser = accounts[2];
        factory = await Factory.deployed();
        oracle = await ChainlinkOracle.deployed();
    })

    describe('In the framework', async() => {
        it('able to add the oracle to the factory and init it', async() => {
            await factory.admitModule(oracle.address, moduleType.oracle, "Chainlink", "URL");
            let tx = await factory.admitForeignToken(TOKEN_RENFIL, false, oracle.address);

            const collateralToken = await oracle.indexToken();

            // test event from OracleCommon
            expectEvent.inTransaction(tx.tx, OracleCommon, 'OracleInitialized', {
                sender: factory.address,
                baseToken: TOKEN_RENFIL,
                indexToken: collateralToken
            })
        })
    })

    describe('Admin Functionality', async() => {
        it('must require token/oracle pair to be registered', async() => {
            const msg1 = "ChainlinkOracle: unknown token";

            await truffleAssert.reverts(oracle.getThePrice(TOKEN_RENFIL, { from: governance }), msg1);
            await truffleAssert.reverts(oracle.read(TOKEN_RENFIL, ONE_RENFIL, { from: governance }), msg1);
            await truffleAssert.reverts(oracle.amountRequired(TOKEN_RENFIL, ONE_USD, { from: governance }), msg1);
        })

        it('prevents admin from registering ETH oracles', async() => {
            const msg1 = "ChainlinkOracle: the oracle must return USD values";

            await truffleAssert.reverts(oracle.registerOracle(TOKEN_RENFIL, CHAINLINK_RENFIL_ETH, { from: governance }), msg1);
            await oracle.registerOracle(TOKEN_RENFIL, CHAINLINK_RENFIL_USD, { from: governance });
            await truffleAssert.reverts(oracle.updateOracle(TOKEN_RENFIL, CHAINLINK_RENFIL_ETH, { from: governance }), msg1);
            await oracle.unregisterOracle(TOKEN_RENFIL, { from: governance });
        })

        it('does not allow to register the same token/oracle', async() => {
            const msg1 = "ChainlinkOracle: oracle is already registered";

            await oracle.registerOracle(TOKEN_RENFIL, CHAINLINK_RENFIL_USD, { from: governance });
            await truffleAssert.reverts(oracle.registerOracle(TOKEN_RENFIL, CHAINLINK_RENFIL_USD, { from: governance }), msg1);
            await oracle.unregisterOracle(TOKEN_RENFIL, { from: governance });
        })

        it('prevents unathorized user to register/unregister/update oracles', async() => {
            const msg1 = "ICHIOwnable: caller is not the owner";

            await truffleAssert.reverts(oracle.registerOracle(TOKEN_RENFIL, CHAINLINK_RENFIL_USD, { from: commonUser }), msg1);
            await oracle.registerOracle(TOKEN_RENFIL, CHAINLINK_RENFIL_USD, { from: governance });
            await truffleAssert.reverts(oracle.updateOracle(TOKEN_RENFIL, CHAINLINK_RENFIL_USD, { from: commonUser }), msg1);
            await truffleAssert.reverts(oracle.unregisterOracle(TOKEN_RENFIL, { from: commonUser }), msg1);
            await oracle.unregisterOracle(TOKEN_RENFIL, { from: governance });
        })

        it('does not accept random addresses as oracle addresses', async() => {
            const msg1 = "function call to a non-contract account";

            await truffleAssert.reverts(oracle.registerOracle(TOKEN_RENFIL, badAddress, { from: governance }), msg1);
        })

        it('admin is able to register/unregister/update oracles', async() => {
            const msg1 = "ChainlinkOracle: index number is too high";

            let count = await oracle.oraclesCount();
            expect(Number(count)).to.equal(0);
            await truffleAssert.reverts(oracle.oracleAtIndex(0), msg1);
            
            let tx = await oracle.registerOracle(TOKEN_RENFIL, CHAINLINK_RENFIL_USD, { from: governance });
            expectEvent(tx, 'RegisterChainlinkOracle', {
                sender: governance,
                token: TOKEN_RENFIL,
                oracle: CHAINLINK_RENFIL_USD
            });
            count = await oracle.oraclesCount();
            expect(Number(count)).to.equal(1);
            await truffleAssert.reverts(oracle.oracleAtIndex(1), msg1);
            
            await oracle.registerOracle(TOKEN_1INCH, CHAINLINK_1INCH_USD, { from: governance });
            count = await oracle.oraclesCount();
            expect(Number(count)).to.equal(2);

            let oracle1 = await oracle.oracleAtIndex(0);
            let token1 = await oracle.tokenAtIndex(0);
            assert.strictEqual(oracle1.toLowerCase(), CHAINLINK_RENFIL_USD.toLowerCase(), "mixed oracles in the set");
            assert.strictEqual(token1.toLowerCase(), TOKEN_RENFIL.toLowerCase(), "mixed tokens in the set");
            let oracle2 = await oracle.oracleAtIndex(1);
            let token2 = await oracle.tokenAtIndex(1);
            assert.strictEqual(oracle2.toLowerCase(), CHAINLINK_1INCH_USD.toLowerCase(), "mixed oracles in the set");
            assert.strictEqual(token2.toLowerCase(), TOKEN_1INCH.toLowerCase(), "mixed tokens in the set");

            tx = await oracle.updateOracle(TOKEN_1INCH, CHAINLINK_USDT_USD, { from: governance });
            expectEvent(tx, 'UpdateChainlinkOracle', {
                sender: governance,
                token: TOKEN_1INCH,
                oracle: CHAINLINK_USDT_USD
            });

            oracle2 = await oracle.oracleAtIndex(1);
            assert.strictEqual(oracle2.toLowerCase(), CHAINLINK_USDT_USD.toLowerCase(), "mixed oracles in the set");
            await truffleAssert.reverts(oracle.tokenAtIndex(2), msg1);

            await oracle.unregisterOracle(TOKEN_RENFIL, { from: governance });
            tx = await oracle.unregisterOracle(TOKEN_1INCH, { from: governance });
            expectEvent(tx, 'UnregisterChainlinkOracle', {
                sender: governance,
                token: TOKEN_1INCH
            });

            count = await oracle.oraclesCount();
            expect(Number(count)).to.equal(0);
        })

    })

})