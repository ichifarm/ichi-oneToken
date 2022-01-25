const { network } = require('hardhat')

const configs = {
    137: {
        wbtc: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
        wbtcUsdChainlinkOracle: '0xDE31F8bFBD8c84b5360CFACCa3539B938dd78ae6',
    }
}

module.exports = async function({ ethers: { getNamedSigner }, getNamedAccounts, deployments }) {
    const { read, execute } = deployments
    const { deployer } = await getNamedAccounts()

    const config = configs[network.config.chainId];

    try  {
        await read('ChainlinkOracleUSD', 'getThePrice', config.wbtc);
    } catch(err) {
        // exception means price feed not yet registered

        await execute(
            'ChainlinkOracleUSD',
            { from: deployer, log: true },
            'registerOracle',
            config.wbtc,
            config.wbtcUsdChainlinkOracle
        )
    }
}

module.exports.tags = ["oneBTCOracle","polygon"]
module.exports.dependencies = ["chainlinkOracleUSD"]

// deploy only on polygon
module.exports.skip = () => ![137].includes(network.config.chainId)
