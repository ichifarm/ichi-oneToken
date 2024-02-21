const initial_migration = require('../migrations/10_initial_migration.js')
const deploy_factory = require('../migrations/20_deploy_factory.js')
const deploy_testContracts = require('../migrations/30_deploy_testContracts.js')
const deploy_pegged_oracle = require('../migrations/40_deploy_pegged_oracle.js')
const deploy_test_oracle = require('../migrations/41_deploy_test_oracle.js')
const deploy_test_mint_master = require('../migrations/42_deploy_test_mint_master.js')
const deploy_renFIL_oracle = require('../migrations/43_deploy_renFIL_oracle.js')
const register_modules_and_deploy_oneToken = require('../migrations/50_register_modules_and_deploy_oneToken.js')
const recap_deployment = require('../migrations/99_recap_deployment.js')
const deploy_uniswap_oracle_simple = require('../migrations/100_deploy_uniswap_oracle_simple.js')


module.exports = async () => {
	await initial_migration()
	await deploy_factory()
	await deploy_testContracts()
	await deploy_pegged_oracle()
	await deploy_test_oracle()
	await deploy_test_mint_master()
	await deploy_renFIL_oracle()
	await register_modules_and_deploy_oneToken()
	await recap_deployment()
	await deploy_uniswap_oracle_simple()
};
