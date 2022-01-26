const { assert } = require("chai");
const { deployments } = require("hardhat");

describe("Polygon Fork Tests #polygon", () => {
    let oneBTC;

    const setupTests = deployments.createFixture(async({deployments}) => {
        await deployments.fixture(["oneBTC"]);
        oneBTC = deployments.get("oneBTC");
    })

    const forkPolygon = async function (block) {
        await network.provider.request({
            method: "hardhat_reset",
            params: [
            {
                forking: {
                jsonRpcUrl: process.env.POLYGON_ALCHEMY_API_ENDPOINT,
                blockNumber: block,
                },
            },
            ],
        });
    }

    const unfork = async function() {
        await network.provider.request({
            method: "hardhat_reset",
            params: [],
        });
    }

    before(async function() {
        await forkPolygon(24108240);
    })

    beforeEach(async function() {
        await setupTests();
    })

    after(async function() {
        await unfork()
    })

    it('test minting logic', async() => {
        // TODO
    })
})
