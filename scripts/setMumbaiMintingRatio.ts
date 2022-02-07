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
  const { get } = deployments;

  const ratio45   = "450000000000000000"; // 45%
  const ratio80   = "800000000000000000";
  const ratio95   = "950000000000000000";
  const ratio100 = "1000000000000000000";
  const maxVol = "9999999999999999999999999999999999999999999999999"; // approximately unlimited

  const deps = {
    incremental: await get('Incremental'),
    oneBTC: await get('oneBTC')
  }

  const incremental = await ethers.getContractAt('Incremental', deps.incremental.address);
  const oneBTC = await ethers.getContractAt('OneTokenV1', deps.oneBTC.address);

  await incremental.setParams(deps.oneBTC.address, ratio80, ratio100, 0, ratio95, maxVol);
  await oneBTC.setRedemptionFee(ratio45);
}

main()
  .then(() => process.exit(0))
  .catch((error: any) => {
    console.error(error);
    process.exit(1);
  });
