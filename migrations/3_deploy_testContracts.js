const 
    MemberToken = artifacts.require("MemberToken"),
    CollateralToken = artifacts.require("CollateralToken");

var memberToken,
    collateralToken,
    balMT,
    balCT;

module.exports = async function (deployer, network, accounts) {
    
    let governance = accounts[0];

    await deployer.deploy(MemberToken);
    await deployer.deploy(CollateralToken);

    memberToken = await MemberToken.deployed();
    collateralToken = await CollateralToken.deployed();
    balMT = await memberToken.balanceOf(governance);
    balCT = await collateralToken.balanceOf(governance);

    console.log("*************************************************************");
    console.log("* memberToken:", memberToken.address, "bal:", balMT.toString(10));
    console.log("* collateralToken:", collateralToken.address, "bal:", balCT.toString(10));
    console.log("*************************************************************");

};
