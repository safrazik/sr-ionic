"use strict";
// import {KeyValueDataProvider} from './KeyValueDataProvider';
var LokiDataProvider_1 = require('./LokiDataProvider');
var DataHandler = (function () {
    function DataHandler() {
    }
    DataHandler.setDataProvider = function (dataProvider) {
        DataHandler._dataProvider = dataProvider;
    };
    DataHandler.getDataProvider = function () {
        return DataHandler._dataProvider;
    };
    DataHandler.setSyncDataProvider = function (syncDataProvider) {
        DataHandler._syncDataProvider = syncDataProvider;
    };
    DataHandler.getSyncDataProvider = function () {
        return DataHandler._syncDataProvider;
    };
    DataHandler.initialize = function () {
        return Promise.all([
            DataHandler._syncDataProvider.initialize(),
            DataHandler._dataProvider.initialize()
        ]);
    };
    DataHandler.save = function (modelClass, models) {
        DataHandler._syncDataProvider.saveSync(modelClass, models);
        return DataHandler._dataProvider.save(modelClass, models);
    };
    DataHandler.delete = function (modelClass, models) {
        DataHandler._syncDataProvider.deleteSync(modelClass, models);
        return DataHandler._dataProvider.delete(modelClass, models);
    };
    DataHandler.findBy = function (modelClass, filter) {
        return new Promise(function (resolve, reject) {
            DataHandler._dataProvider.findBy(modelClass, filter).then(function (rawModels) {
                if (rawModels && rawModels.length) {
                    DataHandler._syncDataProvider.cacheSync(modelClass, rawModels);
                }
                resolve(rawModels);
            }, reject);
        });
    };
    DataHandler.getBy = function (modelClass, filter) {
        return DataHandler._syncDataProvider.getBy(modelClass, filter);
        // @TODO improve
        // let modelClassName = ModelCollection.getModelClassName(modelClass);
        // let rawModels = InMemoryStorage.getItemSync('models.' + modelClassName);
        // if(rawModels && rawModels.length){
        //     rawModels = Filter.filterResults(rawModels, filter);
        // }
        // return rawModels || [];
    };
    DataHandler.findByMethod = function (modelClass, method, params) {
        if (params === void 0) { params = {}; }
        return new Promise(function (resolve, reject) {
            DataHandler._dataProvider.findByMethod(modelClass, method, params).then(function (rawModels) {
                if (rawModels && rawModels.length) {
                    DataHandler._syncDataProvider.cacheSync(modelClass, rawModels);
                }
                resolve(rawModels);
            }, reject);
        });
    };
    DataHandler.saveByMethod = function (modelClass, models, method, params) {
        if (params === void 0) { params = {}; }
        return DataHandler._dataProvider.saveByMethod(modelClass, models, method, params);
    };
    DataHandler._dataProvider = new LokiDataProvider_1.LokiDataProvider();
    DataHandler._syncDataProvider = new LokiDataProvider_1.LokiDataProvider();
    return DataHandler;
}());
exports.DataHandler = DataHandler;
//# sourceMappingURL=DataHandler.js.map