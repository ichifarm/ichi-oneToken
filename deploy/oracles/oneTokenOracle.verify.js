const { network } = require('hardhat')

const { getCurrentConfig } = require('../../src/deployConfigs')

module.exports = async function({ ethers: { getNamedSigner }, getNamedAccounts, deployments }) {
    const { get } = deployments

    const 
        name = "Collateral Pegged Oracle"
        url = "ichi.org"

    const factory = await get("OneTokenFactory")
    const config = getCurrentConfig()

    const 
        //collateralToken = await deployments.get("Token6")
        Admin = await ethers.getContractFactory("OneTokenFactory")
        admin = Admin.attach(factory.address)

    const oracle = await get("ICHIPeggedOracle");

    await hre.run("verify:verify", {
        address: oracle.address,
        constructorArguments: [
            factory.address,
            name,
            config.usdc
        ],
    })
}

module.exports.tags = ["oneTokenOracleVerify", "verify"]
module.exports.dependencies = ["oneTokenFactory"]

module.exports.skip = () => ![137].includes(network.config.chainId)
