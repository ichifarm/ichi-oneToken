const { network } = require('hardhat')

module.exports = async function({ ethers: { getNamedSigner }, getNamedAccounts, deployments }) {
    const { deploy } = deployments
  
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
        name = 'Treasury Strategy - one1INCH', 
        description = 'Treasury Strategy - one1INCH',
        url = 'ichi.org'

    const token = await deployments.get('oneBTC')
    const factory = await deployments.get("OneTokenFactory")

    const strategy = await deploy('oneBTCArbitrary', {
        from: deployer,
        contract: 'Arbitrary',
        args: [factory.address, token.address, description],  
        log: true
    })
    console.log('*************************************************************')
    console.log('admitModule')
    console.log('module (address): ',strategy.address)
    console.log('moduleType (uint8): ',moduleType.strategy)
    console.log('name (string): ',name)
    console.log('url (string): ',url)
    console.log('*************************************************************')
}

module.exports.tags = ["oneBTCStrategy","polygon"]
module.exports.dependencies = ["oneTokenFactory", "oneBTC"]

module.exports.skip = () => ![137, 80001].includes(network.config.chainId)
