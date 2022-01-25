import { network } from 'hardhat';
// example deploy of a oneToken from the factory

const configs = {
    1: {
        wBTC: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599"
    },
    137: {
        wBTC: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6"
    }
}

module.exports = async function({ ethers, getNamedAccounts, deployments }) {
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts

    const config = configs[network.config.chainId];

    const collateralToken = config.wBTC;
}

module.exports.tags = []
module.exports.dependencies = []

// only deploy on mainnet/polygon
module.exports.skip = async() =>
    ![1, 137].includes(network.config.chainId)
