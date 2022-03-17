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
        name = 'TWAP OJA indexToken Uniswap (sushi) V2 24hr/1hr',
        tokenAddress = '0x0aA7eFE4945Db24d95cA6E117BBa65Ed326e291A',  //MPH indextoken
        WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        TWAP_oracle = '0x1d22Acb5d544f62be7E94202dac0474bbfD5bddE',
        chainlink_oracle = '0xa5DEc9155960C278773BAE4aef071379Ca0a890B'

    const
        factory = await deployments.get("OneTokenFactory")
        //oracle = await deployments.get("ICHICompositeOracle")
        oracle = '0x0220864A5C899B0848a5797ca84B34CC494293cA'
    
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

module.exports.tags = ["OJACompositeOracleVerify","verify"]
module.exports.dependencies = ["oneTokenFactory"]