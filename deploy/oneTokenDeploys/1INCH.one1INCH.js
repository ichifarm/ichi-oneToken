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
        name = "one1INCH"
        url = "ichi.org"
        symbol = "one1INCH",
        versionName = "OneTokenV1"

    let collateralTokenAddress,
        memberTokenAddress,
        controllerAddress,
        mintMasterAddress,
        oneTokenOracleAddress,
        memberOracleAddress,
        oneTokenV1Address,
        governaceAddress


    if (chainId == 1) {
        
            memberTokenAddress =  '0x111111111117dC0aa78b770fA6A738034120C302'  //1INCH

            collateralTokenAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' //USDC
           
            const memberOracle = await deployments.get("OneINCHOracle")
            memberOracleAddress = memberOracle.address

            
            const oneTokenV1 = await deployments.get("OneTokenV1")
            oneTokenV1Address = oneTokenV1.address

            const controllerNull = await deployments.get("NullController")
            controllerAddress = controllerNull.address

            const mintMasterIncremental = await deployments.get("Incremental")
            mintMasterAddress = mintMasterIncremental.address

            //const oneTokenOracle = await deployments.get("ICHIPeggedOracle")
            oneTokenOracleAddress = '0xEB72170F2D01C779217109CabAcD1d59Bb8973c2'
       
            governaceAddress = '0xCB472D6Ef9592594b8cd3016517C6Df677cf421b'
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

module.exports.tags = ["one1INCH",]
//module.exports.dependencies = ["oneTokenFactory","nullController","mintMasterIncremental","renFILOracle"]