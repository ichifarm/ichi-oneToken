const chai = require("chai");
const { ethers, deployments } = require("hardhat");
const { solidity } = require('ethereum-waffle');

const { forkPolygon, unfork, mintToken, impersonate, setBalance } = require('./shared/forkHelpers');

chai.use(solidity);

const { parseUnits } = ethers.utils;
const { expect } = chai;

describe("Polygon Fork Tests #polygon", () => {
    const USDC_ADDR = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
    const WBTC_ADDR = "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6"

    let owner;
    let user;
    let governance;
    let governanceAddress;
    let oneBTC;
    let mintMaster;

    let usdc;
    let wbtc;

    const setupTests = deployments.createFixture(async({deployments}) => {
        await deployments.fixture(["oneBTC"]);
        const oneBTCDeployment = await deployments.get("oneBTC");
        oneBTC = await ethers.getContractAt("OneTokenV1", oneBTCDeployment.address);

        const mintMasterDeployment = await deployments.get("Incremental");
        mintMaster = await ethers.getContractAt("Incremental", mintMasterDeployment.address)

        governanceAddress = await oneBTC.owner();
        await impersonate([governanceAddress]);
    })

    before(async function() {
        await forkPolygon(24108240);
    })

    beforeEach(async function() {
        await setupTests();
        [owner, user] = await ethers.getSigners();
        governance = await ethers.getSigner(governanceAddress)
        await setBalance(governance.address, parseUnits("1000"));

        usdc = await ethers.getContractAt("IERC20", USDC_ADDR);
        wbtc = await ethers.getContractAt("IERC20", WBTC_ADDR);

        await usdc.connect(user).approve(oneBTC.address, ethers.constants.MaxUint256);
        await wbtc.connect(user).approve(oneBTC.address, ethers.constants.MaxUint256);

        // start with 100k USDC and 100 wBTC
        await mintToken(usdc, user, parseUnits("100000", 6))
        await mintToken(wbtc, user, parseUnits("100", 8))

        await mintMaster.connect(governance).setMinRatio(oneBTC.address, 0);
    })

    after(async function() {
        await unfork()
    })

    async function checkUserBalancesDelta(user, action, deltas) {
        const usdcBefore = await usdc.balanceOf(user.address);
        const wbtcBefore = await wbtc.balanceOf(user.address);
        const oneBTCBefore = await oneBTC.balanceOf(user.address);

        await action();

        const usdcAfter = await usdc.balanceOf(user.address);
        const wbtcAfter = await wbtc.balanceOf(user.address);
        const oneBTCAfter = await oneBTC.balanceOf(user.address);

        expect(oneBTCAfter).to.equal(oneBTCBefore.add(deltas.oneBTC));
        expect(usdcAfter).to.equal(usdcBefore.add(deltas.usdc));

        // compare wbtc, but allow for a of 0.001 deviation
        expect(wbtcAfter).to.be.closeTo(wbtcBefore.add(deltas.wbtc), parseUnits("0.001", 8));
    }

    describe('mintint logic', () => {
        it('with ratio of 100%', async() => {
            const amount = parseUnits("1000");
            const expectedUsdcDelta = parseUnits("-1000", 6);
            const expectedWbtcDelta = parseUnits("0", 8);
            const ratio100 = parseUnits("1")
            await mintMaster.connect(governance).setRatio(oneBTC.address, ratio100);

            const action = () => oneBTC.connect(user).mint(usdc.address, amount)

            await checkUserBalancesDelta(user, action, { oneBTC: parseUnits("1000"), usdc: expectedUsdcDelta, wbtc: expectedWbtcDelta});
        })

        it('with ratio of 20%', async() => {
            const amount = parseUnits("1000");
            const expectedUsdcDelta = parseUnits("-200", 6);
            // 0.025 BTC is roughly 800 USD at this block
            const expectedWbtcDelta = parseUnits("-0.025", 8);
            const ratio100 = parseUnits("1").mul("20").div("100")
            await mintMaster.connect(governance).setRatio(oneBTC.address, ratio100);

            const action = () => oneBTC.connect(user).mint(usdc.address, amount)

            await checkUserBalancesDelta(user, action, { oneBTC: parseUnits("1000"), usdc: expectedUsdcDelta, wbtc: expectedWbtcDelta});
        })
    });

    describe('redeem', () => {
        it('gets back correct amount of collateral', async () => {
            // first mint 2000$ worth of oneBTC
            await oneBTC.connect(user).mint(usdc.address, parseUnits('2000'))

            // now change ratio to 20%
            const ratio100 = parseUnits("1")
            await mintMaster.connect(governance).setRatio(oneBTC.address, ratio100);

            // and now redeem 1000$ oneBTC back for USDC
            const action = () => oneBTC.connect(user).redeem(usdc.address, parseUnits("1000"));

            await checkUserBalancesDelta(user, action, { oneBTC: parseUnits("-1000"), usdc: parseUnits("1000", 6), wbtc: "0"});
        });
        
    });
})
