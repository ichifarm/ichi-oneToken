#!/bin/sh

node_modules/.bin/hardhat node \
  --hostname 0.0.0.0 \
  --fork $FORK_URL \
  --fork-block-number $FORK_BLOCK_NUMBER \
  --tags $DEPLOY_TAGS
