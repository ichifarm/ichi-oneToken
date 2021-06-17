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
        name = "Pegged Oracle indexToken USDC"
        url = "ichi.org"

    let USDCAddress

    if (chainId == 1) {
        USDCAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
    } else if(chainId == 42) {
        USDCAddress = '0x21632981cBf52eB788171e8dcB891C32F4834239'
    } else { 
        const token6 = await deploy("Token6", {
            from: deployer,
            log: false
        })
        USDCAddress = token6.address
    }
    const 
        factory = await deployments.get("OneTokenFactory")
        Admin = await ethers.getContractFactory("OneTokenFactory")
        admin = Admin.attach(factory.address)

    const oracle = await deploy("ICHIPeggedOracle", {
        from: deployer,
        args: [factory.address, name, USDCAddress],
        log: true
    })


    console.log("*************************************************************")
            console.log("run admitModule")
            console.log("1: "+oracle.address)
            console.log("2: "+moduleType.oracle)
            console.log("3: "+name)
            console.log("4: "+url)
    console.log("*************************************************************")
    
    

}

module.exports.tags = ["USDCindexOracle"]
module.exports.dependencies = ["oneTokenFactory"]