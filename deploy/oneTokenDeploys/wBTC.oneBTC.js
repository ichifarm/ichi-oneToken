const { ethers, network } = require('hardhat')

const { getCurrentConfig } = require('../../src/deployConfigs')

module.exports = async function({ ethers: { getNamedSigner }, getNamedAccounts, deployments }) {
    const { execute, get, getOrNull, save } = deployments
  
    const { deployer } = await getNamedAccounts()
  
    const config = getCurrentConfig()

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

    const version = await get('OneTokenV1')
    const controller = await get('NullController')
    const mintMaster = await get('Incremental')
    const oneTokenOracle = await get("ICHIPeggedOracle")
    const factory = await get('OneTokenFactory')
    const OneTokenProxy = await ethers.getContractFactory('OneTokenProxy')

    const existing = await getOrNull('oneBTC')

    if (!existing) {
        const usdOracle = await get('ChainlinkOracleUSD')

        // admit the token
        await execute(
            'OneTokenFactory',
            { from: deployer, log: true},
            'admitForeignToken',
            config.wbtc,
            false,
            usdOracle.address
        )

        // deploy one token
        const tx=await execute(
            'OneTokenFactory',
            { from: deployer, log: true},
            'deployOneTokenProxy',
            name,
            symbol,
            deployer, // TODO should we set this to governance right away?
            version.address,
            controller.address,
            mintMaster.address,
            oneTokenOracle.address,
            config.wbtc,
            config.usdc
        )


        let deployAbi = new ethers.utils.Interface([
            'event OneTokenDeployed(address sender, address newOneTokenProxy, string name, string symbol, address governance, address version, address controller, address mintMaster, address oneTokenOracle, address memberToken, address collateral)'
        ])
        let deployEvent = deployAbi.getEventTopic('OneTokenDeployed')

        const [log] = tx.logs.filter((l) => l.address == factory.address && l.topics[0] == deployEvent);
        const event = deployAbi.parseLog(log)


        console.log(event);
        console.log(OneTokenProxy.interface.format(ethers.utils.FormatTypes.json))
        await save('oneBTC', {address: event.args.newOneTokenProxy, abi: OneTokenProxy.interface})
    }



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
module.exports.dependencies = ["mintMasterIncremental", "nullController", "oneTokenFactory", "oneTokenV1", "oneBTCOracle", "oneTokenOracle", "chainlinkOracleUSD", "ICHIPeggedOracle"]

// deploy only on polygon
module.exports.skip = () => ![137].includes(network.config.chainId)
