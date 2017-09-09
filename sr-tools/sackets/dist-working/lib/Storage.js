"use strict";
var LocalStorage = (function () {
    function LocalStorage() {
    }
    LocalStorage.prototype.getItem = function (key) {
        var value = localStorage.getItem(key);
        return Promise.resolve(JSON.parse(value));
    };
    LocalStorage.prototype.setItem = function (key, value) {
        value = JSON.stringify(value);
        localStorage.setItem(key, value);
        return Promise.resolve();
    };
    return LocalStorage;
}());
exports.LocalStorage = LocalStorage;
var _storage = {};
var InMemoryStorage = (function () {
    function InMemoryStorage() {
    }
    InMemoryStorage.getItemSync = function (key) {
        var value = _storage[key];
        return value;
    };
    InMemoryStorage.getItem = function (key) {
        return Promise.resolve(InMemoryStorage.getItemSync(key));
    };
    InMemoryStorage.prototype.getItemSync = function (key) {
        return InMemoryStorage.getItemSync(key);
    };
    InMemoryStorage.prototype.getItem = function (key) {
        return InMemoryStorage.getItem(key);
    };
    InMemoryStorage.setItemSync = function (key, value) {
        _storage[key] = value;
    };
    InMemoryStorage.setItem = function (key, value) {
        InMemoryStorage.setItemSync(key, value);
        return Promise.resolve();
    };
    InMemoryStorage.prototype.setItemSync = function (key, value) {
        InMemoryStorage.setItemSync(key, value);
    };
    InMemoryStorage.prototype.setItem = function (key, value) {
        return InMemoryStorage.setItem(key, value);
    };
    return InMemoryStorage;
}());
exports.InMemoryStorage = InMemoryStorage;
//# sourceMappingURL=Storage.js.map