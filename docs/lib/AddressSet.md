## `AddressSet`

Key sets with enumeration and delete. Uses mappings for random access
and existence checks and dynamic arrays for enumeration. Key uniqueness is enforced. 


Sets are unordered. Delete operations reorder keys. All operations have a 
fixed gas cost at any scale, O(1).


### `insert(struct AddressSet.Set self, address key, string errorMessage)` (internal)

insert a key. 
     @dev duplicate keys are not permitted.
     @param self storage pointer to a Set. 
     @param key value to insert.



### `remove(struct AddressSet.Set self, address key, string errorMessage)` (internal)

remove a key.
     @dev key to remove must exist. 
     @param self storage pointer to a Set.
     @param key value to remove.



### `count(struct AddressSet.Set self) → uint256` (internal)

count the keys.
     @param self storage pointer to a Set.



### `exists(struct AddressSet.Set self, address key) → bool` (internal)

check if a key is in the Set.
     @param self storage pointer to a Set.
     @param key value to check. Version
     @return bool true: Set member, false: not a Set member.



### `keyAtIndex(struct AddressSet.Set self, uint256 index) → address` (internal)

fetch a key by row (enumerate).
     @param self storage pointer to a Set.
     @param index row to enumerate. Must be < count() - 1.




