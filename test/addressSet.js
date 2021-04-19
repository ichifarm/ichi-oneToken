const { assert } = require("chai");
const truffleAssert = require('truffle-assertions');

const SetTest = artifacts.require("SetTest");

let addressSet,
    keys = [];

contract("AddressSet", accounts => {

    beforeEach(async () => {
        keys = accounts;
        addressSet = await SetTest.new();
        await addressSet.insert(keys[0], "Failed to insert first key");
        await addressSet.insert(keys[1], "Failed to insert second key");
        await addressSet.insert(keys[2], "Failed to insert third key");
    });

    it("should return the count", async () => {
        let count = await addressSet.count();
        assert.strictEqual(parseInt(count.toString(10)), 3, "There are not exactly three keys in the set");
    });

    it("should not allow to remove unexisting key", async () => {
        let msg1 = "The key doesn't belong in the set";
        await truffleAssert.reverts(addressSet.remove(keys[3], msg1), msg1);
    });

    it("should remove the first key", async () => {
        await addressSet.remove(keys[0], "Failed to remove first key");
        let count = await addressSet.count();
        assert.strictEqual(parseInt(count.toString(10)), 2, "There are not exactly two keys in the set");
    });

    it("should remove the last key", async () => {
        await addressSet.remove(keys[2], "Failed to remove first key");
        let count = await addressSet.count();
        assert.strictEqual(parseInt(count.toString(10)), 2, "There are not exactly two keys in the set");
    });

    it("should remove the middle key", async () => {
        await addressSet.remove(keys[1], "Failed to remove first key");
        let count = await addressSet.count();
        let firstKey = await addressSet.keyAtIndex(0);
        let lastKey = await addressSet.keyAtIndex(1);
        assert.strictEqual(firstKey, keys[0], "The first key is not set");
        assert.strictEqual(lastKey, keys[2], "The last key is not set");
        assert.strictEqual(parseInt(count.toString(10)), 2, "There are not exactly two keys in the set");
    });

});
