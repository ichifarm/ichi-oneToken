const { ethers } = require("hardhat");

const
    MemberToken = artifacts.require("MemberToken"),
    CollateralToken = artifacts.require("CollateralToken");

module.exports = async () => {
    const [governance] = await ethers.getSigners();
    
    const memberToken = await MemberToken.new();
    MemberToken.setAsDeployed(memberToken);
    
    const collateralToken = await CollateralToken.new();
    CollateralToken.setAsDeployed(collateralToken);
    
    const balMT = await memberToken.balanceOf(governance.address);
    const balCT = await collateralToken.balanceOf(governance.address);

    // console.log("*************************************************************");
    // console.log("* memberToken:", memberToken.address, "bal:", balMT.toString(10));
    // console.log("* collateralToken:", collateralToken.address, "bal:", balCT.toString(10));
    // console.log("*************************************************************");

};
