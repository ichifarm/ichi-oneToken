## `SafeERC20`



Wrappers around ERC20 operations that throw on failure (when the token
contract returns false). Tokens that return no value (and instead revert or
throw on failure) are also supported, non-reverting calls are assumed to be
successful.
To use this library you can add a `using SafeERC20 for IERC20;` statement to your contract,
which allows you to call the safe operations as `token.safeTransfer(...)`, etc.


### `safeTransfer(contract IERC20 token, address to, uint256 value)` (internal)





### `safeTransferFrom(contract IERC20 token, address from, address to, uint256 value)` (internal)





### `safeApprove(contract IERC20 token, address spender, uint256 value)` (internal)



Deprecated. This function has issues similar to the ones found in
{IERC20-approve}, and its usage is discouraged.

Whenever possible, use {safeIncreaseAllowance} and
{safeDecreaseAllowance} instead.

### `safeIncreaseAllowance(contract IERC20 token, address spender, uint256 value)` (internal)





### `safeDecreaseAllowance(contract IERC20 token, address spender, uint256 value)` (internal)






