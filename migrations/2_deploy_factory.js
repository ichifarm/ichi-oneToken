const 
    Factory = artifacts.require("OneTokenFactory"),
    OneToken = artifacts.require("OneTokenV1"),
    ProxyAdmin = artifacts.require("OneTokenProxyAdmin"),
    ControllerNull = artifacts.require("NullController"),
    OraclePegged = artifacts.require("ICHIPeggedOracle"),
    OracleUniswapSimple = artifacts.require("UniswapOracleSimple"),
    StrategyArbitrary = artifacts.require("Arbitrary"),
    StrategyNull = artifacts.require("NullStrategy"),
    MintMasterIncremental = artifacts.require("Incremental");

var factory,
    implementation,
    proxyAdmin,
    controllerNull;

module.exports = async function (deployer, network, accounts) {
    
    await deployer.deploy(Factory);
    await deployer.deploy(OneToken);
    await deployer.deploy(ProxyAdmin);
    await deployer.deploy(ControllerNull);

    factory = await Factory.deployed();
    implementation = await OneToken.deployed();
    proxyAdmin = await ProxyAdmin.deployed();
    controllerNull = await ControllerNull.deployed();

    console.log("*************************************************************");
    console.log("* factory:", factory.address);
    console.log("* implementation:", implementation.address);
    console.log("* proxyAdmin:", proxyAdmin.address);
    console.log("* controller, null:", controllerNull.address);
    console.log("*************************************************************");

};
