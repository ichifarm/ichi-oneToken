const { getCurrentConfig } = require('../../src/deployConfigs')

module.exports = async function({ ethers: { getNamedSigner }, getNamedAccounts, deployments }) {
    const { deploy } = deployments
  
    const { deployer, dev } = await getNamedAccounts()
  
    const chainId = await getChainId()

    const moduleType = {
        version: 0,
        controller: 1,
        strategy: 2,
        mintMaster: 3,
        oracle: 4,
        voterRoll: 5
    }

    const name = 'Chainlink Oracle USD';

    const config = getCurrentConfig();

    const
        factory = await deployments.get("OneTokenFactory")
        oracle = await deployments.get("ChainlinkOracleUSD")
    
    if (chainId != 31337) { //don't verify contract on localnet
        await hre.run("verify:verify", {
            address: oracle.address,
            constructorArguments: [
                factory.address,
                name,
                config.usdc
            ],
        })
    }

}

module.exports.tags = ["chainlinkOracleUSDVerify","verify", "polygon-verify"]
//
