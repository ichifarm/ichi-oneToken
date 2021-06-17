const { expect, assert } = require("chai");
const { ethers, artifacts } = require("hardhat");
const truffleAssert = require('truffle-assertions');
const { getBigNumber } = require("./utilities");

const Factory = artifacts.require("OneTokenFactory");
const oracleFactory = artifacts.require("RenFILOracle");

const ONE_USD = getBigNumber(1,18);
const ONE_renFIL = getBigNumber(1,18);
const ALLOWED_PRECISION_LOSS_PER_TOKEN = getBigNumber(1,4);

const memberToken = '0xD5147bc8e386d91Cc5DBE72099DAC6C9b99276F5'

contract('RenFILOracle', () => {
    let oracle, 
        factory

    beforeEach(async () => {
        
        // 1
       // const [deployer, user] = await ethers.getSigners()

        // 2

        factory = await Factory.deployed();
        oracle = await oracleFactory.deployed();
       // const factoryFactory = await ethers.getContractFactory('OneTokenFactory')
        //factory = await factoryFactory.deploy()
        

        //const oracleFactory = await ethers.getContractFactory('RenFILOracle')
    
        //oracle = await oracleFactory.deploy(factory.address, name, memberToken, mainnet_chainlink)
      
       // await oracle.deployed()
       
        // 3
        //await factory.admitModule(oracle.address, moduleType.oracle, name, url)

    })

    describe('Return Values', async() => {
        it('getPrice should be greater than 1', async() => {
            const price = await oracle.getThePrice()
            assert.isTrue(Number(price) > 1);
        })

        it('read should return value of the token in USD for 1 token', async() => {
            const { amountUsd, volatility } = await oracle.read(memberToken, ONE_renFIL)
            const price = await oracle.getThePrice()
            assert.isTrue(Number(price) == Number(amountUsd));
        })

        it('read should return value of the token in USD for 100 tokens', async() => {
            const { amountUsd, volatility } = await oracle.read(memberToken, ONE_renFIL.mul(100))
            const price = await oracle.getThePrice();
            const calculatedAmount = Number(price) * 100;
            //assert.isTrue(Number(price) * 100 == Number(amountUsd));
            expect(Number(amountUsd)).to.equal(calculatedAmount)
        })

        it('read should return value of the token in USD for 100000 tokens', async() => {
            const { amountUsd, volatility } = await oracle.read(memberToken, ONE_renFIL.mul(100000))
            const price = await oracle.getThePrice();
            const calculatedAmount = Number(price) * 100000;

            const ALLOWED_PRECISION_LOSS = Number(ALLOWED_PRECISION_LOSS_PER_TOKEN) * 100000;

            if (Number(amountUsd) > calculatedAmount) {
                expect(Number(amountUsd)).to.be.lessThanOrEqual(calculatedAmount + ALLOWED_PRECISION_LOSS)
            } else {
                expect(Number(amountUsd)).to.be.greaterThanOrEqual(calculatedAmount - ALLOWED_PRECISION_LOSS)
            }
        })

        it('amountRequired for 1 USD should be (1 token / price)', async() => {
            const { amountTokens, volatility } = await oracle.amountRequired(memberToken, ONE_USD)
            const price = await oracle.getThePrice()
            const calculatedAmount = Number(ONE_USD) / Number(price) * 10 ** 18;
            expect(Number(amountTokens)).to.equal(calculatedAmount)
        })

        it('amountRequired for 1000 USD should be (1000 tokens / price)', async() => {
            const { amountTokens, volatility } = await oracle.amountRequired(memberToken, ONE_USD.mul(1000))
            const price = await oracle.getThePrice()
            const calculatedAmount = Number(ONE_USD.mul(1000)) / Number(price) * 10 ** 18;

            const ALLOWED_PRECISION_LOSS = Number(ALLOWED_PRECISION_LOSS_PER_TOKEN) * 1000;

            //console.log(amountTokens.toString());
            //console.log(calculatedAmount.toString());
            if (Number(amountTokens) > calculatedAmount) {
                expect(Number(amountTokens)).to.be.lessThanOrEqual(calculatedAmount + ALLOWED_PRECISION_LOSS)
            } else {
                expect(Number(amountTokens)).to.be.greaterThanOrEqual(calculatedAmount - ALLOWED_PRECISION_LOSS)
            }
        })

        it('amountRequired for 1000000 USD should be (1000000 tokens / price)', async() => {
            const { amountTokens, volatility } = await oracle.amountRequired(memberToken, ONE_USD.mul(1000000))
            const price = await oracle.getThePrice()
            const calculatedAmount = Number(ONE_USD.mul(1000000)) / Number(price) * 10 ** 18;

            const ALLOWED_PRECISION_LOSS = Number(ALLOWED_PRECISION_LOSS_PER_TOKEN) * 1000000;

            //console.log(amountTokens.toString());
            //console.log(calculatedAmount.toString());
            if (Number(amountTokens) > calculatedAmount) {
                expect(Number(amountTokens)).to.be.lessThanOrEqual(calculatedAmount + ALLOWED_PRECISION_LOSS)
            } else {
                expect(Number(amountTokens)).to.be.greaterThanOrEqual(calculatedAmount - ALLOWED_PRECISION_LOSS)
            }
        })
    })

    describe('Limited discrepancies from precision loss', async() => {
        it('discrepacy should not exceed 1 cent when valuating $1B', async() => {
            const ONE_BILLION = ONE_USD.mul(1000000000);
            const { amountTokens, volatility } = await oracle.amountRequired(memberToken, ONE_BILLION)
            const price = await oracle.getThePrice()
            const calculatedAmount = Number(ONE_BILLION) / Number(price) * 10 ** 18;

            const ALLOWED_PRECISION_LOSS = Number(ONE_USD) / 100;

            if (Number(amountTokens) > calculatedAmount) {
                expect(Number(amountTokens)).to.be.lessThanOrEqual(calculatedAmount + ALLOWED_PRECISION_LOSS)
            } else {
                expect(Number(amountTokens)).to.be.greaterThanOrEqual(calculatedAmount - ALLOWED_PRECISION_LOSS)
            }
        })

        it('discrepacy should not exceed 1 cent when valuating $1T', async() => {
            const ONE_TRILLION = ONE_USD.mul(1000000000000);
            const { amountTokens, volatility } = await oracle.amountRequired(memberToken, ONE_TRILLION)
            const price = await oracle.getThePrice()
            const calculatedAmount = Number(ONE_TRILLION) / Number(price) * 10 ** 18;

            const ALLOWED_PRECISION_LOSS = Number(ONE_USD) / 100;

            if (Number(amountTokens) > calculatedAmount) {
                expect(Number(amountTokens)).to.be.lessThanOrEqual(calculatedAmount + ALLOWED_PRECISION_LOSS)
            } else {
                expect(Number(amountTokens)).to.be.greaterThanOrEqual(calculatedAmount - ALLOWED_PRECISION_LOSS)
            }
        })
    })

    describe('Edge cases', async() => {
        it('valuating very small amounts - amountRequired (10**3 is a lower limit for renFIL)', async() => {
            const amount = 1000;
            const { amountTokens, volatility } = await oracle.amountRequired(memberToken, amount)
            const price = await oracle.getThePrice()
            const calculatedAmount = Number(amount) / Number(price) * 10 ** 18;

            //console.log(amountTokens.toString());
            //console.log(calculatedAmount.toString());

            expect(Number(amountTokens)).to.be.greaterThan(0)
        })

        it('valuating very small amounts - read (no limit)', async() => {
            const amount = 1;
            const { amountUsd, volatility } = await oracle.read(memberToken, amount)
            const price = await oracle.getThePrice()
            const calculatedAmount = Number(amount) * Number(price) / 10 ** 18;

            //console.log(amountUsd.toString());
            //console.log(calculatedAmount.toString());

            expect(Number(amountUsd)).to.be.greaterThan(0)

        })

        it('valuating very large amounts - amountRequired (10**59 is an upper limit for renFIL)', async() => {
            const msg = "VM Exception while processing transaction: revert SafeMath: multiplication overflow";

            let amount = getBigNumber(1,60);
            await truffleAssert.reverts(oracle.amountRequired(memberToken, amount), msg);

            amount = getBigNumber(1,59);
            const { amountTokens, volatility } = await oracle.amountRequired(memberToken, amount)

            const price = await oracle.getThePrice()
            const calculatedAmount = Number(amount) / Number(price) * 10 ** 18;

            //console.log(amountTokens.toString());
            //console.log(calculatedAmount.toString());

            expect(Number(amountTokens)).to.be.greaterThan(0)
        })

        it('valuating very large amounts - read (10**57 is an upper limit for renFIL)', async() => {
            const msg = "VM Exception while processing transaction: revert SafeMath: multiplication overflow";

            let amount = getBigNumber(1,58);
            await truffleAssert.reverts(oracle.read(memberToken, amount), msg);

            amount = getBigNumber(1,57);
            const { amountUsd, volatility } = await oracle.read(memberToken, amount)

            const price = await oracle.getThePrice()
            const calculatedAmount = Number(amount) / Number(price) * 10 ** 18;

            //console.log(amountUsd.toString());
            //console.log(calculatedAmount.toString());

            expect(Number(amountUsd)).to.be.greaterThan(0)
        })

    })

})