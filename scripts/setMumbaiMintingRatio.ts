import { ethers, deployments, network, getNamedAccounts } from "hardhat";

import { getCurrentConfig } from "../src/deployConfigs";

const TargetsPerNetwork = {
  137: [
    "Incremental",
    "OneTokenFactory",
    "OneTokenV1",
    "ICHIPeggedOracle",
    "ChainlinkOracleUSD",
    "oneBTC",
    "oneBTCArbitrary"
  ]
}

async function main() {
  const { get, read, execute } = deployments;
  const targets = TargetsPerNetwork[network.config.chainId];
  const config = getCurrentConfig();
  const [owner] = await ethers.getSigners();

  const ratio45   = "450000000000000000"; // 45%
  const ratio80   = "800000000000000000";
  const ratio95   = "950000000000000000";
  const ratio100 = "1000000000000000000";
  const maxVol = "9999999999999999999999999999999999999999999999999"; // approximately unlimited

  const oneBTC = get('oneBTC');
  await execute('Incremental', {from: deployer, log: true}, 'setParam', oneBTC.address, ratio80, ratio100, 0, ratio95, maxVol);
  await execute('oneBTC', {from: deploy, log: true}, 'setRedemptionFee', ratio45)
}

main()
  .then(() => process.exit(0))
  .catch((error: any) => {
    console.error(error);
    process.exit(1);
  });
