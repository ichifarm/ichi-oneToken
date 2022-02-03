const { network } = require('hardhat')

const { getCurrentConfig } = require('../../src/deployConfigs')

module.exports = async function({ getNamedAccounts, deployments }) {
    const { deploy, execute, get, read } = deployments
  
    const { deployer } = await getNamedAccounts()

    const moduleType = {
        version: 0,
        controller: 1,
        strategy: 2,
        mintMaster: 3,
        oracle: 4,
        voterRoll: 5
    }

    const 
        name = 'Chainlink Oracle USD',
        url = 'https://data.chain.link/?search=USD'

    const config = getCurrentConfig()

    const factory = await get("OneTokenFactory")

    const oracle = await deploy('ChainlinkOracleUSD', {
        from: deployer,
        args: [factory.address, name, config.usdc],  
        log: true
    })

    const alreadyAdmited = await read('OneTokenFactory', 'isModule', oracle.address);

    if(!alreadyAdmited) {
        // admit oracle
        await execute(
            'OneTokenFactory',
            { from: deployer, log: true },
            'admitModule',
            oracle.address,
            moduleType.oracle,
            name,
            url
        )
    }
}

module.exports.tags = ["chainlinkOracleUSD", "polygon"]
module.exports.dependencies = ["oneTokenFactory"]