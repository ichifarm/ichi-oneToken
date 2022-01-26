const { network } = require('hardhat')

const { getCurrentConfig } = require('../../scripts/deployConfigs')

module.exports = async function({ ethers: { getNamedSigner }, getNamedAccounts, deployments }) {
    const { deploy, execute } = deployments
  
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

    const 
        name = "Collateral Pegged Test Oracle"
        url = "ichi.org"

    const factory = await deployments.get("OneTokenFactory")
    const config = getCurrentConfig()

    const 
        //collateralToken = await deployments.get("Token6")
        Admin = await ethers.getContractFactory("OneTokenFactory")
        admin = Admin.attach(factory.address)

    const oracle = await deploy("ICHIPeggedOracle", {
        from: deployer,
        args: [factory.address, name, config.usdc],
        log: true
    })

    await execute(
        'OneTokenFactory',
        { from: deployer, log: true },
        'admitModule',
        oracle.address,
        moduleType.oracle,
        name,
        url
    )

    await execute(
        'OneTokenFactory',
        { from: deployer, log: true },
        'admitForeignToken',
        config.usdc,
        true,
        oracle.address
    )
}

module.exports.tags = ["ICHIPeggedOracle", "polygon"]
module.exports.dependencies = ["oneTokenFactory"]

module.exports.skip = () => ![137].includes(network.config.chainId)
