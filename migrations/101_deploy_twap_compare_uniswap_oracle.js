const
	Factory = artifacts.require("OneTokenFactory"),
	UniswapV2Factory = artifacts.require("UniswapV2Factory"),
	UniswapOracleTWAPCompare = artifacts.require("UniswapOracleTWAPCompare"),
	MemberToken = artifacts.require("MemberToken"),
	CollateralToken = artifacts.require("CollateralToken");

const TEST_TIME_PERIOD_1 = 3600
const TEST_TIME_PERIOD_2 = 86400
	
module.exports = async () => {
	
	const [governance] = await ethers.getSigners();
	
	const uniswapV2Factory = await UniswapV2Factory.deployed();
	const memberToken = await MemberToken.deployed();
	const collateralToken = await CollateralToken.deployed();

	const oneTokenFactory = await Factory.deployed();
	
	const uniswapTwapCompareOracle = await UniswapOracleTWAPCompare.new(oneTokenFactory.address, uniswapV2Factory.address, collateralToken.address, TEST_TIME_PERIOD_1, TEST_TIME_PERIOD_2);
	await UniswapOracleTWAPCompare.setAsDeployed(uniswapTwapCompareOracle);
	
	// console.log("*************************************************************");
	// console.log("* uniswapV2Factory:", uniswapV2Factory.address);
	// console.log("* uniswapTwapCompareOracle:", uniswapTwapCompareOracle.address);
	// console.log("*************************************************************");
};
