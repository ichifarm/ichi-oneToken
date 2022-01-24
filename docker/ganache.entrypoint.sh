#!/bin/sh

node_modules/.bin/hardhat node \
  --hostname 0.0.0.0 \
  --fork $FORK_URL \
  --fork-block-number $FORK_BLOCK_NUMBER



# ganache-cli \
#   --host 0.0.0.0 \
#   --wallet.mnemonic "$MNEMONIC" \
#   --fork.url $FORK_URL \
#   --fork.blockNumber $FORK_BLOCK_NUMBER \
#   --chain.chainId $CHAIN_ID \
#   --logging.verbose true
