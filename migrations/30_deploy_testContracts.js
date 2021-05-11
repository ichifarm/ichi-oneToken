const { ethers } = require("hardhat");

const
    MemberToken = artifacts.require("MemberToken"),
    CollateralToken = artifacts.require("CollateralToken"),
    Token6 = artifacts.require("Token6"),
    Token9 = artifacts.require("Token9");
    Token18 = artifacts.require("Token18");

module.exports = async () => {
    const [governance] = await ethers.getSigners();
    
    const memberToken = await MemberToken.new();
    MemberToken.setAsDeployed(memberToken);
    
    const collateralToken = await CollateralToken.new();
    CollateralToken.setAsDeployed(collateralToken);
    
    const token6 = await Token6.new();
    Token6.setAsDeployed(token6);
    
    const token9 = await Token9.new();
    Token9.setAsDeployed(token9);

    const token18 = await Token18.new();
    Token18.setAsDeployed(token18);

    const balMT = await memberToken.balanceOf(governance.address);
    const balCT = await collateralToken.balanceOf(governance.address);

    // console.log("*************************************************************");
    // console.log("* memberToken:", memberToken.address, "bal:", balMT.toString(10));
    // console.log("* collateralToken:", collateralToken.address, "bal:", balCT.toString(10));
    // console.log("*************************************************************");

};
