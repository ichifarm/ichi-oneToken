const { factory } = require("typescript")

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

    const 
        name = 'TWAP FOX indexToken Uniswap V2 24hr/1hr',
        url = 'https://v2.info.uniswap.org/home'
       
    let token,
        admin,
        oracle

    if (chainId == 1) {
        const tokenAddress = '0xc770EEfAd204B5180dF6a14Ee197D99d808ee52d'  //FOX indextoken
        const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
        const TWAP_oracle = '0x0c07115E9cB4761b7e1246d42A2A6c0a8EDaA859'
        const chainlink_oracle = '0xa5DEc9155960C278773BAE4aef071379Ca0a890B'
        
        const factory = await deployments.get("OneTokenFactory")

        oracle = await deploy('ICHICompositeOracle', {
            from: deployer,
            args: [factory.address, name , tokenAddress,[tokenAddress, WETH],[TWAP_oracle, chainlink_oracle ]],  
            log: true
        })
        console.log('*************************************************************')
        console.log('admitModule')
        console.log('module (address): ',oracle.address)
        console.log('moduleType (uint8): ',moduleType.oracle)
        console.log('name (string): ',name)
        console.log('url (string): ',url)
        console.log('*************************************************************')
    } else {
        const tokenAddress = '0xc770EEfAd204B5180dF6a14Ee197D99d808ee52d'  //FOX indextoken
        const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
        const TWAP_oracle = '0x0c07115E9cB4761b7e1246d42A2A6c0a8EDaA859'
        const chainlink_oracle = '0xa5DEc9155960C278773BAE4aef071379Ca0a890B'
        
        const factory = await deployments.get("OneTokenFactory")

        oracle = await deploy('ICHICompositeOracle', {
            from: deployer,
            args: [factory.address, name , tokenAddress,[tokenAddress, WETH],[TWAP_oracle, chainlink_oracle ]],  
            log: true
        })

        console.log('PERLCompositeOracle: ',oracle.address)
    }

    
    

}

module.exports.tags = ["FOXCompositeOracle"]
module.exports.dependencies = ["oneTokenFactory"]