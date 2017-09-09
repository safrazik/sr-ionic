import {Model} from './Model';
import {ModelFilter, ModelOptions} from './Filter';
import {DataHandler} from './DataHandler';

// let modelsCached = {};

// let _dataHandler = new DataHandler();
let _dataHandler = DataHandler;

export abstract class ModelCollection<T extends Model<T>> extends Array<T> {

    // private dataHandler: DataHandler;
    // private _array: T[] = [];

    // get array(): T[] {
    //     return this._array;
    // }
    private __meta: any = {};

    private __removed: any[] = [];

    private static __modelsCached: any = {};

    getMeta(key: string){
        return this.__meta[key];
    }

    setMeta(key: string, value: any){
        this.__meta[key] = value;
    }

    toRaw(includeRelations = false){
        let raw = [];
        for(var model of this){
            raw.push(model.toRaw(includeRelations));
        }
        return raw;
    }

    toJson(includeRelations = false){
        let raw = this.toRaw(includeRelations);
        let json = JSON.stringify(raw);
        return json;
    }

    toArray(){
        return this.concat([]);
    }

    static getModelClassName(modelClass: any){
        var ret = modelClass.toString();
        ret = ret.substr('function '.length);
        ret = ret.substr(0, ret.indexOf('('));
        return ret;
    }

    getModelClassName(modelClass: any = null){
        if(!modelClass){
            modelClass = this.getModelClass();
        }
        return ModelCollection.getModelClassName(modelClass);
    }

    abstract getModelClass(): { new(): T; };

    // findOne(filter: ModelFilter = {}, options: ModelOptions = {}) {
    // }

    save(options: any = {}){
        let modelClass: any = this.getModelClass();
        let withRelations = options.with || {};
        let savePromise = _dataHandler.saveData(modelClass, this.toRaw(withRelations)).then(newData => {
            newData = Array.isArray(newData) ? newData : [newData];
            for(let i = 0; i < this.length; i++){
                if(newData[i]){
                    this[i].fill(newData[i]);
                }
            }
        });
        let removedCollection = modelClass.collection();
        for(let model of this.__removed){
            if(model.id){
                removedCollection.push(model);
            }
        }
        if(!removedCollection.length){
            return savePromise;
        }
        return Promise.all([savePromise, removedCollection.delete()]);
    }

    saveWith(withRelations: any){
        return this.save({with: withRelations});
    }

    delete(){
        return _dataHandler.deleteData(this.getModelClass(), this.toRaw());
    }

    static getModelById(modelClass, id, createOnDemand = true){
        var modelClassName = typeof modelClass == 'string' ? modelClass : ModelCollection.getModelClassName(modelClass);
        let modelsCached = ModelCollection.__modelsCached;
        if(!modelsCached[modelClassName]){
            modelsCached[modelClassName] = {};
        }
        var model = modelsCached[modelClassName][id];
        if(!createOnDemand){
            return model || null;
        }
        if(!model){
            model = (<any>modelClass).model();
            model.fill({id: id});
            model.setMeta('partial', true);
        }
        modelsCached[modelClassName][id] = model;
        ModelCollection.__modelsCached[modelClassName][id] = model;
        return model;
    }

    static setModelById(modelClass, id, model){
        var modelClassName = typeof modelClass == 'string' ? modelClass : ModelCollection.getModelClassName(modelClass);
        let modelsCached = ModelCollection.__modelsCached;
        if(!modelsCached[modelClassName]){
            modelsCached[modelClassName] = {};
        }
        modelsCached[modelClassName][id] = model;
        ModelCollection.__modelsCached[modelClassName][id] = model;
    }

    private hydrateRaw(rawModels: any[], modelClass: any = null){
        if(!modelClass){
            modelClass = this.getModelClass();
        }
        return ModelCollection.hydrateRaw(rawModels, modelClass);
    }

