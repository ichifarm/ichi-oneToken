const { network } = require('hardhat')

const { getCurrentConfig } = require('../../src/deployConfigs')

module.exports = async function({ ethers: { getNamedSigner }, getNamedAccounts, deployments }) {
    const { read, execute } = deployments
    const { deployer } = await getNamedAccounts()

    const config = getCurrentConfig()

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
module.exports.skip = () => ![137, 80001].includes(network.config.chainId)
