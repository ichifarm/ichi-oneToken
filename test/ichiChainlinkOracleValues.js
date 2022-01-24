const { expect, assert } = require("chai");
const { ethers, artifacts } = require("hardhat");
const truffleAssert = require('truffle-assertions');
const { getBigNumber } = require("./utilities");

const Factory = artifacts.require("OneTokenFactory");
const ChainlinkOracleUSD = artifacts.require("ChainlinkOracleUSD");

const ONE_USD = getBigNumber(1,18);
const ONE_RENFIL = getBigNumber(1,18);
const ONE_USDT = getBigNumber(1,6);

const ALLOWED_PRECISION_LOSS_PER_TOKEN = getBigNumber(1,4);

const CHAINLINK_RENFIL_USD = '0x1A31D42149e82Eb99777f903C08A2E41A00085d3';
const CHAINLINK_1INCH_USD = '0xc929ad75B72593967DE83E7F7Cda0493458261D9';
const CHAINLINK_USDT_USD = '0x3E7d1eAB13ad0104d2750B8863b489D65364e32D';

const TOKEN_RENFIL = '0xD5147bc8e386d91Cc5DBE72099DAC6C9b99276F5';
const TOKEN_1INCH = '0x111111111117dC0aa78b770fA6A738034120C302';
const TOKEN_USDT = '0xdac17f958d2ee523a2206206994597c13d831ec7'; // 6 decimals

let governance,
    commonUser; 