    static hydrateRaw(rawModels: any[], modelClass: any){
        // var models = [];
        var models = modelClass.collection();
        for(var rawModel of rawModels){
            let id = parseInt(rawModel.id);
            var model = ModelCollection.getModelById(modelClass, id);
            model.fill(rawModel);
            model.setMeta('partial', false);
            let relatedDefinitions = (<any>modelClass).getRelated();
            // for(let relatedName in relatedDefinitions){
            for(let relatedName in []){
                let related = relatedDefinitions[relatedName];
                let relatedModelClassName = ModelCollection.getModelClassName(related.type);
                if(!related.many){
                    var relatedId = model.getValue(related.key);
                    let relatedModel = ModelCollection.getModelById(related.type, relatedId);
                    if(rawModel[relatedName]){
                        relatedModel.fill(rawModel[relatedName]);
                        relatedModel.setMeta('partial', false);
                    }
                    // ModelCollection.setModelById(related.type, relatedId, relatedModel);
                    model[relatedName] = relatedModel;
                }
                else {
                    let relatedCollection = model.getRelation(relatedName, false);
                    if(!relatedCollection){
                        relatedCollection = related.type.collection();
                        relatedCollection.setMeta('partial', true);
                    }
                    if(rawModel[relatedName] && rawModel[relatedName].length){
                        var relModels = [];
                        for(var rel of rawModel[relatedName]){
                            let relModel = ModelCollection.getModelById(related.type, rel.id);
                            relModel.fill(rel);
                            relModel.setMeta('partial', false);
                            // ModelCollection.setModelById(related.type, rel.id, relModel);
                            relModels.push(relModel);
                        }
                        relatedCollection.push(...relModels); // set all at once
                        relatedCollection.setMeta('partial', false);
                        relatedCollection.setMeta('eager', true);
                    }
                    model[relatedName] = relatedCollection;
                }
                // console.log('the related model', relatedModel, model[related.key], model);
            }
            // ModelCollection.setModelById(modelClass, id, model);
            models.push(model);
        }
        return models;
    }

    findByMethod(method: string, params: any = {}): Promise<any> {
        var modelCass = this.getModelClass();
        return new Promise((resolve, reject)=> {
            _dataHandler.findByMethod(modelCass, method, params).then((rawModels: any[])=> {
                this.clear();
                var models = this.hydrateRaw(rawModels);
                this.push(...models);
                resolve();
            }, reject);
        });
    }

    saveByMethod(method: string, params: any = {}): Promise<any> {
        return _dataHandler.saveByMethod(this.getModelClass(), this.toRaw(), method, params).then(newData => {
            newData = Array.isArray(newData) ? newData : [newData];
            for(let i = 0; i < this.length; i++){
                if(newData[i]){
                    this[i].fill(newData[i]);
                }
            }
        });
    }

    // find(filter: ModelFilter = {}, options: ModelOptions = {});
    // find(predicate: (value: T, index: number, obj: T[]) => boolean, thisArg: any): T;
    // find(filter: ModelFilter, options: ModelOptions): Promise<any>;
    find(filter: ModelFilter = {}, options: ModelOptions = {}): any {
    // find(filter: any, options: any): any {
        var modelCass = this.getModelClass();
        return new Promise((resolve, reject)=> {
            _dataHandler.findData(modelCass, filter, options).then((rawModels: any[])=> {
                this.clear();
                var models = this.hydrateRaw(rawModels);
                this.push(...models);
                resolve();
            });
        });
    }

    clear(){
        // this = []; // method 1
        // this.length = 0; // method 2
        this.splice(0, this.length); // method 3
    }

    add(model: T, index: number = null): number {
        if(index === null){
            this.push(model);
            index = this.length;
        }
        else {
            this.splice(index, 0, model);
        }
        return index;
    }

    has(index: number): boolean {
        return this[index] !== undefined;
    }

    get(index: number): T {
        return this[index];
    }

    private removeByIndex(index: number): T {
        let removed = this.splice(index, 1);
        this.__removed.push(removed[0]);
        return removed[0];
    }

    private removeByModel(model: T): number {
        let index = this.indexOf(model);
        this.splice(index, 1);
        this.__removed.push(model);
        return index;
    }

    remove(model: T): number;
    remove(index: number): T;
    remove(modelOrIndex: T | number): number | T {
        if(typeof modelOrIndex === "number"){
            return this.removeByIndex(modelOrIndex);
        }
        else {
            return this.removeByModel(modelOrIndex);
        }
    }

}