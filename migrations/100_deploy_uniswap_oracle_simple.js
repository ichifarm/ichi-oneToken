const
	UniswapV2Factory = artifacts.require("UniswapV2Factory"),
	UniswapOracleSimple = artifacts.require("UniswapOracleSimple"),
	MemberToken = artifacts.require("MemberToken")

const TEST_TIME_PERIOD = 60000

module.exports = async () => {
	
	const [governance] = await ethers.getSigners();
	
	const uniswapV2Factory = await UniswapV2Factory.new(governance.address);
	await UniswapV2Factory.setAsDeployed(uniswapV2Factory);
	
	const memberToken = await MemberToken.deployed();
	
	const uniswapOracleSimple = await UniswapOracleSimple.new(uniswapV2Factory.address, memberToken.address, TEST_TIME_PERIOD);
	await UniswapOracleSimple.setAsDeployed(uniswapOracleSimple);
	
	// console.log("*************************************************************");
	// console.log("* uniswapV2Factory:", uniswapV2Factory.address);
	// console.log("* uniswapOracleSimple:", uniswapOracleSimple.address);
	// console.log("*************************************************************");
};
