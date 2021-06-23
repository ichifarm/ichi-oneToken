// example deploy of a oneToken from the factory

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
        name = "oneFIL"
        url = "ichi.org"
        symbol = "oneFIL",
        versionName = "OneTokenV1"

    let collateralTokenAddress,
        memberTokenAddress,
        controllerAddress,
        mintMasterAddress,
        oneTokenOracleAddress,
        memberOracleAddress,
        oneTokenV1Address,
        governaceAddress


    if (chainId == 42) { 
        
            const memberToken = await deployments.get("RenFILMockToken")
            memberTokenAddress = memberToken.address

            collateralTokenAddress = '0x21632981cBf52eB788171e8dcB891C32F4834239'
           
            const memberOracle = await deployments.get("RenFILOracle")
            memberOracleAddress = memberOracle.address

            
            const oneTokenV1 = await deployments.get("OneTokenV1")
            oneTokenV1Address = oneTokenV1.address

            const controllerNull = await deployments.get("NullController")
            controllerAddress = controllerNull.address

            const mintMasterIncremental = await deployments.get("Incremental")
            mintMasterAddress = mintMasterIncremental.address

            const oneTokenOracle = await deployments.get("ICHIPeggedOracle")
            oneTokenOracleAddress = oneTokenOracle.address
       
            governaceAddress = '0x451Efff92a3a1471b7af9DDc1369D9D157E6475A'


           

        
    } else if (chainId == 1) {
        
            memberTokenAddress =  '0xD5147bc8e386d91Cc5DBE72099DAC6C9b99276F5'

            collateralTokenAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
           
            const memberOracle = await deployments.get("RenFILOracle")
            memberOracleAddress = memberOracle.address

            
            const oneTokenV1 = await deployments.get("OneTokenV1")
            oneTokenV1Address = oneTokenV1.address

            const controllerNull = await deployments.get("NullController")
            controllerAddress = controllerNull.address

            const mintMasterIncremental = await deployments.get("Incremental")
            mintMasterAddress = mintMasterIncremental.address

            const oneTokenOracle = await deployments.get("ICHIPeggedOracle")
            oneTokenOracleAddress = oneTokenOracle.address
       
            governaceAddress = '0x321e897eb342AE8a92310fa9BAD4de9d3140a8bb'
    }

    console.log('*************************************************************')
    console.log('admit memberToken: admitForeignToken')
    console.log('foreignToken (address): ',memberTokenAddress)
    console.log('collateral (bool): false')
    console.log('oracle (address): ',memberOracleAddress)
    console.log('*************************************************************')

    console.log('*************************************************************')
    console.log('admit collateralToken: admitForeignToken')
    console.log('foreignToken (address): ',)
    console.log('collateral (bool): true')
    console.log('oracle (address): ',)
    console.log('*************************************************************')
    

    console.log('*************************************************************')
    console.log('deployOneTokenProxy: ')
    console.log('name (string): ',name)
    console.log('symbol (string): ',symbol)
    console.log('governance (address): ',governaceAddress)
    console.log('version (address): ',oneTokenV1Address)
    console.log('controller (address): ',controllerAddress)
    console.log('mintMaster (address): ',mintMasterAddress)
    console.log('oneTokenOracle (address): ',oneTokenOracleAddress)
    console.log('memberToken (address): ',memberTokenAddress)
    console.log('collateral (address): ',collateralTokenAddress)

    console.log('*************************************************************')
}

module.exports.tags = ["oneFIL",]
//module.exports.dependencies = ["oneTokenFactory","nullController","mintMasterIncremental","renFILOracle"]