"use strict";
var ModelCollection_1 = require('./ModelCollection');
var Model = (function () {
    function Model() {
        this.__meta = {};
        this.__values = {};
        this.__relations = {};
    }
    Model.prototype.getMeta = function (key) {
        return this.__meta[key];
    };
    Model.prototype.setMeta = function (key, value) {
        this.__meta[key] = value;
    };
    Model.prototype.getValues = function () {
        return this.__values;
    };
    Model.prototype.getRelations = function () {
        return this.__relations;
    };
    Object.defineProperty(Model.prototype, "id", {
        get: function () { },
        enumerable: true,
        configurable: true
    });
    Model.prototype.toRaw = function (withRelations) {
        if (withRelations === void 0) { withRelations = false; }
        var raw = {};
        for (var prop in this.__values) {
            raw[prop] = this.__values[prop];
        }
        if (withRelations) {
            for (var prop in this.__relations) {
                if (withRelations !== true && !withRelations[prop]) {
                    continue;
                }
                if (this.__relations[prop]) {
                    raw[prop] = this.__relations[prop].toRaw();
                }
            }
        }
        return raw;
    };
    Model.prototype.toJson = function (withRelations) {
        if (withRelations === void 0) { withRelations = false; }
        var raw = this.toRaw(withRelations);
        var json = JSON.stringify(raw);
        return json;
    };
    Model.prototype.getTypeName = function () {
        var ret = this.constructor.toString();
        ret = ret.substr('function '.length);
        ret = ret.substr(0, ret.indexOf('('));
        return ret;
    };
    Model.prototype.fill = function (values) {
        if (values instanceof Model) {
            values = values.toRaw(true);
        }
        for (var prop in values) {
            this.setValue(prop, values[prop], false);
        }
        return this;
    };
    Model.prototype.save = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        return new Promise(function (resolve, reject) {
            var collection = _this.getModelClass().collection([_this]);
            collection.save(options).then(function () {
                resolve();
            }, reject);
        });
    };
    Model.prototype.saveWith = function (withRelations) {
        return this.save({ with: withRelations });
    };
    Model.prototype.delete = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var collection = _this.getModelClass().collection([_this]);
            collection.delete().then(function () {
                resolve();
            }, reject);
        });
    };
    Model.prototype.getRelation = function (relationProperty, lazyLoad) {
        if (lazyLoad === void 0) { lazyLoad = true; }
        var relation = this.__relations[relationProperty];
        // console.log('the relation meta', relation, relation && relation.getMeta);
        if (relation && !relation.getMeta('partial')) {
            return relation;
        }
        if (!lazyLoad) {
            return relation || null;
        }
        var relatedDefinitions = this.getRelated();
        var relatedDefinition = relatedDefinitions[relationProperty];
        if (!relatedDefinition) {
            return relation || null;
        }
        if (!relatedDefinition.many) {
            var relatedId = this.__values[relatedDefinition.key];
            if (!relatedDefinition.key && relatedDefinition.inverseKey) {
                // inverse side of one to one
                if (!relation) {
                    relation = relatedDefinition.type.model();
                    relation.setMeta('partial', true);
                    this.__relations[relationProperty] = relation;
                }
                if (this.id && relation.getMeta('partial') && !relation.getMeta('lastAttempted')) {
                    relation.setMeta('lastAttempted', true);
                    if (relatedDefinition.inverseKey) {
                        relation.findBy((_a = {}, _a[relatedDefinition.inverseKey] = this.id, _a)).then(function () {
                            relation.setMeta('partial', false);
                        }).catch(function (error) {
                        });
                    }
                }
            }
            else if (relatedId) {
                if (!relation) {
                    relation = ModelCollection_1.ModelCollection.getModelById(relatedDefinition.type, relatedId);
                    this.__relations[relationProperty] = relation;
                }
                if (relation.getMeta('partial') && relation.getMeta('lastAttemptedId') != relatedId) {
                    relation.setMeta('lastAttemptedId', relatedId);
                    relation.findBy({ id: relatedId }).then(function () {
                        relation.setMeta('partial', false);
                    })
                        .catch(function (error) {
                    });
                    console.log('getting the relation', relationProperty, relatedId);
                }
            }
        }
        else {
            if (!relation) {
                relation = relatedDefinition.type.collection();
                relation.setMeta('partial', true);
                this.__relations[relationProperty] = relation;
            }
            if (this.id && relation.getMeta('partial') && !relation.getMeta('lastAttempted')) {
                relation.setMeta('lastAttempted', true);
                if (relatedDefinition.inverseKey) {
                    relation.findBy((_b = {}, _b[relatedDefinition.inverseKey] = this.id, _b)).then(function () {
                        relation.setMeta('partial', false);
                    }).catch(function (error) {
                    });
                }
            }
        }
        return relation || null;
        var _a, _b;
    };
    Model.prototype.setRelation = function (relationProperty, relation) {
        var relatedDefinitions = this.getRelated();
        var relatedDefinition = relatedDefinitions[relationProperty];
        if (!relatedDefinition) {
            return;
        }
        if (!relatedDefinition.many) {
            if (relation && !(relation instanceof relatedDefinition.type)) {
                var relationRaw = relation;
                relation = ModelCollection_1.ModelCollection.getModelById(relatedDefinition.type, relation.id);
                relation.fill(relationRaw);
            }
            if (relatedDefinition.key) {
                this.__values[relatedDefinition.key] = relation ? relation.id : null;
            }
            else if (relatedDefinition.inverseKey && relation && this.id) {
                relation.setValue(relatedDefinition.inverseKey, this.id, false);
            }
        }
        else {
            if (relation && !(relation instanceof relatedDefinition.collectionType)) {
                relation = relatedDefinition.type.collection(relation);
            }
            if (relation && relation.getMeta && !relation.getMeta('partial')) {
                if (relatedDefinition.inverseProperty) {
                    for (var _i = 0, relation_1 = relation; _i < relation_1.length; _i++) {
                        var model = relation_1[_i];
                        model[relatedDefinition.inverseProperty] = this;
                    }
                }
            }
        }
        this.__relations[relationProperty] = relation || null;
    };
    Model.prototype.getValue = function (property) {
        var value = this.__values[property];
        var propertyDefinitions = this.getPropertyDefinitions();
        // console.log('propertyDefinitions', propertyDefinitions, this);
        if (propertyDefinitions[property] && ['number', 'boolean', 'string', 'Date'].indexOf(propertyDefinitions[property].type) !== -1) {
            if (propertyDefinitions[property].type == 'Date' && !(value instanceof Date)) {
                // console.log('ready to get the date');
                var d = new Date(value);
                if (!isNaN(d.getTime()) && d.getTime()) {
                    value = d;
                }
            }
        }
        return value;
    };
    Model.prototype.setValue = function (property, value, processRelated) {
        if (processRelated === void 0) { processRelated = true; }
        var propertyDefinitions = this.getPropertyDefinitions();
        if (propertyDefinitions[property] && ['number', 'boolean', 'string', 'Date'].indexOf(propertyDefinitions[property].type) !== -1) {
            if (propertyDefinitions[property].type == 'Date' && !(value instanceof Date)) {
                // console.log('ready to set the date');
                var d = new Date(value);
                if (!isNaN(d.getTime()) && d.getTime()) {
                    value = d;
                }
            }
            this.__values[property] = value;
            if (!processRelated) {
                return;
            }
        }
        var relatedDefinitions = this.getRelated();
        var _loop_1 = function() {
            var relatedDefinition = relatedDefinitions[relationProperty];
            if (relationProperty == property) {
                return { value: this_1.setRelation(property, value) };
            }
            if (processRelated && relatedDefinition.key == property) {
                if (value) {
                    var relation_2 = this_1.__relations[relationProperty];
                    if (!relation_2) {
                        relation_2 = ModelCollection_1.ModelCollection.getModelById(relatedDefinition.type, value);
                        this_1.__relations[relationProperty] = relation_2;
                    }
                    if (relation_2.getMeta('partial') && relation_2.getMeta('lastAttemptedId') != value) {
                        relation_2.setMeta('lastAttemptedId', value);
                        relation_2.findBy({ id: value }).then(function () {
                            relation_2.setMeta('partial', false);
                        })
                            .catch(function (error) {
                        });
                    }
                }
                else {
                    this_1.__relations[relationProperty] = null;
                }
                return "break";
            }
        };
        var this_1 = this;
        for (var relationProperty in relatedDefinitions) {
            var state_1 = _loop_1();
            if (typeof state_1 === "object") return state_1.value;
            if (state_1 === "break") break;
        }
        this.__values[property] = value;
    };
    Model.getRelated = function () {
        return {};
    };
    Model.prototype.getRelated = function () {
        return {};
    };
    Model.getPropertyDefinitions = function () {
        return {};
    };
    Model.prototype.getPropertyDefinitions = function () {
        return {};
    };
    Model.model = function (modelClass, values) {
        if (values === void 0) { values = {}; }
        var model;
        if (values instanceof modelClass) {
            model = values;
        }
        else {
            model = new modelClass();
            model.fill(values);
        }
        return model;
    };
    Model.collection = function (collectionClass, models) {
        if (models === void 0) { models = []; }
        var collection = new collectionClass();
        for (var _i = 0, models_1 = models; _i < models_1.length; _i++) {
            var model = models_1[_i];
            collection.add(collection.getModelClass().model(model));
        }
        return collection;
    };
    Model.filter = function (filter) {
        if (filter === void 0) { filter = {}; }
        return filter;
    };
    Model.prototype.findBy = function (filter) {
        var _this = this;
        if (filter === void 0) { filter = {}; }
        filter.$limit = 1;
        return new Promise(function (resolve, reject) {
            var collection = _this.getModelClass().collection();
            collection.findBy(filter).then(function () {
                if (collection[0]) {
                    _this.fill(collection[0]);
                    resolve(true);
                    return;
                }
                resolve(false);
            }, reject);
        });
    };
    Model.prototype.getBy = function (filter) {
        if (filter === void 0) { filter = {}; }
        var collection = this.getModelClass().collection();
        try {
            collection.getBy(filter);
            if (collection[0]) {
                this.fill(collection[0]);
                return true;
            }
        }
        catch (e) {
        }
        return false;
    };
    Model.prototype.findByMethod = function (method, params) {
        var _this = this;
        if (params === void 0) { params = {}; }
        return new Promise(function (resolve, reject) {
            var collection = _this.getModelClass().collection();
            collection.findByMethod(method, params).then(function () {
                if (collection[0]) {
                    _this.fill(collection[0]);
                    resolve(true);
                    return;
                }
                resolve(false);
            }, reject);
        });
    };
    Model.prototype.saveByMethod = function (method, params) {
        var _this = this;
        if (params === void 0) { params = {}; }
        return new Promise(function (resolve, reject) {
            var collection = _this.getModelClass().collection([_this]);
            collection.saveByMethod(method, params).then(function () {
                resolve();
            }, reject);
        });
    };
    Model.findAll = function (modelClass, filter) {
        if (filter === void 0) { filter = {}; }
        return new Promise(function (resolve, reject) {
            var collection = modelClass.collection();
            collection.findBy(filter).then(function () {
                resolve(collection);
            }).catch(reject);
        });
    };
    Model.findOne = function (modelClass, filter) {
        if (filter === void 0) { filter = {}; }
        return new Promise(function (resolve, reject) {
            var collection = modelClass.collection();
            collection.findBy(filter).then(function () {
                resolve(collection[0] || null);
            }).catch(reject);
        });
    };
    Model.getAll = function (modelClass, filter) {
        if (filter === void 0) { filter = {}; }
        var collection = modelClass.collection();
        collection.getBy(filter);
        return collection;
    };
    Model.getOne = function (modelClass, filter) {
        if (filter === void 0) { filter = {}; }
        var collection = modelClass.collection();
        collection.getBy(filter);
        return collection[0] || null;
    };
    return Model;
}());
exports.Model = Model;
//# sourceMappingURL=Model.js.map