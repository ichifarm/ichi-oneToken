const
    Factory = artifacts.require("OneTokenFactory"),
    OneToken = artifacts.require("OneTokenV1"),
    ProxyAdmin = artifacts.require("OneTokenProxyAdmin"),
    ControllerNull = artifacts.require("NullController"),
    MintMasterIncremental = artifacts.require("Incremental"),
    mintMasterDesc = "Basic Incremental MintMaster";

module.exports = async () => {
    const factory  = await Factory.new();
    const oneToken  = await OneToken.new();
    const proxyAdmin  = await ProxyAdmin.new();
    const controllerNull  = await ControllerNull.new();
    const mintMasterIncremental  = await MintMasterIncremental.new(mintMasterDesc);

    Factory.setAsDeployed(factory);
    OneToken.setAsDeployed(oneToken);
    ProxyAdmin.setAsDeployed(proxyAdmin);
    ControllerNull.setAsDeployed(controllerNull);
    MintMasterIncremental.setAsDeployed(mintMasterIncremental);

    // console.log("*************************************************************");
    // console.log("* factory:", factory.address);
    // console.log("* implementation:", oneToken.address);
    // console.log("* proxyAdmin:", proxyAdmin.address);
    // console.log("* controllerNull:", controllerNull.address);
    // console.log("* mintmaster:", mintMasterIncremental.address);
    // console.log("*************************************************************");

};
