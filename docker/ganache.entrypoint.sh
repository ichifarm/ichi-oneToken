#!/bin/sh

ganache-cli \
  --host 0.0.0.0 \
  --wallet.mnemonic "$MNEMONIC" \
  --fork.url $FORK_URL \
  --fork.blockNumber $FORK_BLOCK_NUMBER \
  --chain.chainId $CHAIN_ID \
  --logging.verbose true
