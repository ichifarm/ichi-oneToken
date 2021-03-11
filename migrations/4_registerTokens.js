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


};
