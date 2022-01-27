const { ethers, network } = require('hardhat');
const { BigNumber } = require("ethers");

const { keccak256, defaultAbiCoder } = ethers.utils;

function impersonate(accounts) {
  return Promise.all(
    accounts.map((a) =>
      network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [a],
      })
    )
  );
}


function setBalance(address, balance) {
    return network.provider.send("hardhat_setBalance", [
        address,
        balance.toHexString()
    ]);
}

const forkPolygon = async function (block) {
    await network.provider.request({
        method: "hardhat_reset",
        params: [
        {
            forking: {
            jsonRpcUrl: process.env.POLYGON_ALCHEMY_API_ENDPOINT,
            blockNumber: block,
            },
        },
        ],
    });
}

const unfork = async function() {
    await network.provider.request({
        method: "hardhat_reset",
        params: [],
    });
}

const mintToken = async function(token, account, amount) {
  const index = await bruteForceTokenBalanceSlotIndex(token);

  const slot = dirtyFix(
    keccak256(encodeSlot(["address", "uint"], [account.address, index]))
  );

  const prevAmount = await network.provider.send("eth_getStorageAt", [
    token.address,
    slot,
    "latest",
  ]);

  await network.provider.send("hardhat_setStorageAt", [
    token.address,
    slot,
    encodeSlot(["uint"], [dirtyFix(BigNumber.from(amount).add(prevAmount))]),
  ]);
}

function encodeSlot(types, values) {
  return defaultAbiCoder.encode(types, values);
}

// source:  https://blog.euler.finance/brute-force-storage-layout-discovery-in-erc20-contracts-with-hardhat-7ff9342143ed
async function bruteForceTokenBalanceSlotIndex(token) {
  const account = ethers.constants.AddressZero;

  const probeA = encodeSlot(["uint"], [1]);
  const probeB = encodeSlot(["uint"], [2]);

  for (let i = 0; i < 100; i++) {
    let probedSlot = keccak256(encodeSlot(["address", "uint"], [account, i])); // remove padding for JSON RPC
    while (probedSlot.startsWith("0x0"))
      probedSlot = "0x" + probedSlot.slice(3);
    const prev = await network.provider.send("eth_getStorageAt", [
      token.address,
      probedSlot,
      "latest",
    ]);

    // make sure the probe will change the slot value
    const probe = prev === probeA ? probeB : probeA;

    await network.provider.send("hardhat_setStorageAt", [
      token.address,
      probedSlot,
      probe,
    ]);

    const balance = await token.balanceOf(account); // reset to previous value
    await network.provider.send("hardhat_setStorageAt", [
      token.address,
      probedSlot,
      prev,
    ]);

    if (balance.eq(ethers.BigNumber.from(probe))) return i;
  }
  throw "Balances slot not found!";
}

// WTF
// https://github.com/nomiclabs/hardhat/issues/1585
function dirtyFix(s) {
  return s.toString().replace(/0x0+/, "0x");
};

module.exports = { forkPolygon, unfork, mintToken, impersonate, setBalance }
