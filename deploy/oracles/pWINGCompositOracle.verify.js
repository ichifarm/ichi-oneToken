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
        name = 'TWAP pWING indexToken Uniswap (sushi) V2 24hr/1hr',
        tokenAddress = '0xDb0f18081b505A7DE20B18ac41856BCB4Ba86A1a',  //pWING indextoken
        WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        TWAP_oracle = '0x1d22Acb5d544f62be7E94202dac0474bbfD5bddE',
        chainlink_oracle = '0xa5DEc9155960C278773BAE4aef071379Ca0a890B'

    const
        factory = await deployments.get("OneTokenFactory")
        //oracle = await deployments.get("ICHICompositeOracle")
        oracle = '0xeA2bcBF64b046cC1aF11605e28b6Fa02ABd38505'
    
    if (chainId != 31337) { //don't verify contract on localnet
        await hre.run("verify:verify", {
            address: oracle,
            constructorArguments: [
                factory.address,
                name,
                tokenAddress,
                [tokenAddress,WETH],
                [TWAP_oracle, chainlink_oracle]

            ],
        })
    }

}

module.exports.tags = ["pWINGCompositeOracleVerify","verify"]
module.exports.dependencies = ["oneTokenFactory"]