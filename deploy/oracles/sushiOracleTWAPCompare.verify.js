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
        WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        sushi_hash = '0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303',
        uniFactory = '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac' 

    const
        factory = await deployments.get("OneTokenFactory")
        //oracle = await deployments.get("ICHICompositeOracle")
        oracle = '0x1d22Acb5d544f62be7E94202dac0474bbfD5bddE'
    
    if (chainId != 31337) { //don't verify contract on localnet
        await hre.run("verify:verify", {
            address: oracle,
            constructorArguments: [
                factory.address,
                uniFactory,
                WETH,
                3600,
                86400,
                sushi_hash
            ],
        })
    }

}

module.exports.tags = ["SushiOracleTWAPCompareVerify","verify"]
module.exports.dependencies = ["oneTokenFactory"]