const { network } = require('hardhat')
// example deploy of a oneToken from the factory

const configs = {
    137: {
        wbtc: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
        usdc: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
        governance: 'TODO'
    }
}

module.exports = async function({ ethers: { getNamedSigner }, getNamedAccounts, deployments }) {
    const { deploy, execute } = deployments
  
    const { deployer, dev } = await getNamedAccounts()
  
    const chainId = await getChainId()

    const config = configs[network.config.chainId];

    const moduleType = {
        version: 0,
        controller: 1,
        strategy: 2,
        mintMaster: 3,
        oracle: 4,
        voterRoll: 5
    }

    const 
        name = "oneBTC"
        url = "ichi.org"
        symbol = "oneBTC"

    const version = await deployments.get('OneTokenV1')
    const controller = await deployments.get('NullController')
    const factory = await deployments.get('OneTokenFactory')
    const mintMaster = await deployments.get('Incremental')
    const oneTokenOracle = await deployments.get("ICHIPeggedOracle")

    execute(
        factory,
        'deployOneTokenProxy',
        { from: deployer, log: true},
        name,
        symbol,
        config.governance,
        version.address,
        controller.address,
        mintMaster.address,
        oneTokenOracle.address,
        config.wbtc,
        config.usdc
    )


    console.log('*************************************************************')
    console.log('admit memberToken: admitForeignToken')
    console.log('foreignToken (address): ', config.wbtc)
    console.log('collateral (bool): false')
    console.log('*************************************************************')

    console.log('*************************************************************')
    console.log('admit collateralToken: admitForeignToken')
    console.log('foreignToken (address): ',)
    console.log('collateral (bool): true')
    console.log('*************************************************************')
    

    console.log('*************************************************************')
    console.log('deployOneTokenProxy: ')
    console.log('name (string): ',name)
    console.log('symbol (string): ',symbol)
    console.log('governance (address): ',config.governance)
    console.log('version (address): ',version.address)
    console.log('controller (address): ',controller.address)
    console.log('mintMaster (address): ',mintMaster.address)
    console.log('oneTokenOracle (address): ',oneTokenOracle.address)
    console.log('memberToken (address): ',config.wbtc)
    console.log('collateral (address): ',config.usdc)

    console.log('*************************************************************')
}

module.exports.tags = ["oneBTC","polygon"]
module.exports.dependencies = ["mintMasterIncremental", "nullController", "oneTokenFactory", "oneTokenV1", "oneBTCOracle"]

// deploy only on polygon
module.exports.skip = () => ![137].includes(network.config.chainId)