contract('ChainlinkOracleUSD', accounts => {
    let oracle, 
        factory

    beforeEach(async () => {
        governance = accounts[0];
        commonUser = accounts[2];

        factory = await Factory.deployed();
        oracle = await ChainlinkOracleUSD.deployed();

        await oracle.registerOracle(TOKEN_RENFIL, CHAINLINK_RENFIL_USD, { from: governance });
        await oracle.registerOracle(TOKEN_1INCH, CHAINLINK_1INCH_USD, { from: governance });
        await oracle.registerOracle(TOKEN_USDT, CHAINLINK_USDT_USD, { from: governance });
    })

    afterEach(async () => {
        await oracle.unregisterOracle(TOKEN_RENFIL, { from: governance });
        await oracle.unregisterOracle(TOKEN_1INCH, { from: governance });
        await oracle.unregisterOracle(TOKEN_USDT, { from: governance });
    });

    describe('Return Values', async() => {
        it('getPrice should be greater than 1', async() => {
            const price = await oracle.getThePrice(TOKEN_RENFIL)
            assert.isTrue(Number(price) > 1);
        })

        it('read should return value of the token in USD for 1 token (18 dec)', async() => {
            const { amountUsd, volatility } = await oracle.read(TOKEN_RENFIL, ONE_RENFIL)
            const price = await oracle.getThePrice(TOKEN_RENFIL)
            assert.isTrue(Number(price) == Number(amountUsd));
        })

        it('read should return value of the token in USD for 100 tokens (18 dec)', async() => {
            const { amountUsd, volatility } = await oracle.read(TOKEN_RENFIL, ONE_RENFIL.mul(100))
            const price = await oracle.getThePrice(TOKEN_RENFIL);
            const calculatedAmount = ethers.utils.parseUnits(price.toString(),0).mul(100);
            assert.equal(calculatedAmount.toString(), ethers.utils.parseUnits(amountUsd.toString(),0).toString());
        })

        it('read should return value of the token in USD for 100000 tokens (18 dec)', async() => {
            const { amountUsd, volatility } = await oracle.read(TOKEN_RENFIL, ONE_RENFIL.mul(100000))
            const price = await oracle.getThePrice(TOKEN_RENFIL);
            const calculatedAmount = ethers.utils.parseUnits(price.toString(),0).mul(100000);
            assert.equal(calculatedAmount.toString(), ethers.utils.parseUnits(amountUsd.toString(),0).toString());
        })

        it('read should return value of the token in USD for 1 token (6 dec)', async() => {
            const { amountUsd, volatility } = await oracle.read(TOKEN_USDT, ONE_USDT)
            const price = await oracle.getThePrice(TOKEN_USDT);
            const calculatedAmount = Number(price); 
            expect(Number(amountUsd)).to.equal(calculatedAmount)
        })

        it('read should return value of the token in USD for 100 tokens (6 dec)', async() => {
            const { amountUsd, volatility } = await oracle.read(TOKEN_USDT, ONE_USDT.mul(100))
            const price = await oracle.getThePrice(TOKEN_USDT);
            const calculatedAmount = ethers.utils.parseUnits(price.toString(),0).mul(100);
            assert.equal(calculatedAmount.toString(), ethers.utils.parseUnits(amountUsd.toString(),0).toString());
        })

        it('read should return value of the token in USD for 100000 tokens (6 dec)', async() => {
            const { amountUsd, volatility } = await oracle.read(TOKEN_USDT, ONE_USDT.mul(100000))
            const price = await oracle.getThePrice(TOKEN_USDT);
            const calculatedAmount = ethers.utils.parseUnits(price.toString(),0).mul(100000);
            assert.equal(calculatedAmount.toString(), ethers.utils.parseUnits(amountUsd.toString(),0).toString());
        })

        it('amountRequired for 1 USD should be (1 token / price) (18 dec)', async() => {
            const { amountTokens, volatility } = await oracle.amountRequired(TOKEN_RENFIL, ONE_USD)
            const price = await oracle.getThePrice(TOKEN_RENFIL)
            const calculatedAmount = Number(ONE_USD) / Number(price) * 10 ** 18;
            expect(Number(amountTokens)).to.equal(calculatedAmount)
        })

        it('amountRequired for 1000 USD should be (1000 tokens / price) (18 dec)', async() => {
            const { amountTokens, volatility } = await oracle.amountRequired(TOKEN_RENFIL, ONE_USD.mul(1000))
            const price = await oracle.getThePrice(TOKEN_RENFIL)
            const calculatedAmount = Number(ONE_USD.mul(1000)) / Number(price) * 10 ** 18;

            const ALLOWED_PRECISION_LOSS = Number(ALLOWED_PRECISION_LOSS_PER_TOKEN) * 1000;

            if (Number(amountTokens) > calculatedAmount) {
                expect(Number(amountTokens)).to.be.lessThanOrEqual(calculatedAmount + ALLOWED_PRECISION_LOSS)
            } else {
                expect(Number(amountTokens)).to.be.greaterThanOrEqual(calculatedAmount - ALLOWED_PRECISION_LOSS)
            }
        })

        it('amountRequired for 1000000 USD should be (1000000 tokens / price) (18 dec)', async() => {
            const { amountTokens, volatility } = await oracle.amountRequired(TOKEN_RENFIL, ONE_USD.mul(1000000))
            const price = await oracle.getThePrice(TOKEN_RENFIL)
            const calculatedAmount = Number(ONE_USD.mul(1000000)) / Number(price) * 10 ** 18;

            const ALLOWED_PRECISION_LOSS = Number(ALLOWED_PRECISION_LOSS_PER_TOKEN) * 1000000;

            if (Number(amountTokens) > calculatedAmount) {
                expect(Number(amountTokens)).to.be.lessThanOrEqual(calculatedAmount + ALLOWED_PRECISION_LOSS)
            } else {
                expect(Number(amountTokens)).to.be.greaterThanOrEqual(calculatedAmount - ALLOWED_PRECISION_LOSS)
            }
        })

        it('amountRequired for 1 USD should be (1 token / price) (6 dec)', async() => {
            const { amountTokens, volatility } = await oracle.amountRequired(TOKEN_USDT, ONE_USD)
            const price = await oracle.getThePrice(TOKEN_USDT)
            const calculatedAmount = Number(ONE_USD) / Number(price) * 10 ** 6;

            const ALLOWED_PRECISION_LOSS = Number(ALLOWED_PRECISION_LOSS_PER_TOKEN);

            if (Number(amountTokens) > calculatedAmount) {
                expect(Number(amountTokens)).to.be.lessThanOrEqual(calculatedAmount + ALLOWED_PRECISION_LOSS)
            } else {
                expect(Number(amountTokens)).to.be.greaterThanOrEqual(calculatedAmount - ALLOWED_PRECISION_LOSS)
            }
        })

        it('amountRequired for 1000 USD should be (1000 tokens / price) (6 dec)', async() => {
            const { amountTokens, volatility } = await oracle.amountRequired(TOKEN_USDT, ONE_USD.mul(1000))
            const price = await oracle.getThePrice(TOKEN_USDT)
            const calculatedAmount = Number(ONE_USD.mul(1000)) / Number(price) * 10 ** 6;

            const ALLOWED_PRECISION_LOSS = Number(ALLOWED_PRECISION_LOSS_PER_TOKEN) * 1000;

            if (Number(amountTokens) > calculatedAmount) {
                expect(Number(amountTokens)).to.be.lessThanOrEqual(calculatedAmount + ALLOWED_PRECISION_LOSS)
            } else {
                expect(Number(amountTokens)).to.be.greaterThanOrEqual(calculatedAmount - ALLOWED_PRECISION_LOSS)
            }
        })

        it('amountRequired for 1000000 USD should be (1000000 tokens / price) (6 dec)', async() => {
            const { amountTokens, volatility } = await oracle.amountRequired(TOKEN_USDT, ONE_USD.mul(1000000))
            const price = await oracle.getThePrice(TOKEN_USDT)
            const calculatedAmount = Number(ONE_USD.mul(1000000)) / Number(price) * 10 ** 6;

            const ALLOWED_PRECISION_LOSS = Number(ALLOWED_PRECISION_LOSS_PER_TOKEN) * 1000000;

            if (Number(amountTokens) > calculatedAmount) {
                expect(Number(amountTokens)).to.be.lessThanOrEqual(calculatedAmount + ALLOWED_PRECISION_LOSS)
            } else {
                expect(Number(amountTokens)).to.be.greaterThanOrEqual(calculatedAmount - ALLOWED_PRECISION_LOSS)
            }
        })

    })

    describe('Edge cases', async() => {
        it('valuating very small amounts - amountRequired (10**3 is a lower limit for 18 dec token)', async() => {
            const amount = 1000;
            const { amountTokens, volatility } = await oracle.amountRequired(TOKEN_RENFIL, amount)
            const price = await oracle.getThePrice(TOKEN_RENFIL)
            const calculatedAmount = Number(amount) / Number(price) * 10 ** 18;

            //console.log(amountTokens.toString());
            //console.log(calculatedAmount.toString());

            expect(Number(amountTokens)).to.be.greaterThan(0)
        })

        it('valuating very small amounts - read (no limit) (18 dec)', async() => {
            const amount = 1;
            const { amountUsd, volatility } = await oracle.read(TOKEN_RENFIL, amount)
            const price = await oracle.getThePrice(TOKEN_RENFIL)
            const calculatedAmount = Number(amount) * Number(price) / 10 ** 18;

            //console.log(amountUsd.toString());
            //console.log(calculatedAmount.toString());

            expect(Number(amountUsd)).to.be.greaterThan(0)

        })

        it('valuating very small amounts - amountRequired (10**13 is a lower limit for 6 dec token)', async() => {
            const amount = 10 ** 13;
            const { amountTokens, volatility } = await oracle.amountRequired(TOKEN_USDT, amount)
            const price = await oracle.getThePrice(TOKEN_USDT)
            const calculatedAmount = Number(amount) / Number(price) * 10 ** 6;

            //console.log(amountTokens.toString());
            //console.log(calculatedAmount.toString());

            expect(Number(amountTokens)).to.be.greaterThan(0)
        })

        it('valuating very small amounts - read (no limit) (6 dec)', async() => {
            const amount = 1;
            const { amountUsd, volatility } = await oracle.read(TOKEN_USDT, amount)
            const price = await oracle.getThePrice(TOKEN_USDT)
            const calculatedAmount = Number(amount) * Number(price) / 10 ** 6;

            //console.log(amountUsd.toString());
            //console.log(calculatedAmount.toString());

            expect(Number(amountUsd)).to.be.greaterThan(0)

        })

        it('valuating very large amounts - amountRequired (upper limit is between 10**50 and 10**60)', async() => {
            const msg = "VM Exception while processing transaction: revert SafeMath: multiplication overflow";

            let amount = getBigNumber(1,60);
            await truffleAssert.reverts(oracle.amountRequired(TOKEN_RENFIL, amount), msg);

            amount = getBigNumber(1,50);
            const { amountTokens, volatility } = await oracle.amountRequired(TOKEN_RENFIL, amount)

            const price = await oracle.getThePrice(TOKEN_RENFIL)
            const calculatedAmount = Number(amount) / Number(price) * 10 ** 18;

            //console.log(amountTokens.toString());
            //console.log(calculatedAmount.toString());

            expect(Number(amountTokens)).to.be.greaterThan(0)
        })

        it('valuating very large amounts - read (upper limit is between 10**50 and 10**60)', async() => {
            const msg = "VM Exception while processing transaction: revert SafeMath: multiplication overflow";

            let amount = getBigNumber(1,60);
            await truffleAssert.reverts(oracle.read(TOKEN_RENFIL, amount), msg);

            amount = getBigNumber(1,50);
            const { amountUsd, volatility } = await oracle.read(TOKEN_RENFIL, amount)

            const price = await oracle.getThePrice(TOKEN_RENFIL)
            const calculatedAmount = Number(amount) / Number(price) * 10 ** 18;

            //console.log(amountUsd.toString());
            //console.log(calculatedAmount.toString());

            expect(Number(amountUsd)).to.be.greaterThan(0)
        })

    })

})