## `ICHIModuleCommon`





### `onlyKnownToken()`





### `onlyTokenOwner(address oneToken)`





### `onlyModuleOrFactory()`






### `constructor(address oneTokenFactory_, enum InterfaceCommon.ModuleType moduleType_, string description_)` (internal)

modules are bound to the factory at deployment time
     @param oneTokenFactory_ factory to bind to
     @param moduleType_ type number helps prevent governance errors
     @param description_ human-readable, descriptive only



### `updateDescription(string description)` (external)

set a module description
     @param description new module desciption




### `ModuleDeployed(address sender, enum InterfaceCommon.ModuleType moduleType, string description)`





### `DescriptionUpdated(address sender, string description)`





