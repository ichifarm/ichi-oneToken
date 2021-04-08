## `ProxyAdmin`



This is an auxiliary contract meant to be assigned as the admin of a {TransparentUpgradeableProxy}. For an
explanation of why you would want to use this see the documentation for {TransparentUpgradeableProxy}.


### `getProxyImplementation(contract TransparentUpgradeableProxy proxy) → address` (public)



Returns the current implementation of `proxy`.

Requirements:

- This contract must be the admin of `proxy`.

### `getProxyAdmin(contract TransparentUpgradeableProxy proxy) → address` (public)



Returns the current admin of `proxy`.

Requirements:

- This contract must be the admin of `proxy`.

### `changeProxyAdmin(contract TransparentUpgradeableProxy proxy, address newAdmin)` (public)



Changes the admin of `proxy` to `newAdmin`.

Requirements:

- This contract must be the current admin of `proxy`.

### `upgrade(contract TransparentUpgradeableProxy proxy, address implementation)` (public)



Upgrades `proxy` to `implementation`. See {TransparentUpgradeableProxy-upgradeTo}.

Requirements:

- This contract must be the admin of `proxy`.

### `upgradeAndCall(contract TransparentUpgradeableProxy proxy, address implementation, bytes data)` (public)



Upgrades `proxy` to `implementation` and calls a function on the new implementation. See
{TransparentUpgradeableProxy-upgradeToAndCall}.

Requirements:

- This contract must be the admin of `proxy`.


