const { getCurrentConfig } = require('../../src/deployConfigs')

module.exports = async function({ ethers: { getNamedSigner }, getNamedAccounts, deployments }) {
    const { get } = deployments
  
    const chainId = await getChainId()

    const
        version = await get('OneTokenV1'),
        oneBTC = await deployments.get("oneBTC")
    
    if (chainId != 31337) { //don't verify contract on localnet
        await hre.run("verify:verify", {
            address: oneBTC.address,
            contract: "contracts/OneTokenProxy.sol:OneTokenProxy",
            constructorArguments: [
                version.address,
                "0xd6686fed9958b0b60487d1d9eadd0badbf2021ae", // TODO this is the proxy admin address
                "0x"
            ],
        })
    }

}

module.exports.tags = ["wBTC.oneBTCVerify","verify", "polygon-verify"]
//
