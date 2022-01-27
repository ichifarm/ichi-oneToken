const { getCurrentConfig } = require('../src/deployConfigs')

module.exports = async function({ getNamedAccounts, deployments }) {
    const { deploy, execute } = deployments
    const { deployer } = await getNamedAccounts()
    const config = getCurrentConfig();
  
    await deploy("OneTokenFactory", {
        from: deployer,
        log: true,
        deterministicDeployment: false
    })
}

module.exports.tags = ["oneTokenFactory","init","polygon"]