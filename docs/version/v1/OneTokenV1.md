## `OneTokenV1`






### `availableBalance(address user, address token) → uint256` (public)

returns the available user balance in a given token
     @dev returns 0 if the balances was increased in this block
     @param user user to report
     @param token ERC20 asset to report



### `withdraw(address token, uint256 amount)` (public)

transfers collateral tokens to the user
     @dev user withdrawals are delayed 1 block after any balance increase
     @param token ERC20 token to transfer
     @param amount amount to transfer



### `mint(address collateralToken, uint256 oneTokens)` (external)

convert member tokens and collateral tokens into oneTokens. requires sufficient allowances for both tokens
     @dev takes the lessor of memberTokens allowance or the maximum allowed by the minting ratio and the balance in collateral
     @param collateralToken a registered ERC20 collateral token contract
     @param oneTokens exact number of oneTokens to receive



### `redeem(address collateral, uint256 amount)` (external)

redeem oneTokens for collateral tokens - applies fee %
     @dev first grant allowances, then redeem. Consider infinite collateral and a sufficient memberToken allowance.
     @param collateral form of ERC20 stable token to receive
     @param amount oneTokens to redeem equals collateral tokens to receive



### `setMintingFee(uint256 fee)` (external)

governance sets the adjustable fee
     @param fee fee, 18 decimals, e.g. 2% = 0020000000000000000



### `setRedemptionFee(uint256 fee)` (external)

governance sets the adjustable fee
     @param fee fee, 18 decimals, e.g. 2% = 0020000000000000000



### `updateMintingRatio() → uint256 ratio, uint256 maxOrderVolume` (public)

adjust the minting ratio
     @dev acceptable for gas-paying external actors to call this function



### `getMintingRatio() → uint256 ratio, uint256 maxOrderVolume` (external)

read the minting ratio and maximum order volume prescribed by the mintMaster



### `getHoldings(address token) → uint256 vaultBalance, uint256 strategyBalance` (external)

read the vault balance and strategy balance of a given token
     @dev not restricted to registered assets
     @param token ERC20 asset to report




### `UserWithdrawal(address sender, address token, uint256 amount)`





### `UserBalanceIncreased(address user, address token, uint256 amount)`





### `UserBalanceDecreased(address user, address token, uint256 amount)`





### `Minted(address sender, address collateral, uint256 oneTokens, uint256 memberTokens, uint256 collateralTokens)`





### `Redeemed(address sender, address collateral, uint256 amount)`





### `NewMintingFee(address sender, uint256 fee)`





### `NewRedemptionFee(address sender, uint256 fee)`





