// import {Storage} from './Storage';
import {ModelFilter, ModelOptions, ModelValues} from './Filter';
import {ModelCollection} from './ModelCollection';

// var lastId = 1000;

// var _storage = new Storage();

export abstract class Model<T extends Model<T>> {

    // id: number;

    private __meta: any = {};
    private __values: any = {};
    private __relations: any = {};

    getMeta(key: string){
        return this.__meta[key];
    }

    setMeta(key: string, value: any){
        this.__meta[key] = value;
    }

    getValues(){
        return this.__values;
    }

    getRelations(){
        return this.__relations;
    }

    get id(): number {
        return this.getValue('id');
    }

    // abstract get modelClass(): { new(): Model; };
    protected abstract getModelClass(): any;

    // get _storage(){
    //     return _storage;
    // }

    // private _getRaw(){
        // return this;
        // var raw = {};
        // for(var key in this){
        //     raw[key] = this[key];
        // }
        // console.log(raw);
        // return raw;
    // }

    toRaw(includeRelations = false){
        let raw = {};
        for(let prop in this.__values){
            raw[prop] = this.__values[prop];
        }
        if(includeRelations){
            for(let prop in this.__relations){
                if(includeRelations !== true && !includeRelations[prop]){
                    continue;
                }
                if(this.__relations[prop]){
                    raw[prop] = this.__relations[prop].toRaw();
                }
            }
        }
        return raw;
    }

    toJson(includeRelations = false){
        let raw = this.toRaw(includeRelations);
        let json = JSON.stringify(raw);
        return json;
    }

    private getTypeName(){
        // return this.constructor.name;
        var ret = this.constructor.toString();
        ret = ret.substr('function '.length);
        ret = ret.substr(0, ret.indexOf('('));
        return ret;
    }

    // populate(values: ModelValues): this {
    //     return this.fill(values);
    // }

    fill(values: ModelValues): this {
        if(values instanceof Model){
            values = values.toRaw(true);
            // let relations = values.getRelations();
            // for(let rel in relations){
            //     this.setRelation(rel, relations[rel]);
            // }
            // values = values.getValues();
        }
        // values = JSON.parse(JSON.stringify(values));
        for(var prop in values){
            this.setValue(prop, values[prop], false);
            // if(prop == 'id'){
            // }
            // else {
            //     this[prop] = values[prop];
            // }
        }
        return this;
    }

    // create(){
    //     return new Promise((resolve, reject)=> {
    //         this._storage.getItem('entities.' + this.typeName).then((rawEntities: any[])=> {
    //             var maxId = 0;
    //             for(var rawEntity of rawEntities){
    //                 var id = parseInt(rawEntity.id);
    //                 maxId = id > maxId ? id : maxId;
    //             }
    //             this.id = maxId + 1;
    //             rawEntities.push(this._getRaw());
    //             this._storage.setItem('entities.' + this.typeName, rawEntities);
    //             resolve();
    //         });
    //     });
    // }

    // update(){
    //     return new Promise((resolve, reject)=> {
    //         // write your own logic within here
    //         this._storage.getItem('entities.' + this.typeName).then((rawEntities)=> {
    //             for(var key in rawEntities){
    //                 if(rawEntities[key].id == this.id){
    //                     rawEntities[key] = this._getRaw();
    //                 }
    //             }
    //             this._storage.setItem('entities.' + this.typeName, rawEntities);
    //             resolve();
    //         });
    //     });
    // }

    save(options: any = {}){
        return new Promise((resolve, reject)=> {
            let collection = this.getModelClass().collection([this]);
            collection.save(options).then(()=> {
                resolve();
            }, reject);
        });
        // if(this.id){
        //     return this.update();
        // }
        // return this.create();
    }

    saveWith(withRelations: any){
        return this.save({with: withRelations});
    }

    delete(){
        return new Promise((resolve, reject)=> {
            let collection = this.getModelClass().collection([this]);
            collection.delete().then(()=> {
                resolve();
            }, reject);
        });
    }

    protected getRelation(relationProperty: string, lazyLoad = true): any {
        let relation = this.__relations[relationProperty];
        // console.log('the relation meta', relation, relation && relation.getMeta);
        if(relation && !relation.getMeta('partial')){
            return relation;
        }
        if(!lazyLoad){
            return relation || null;
        }
        let relatedDefinitions = this.getRelated();
        let relatedDefinition = relatedDefinitions[relationProperty];
        if(!relatedDefinition){
            return relation || null;
        }
        if(!relatedDefinition.many){
            let relatedId = this.__values[relatedDefinition.key];
            if(!relatedDefinition.key && relatedDefinition.inverseKey){
                // inverse side of one to one
                if(!relation){
                    relation = relatedDefinition.type.model();
                    relation.setMeta('partial', true);
                    this.__relations[relationProperty] = relation;
                }
                if(this.id && relation.getMeta('partial') && !relation.getMeta('lastAttempted')){
                    relation.setMeta('lastAttempted', true);
                    if(relatedDefinition.inverseKey){
                        relation.find({[relatedDefinition.inverseKey]: this.id}).then(()=> {
                            relation.setMeta('partial', false);
                        }).catch((error: any)=> {
                        });
                    }
                }
            }
            else if(relatedId){
                if(!relation){
                    relation = ModelCollection.getModelById(relatedDefinition.type, relatedId);
                    this.__relations[relationProperty] = relation;
                    // relation = relatedDefinition.type.model();
                    // relation.setMeta('partial', true);
                }
                if(relation.getMeta('partial') && relation.getMeta('lastAttemptedId') != relatedId){
                    relation.setMeta('lastAttemptedId', relatedId);
                    relation.findById(relatedId).then(()=> {
                        relation.setMeta('partial', false);
                    })
                    .catch((error: any)=> {
                    });
                    console.log('getting the relation', relationProperty, relatedId);
                }
            }
        }
        else {
            if(!relation){
                relation = relatedDefinition.type.collection();
                relation.setMeta('partial', true);
                this.__relations[relationProperty] = relation;
            }
            if(this.id && relation.getMeta('partial') && !relation.getMeta('lastAttempted')){
                relation.setMeta('lastAttempted', true);
                if(relatedDefinition.inverseKey){
                    relation.find({[relatedDefinition.inverseKey]: this.id}).then(()=> {
                        relation.setMeta('partial', false);
                    }).catch((error: any)=> {
                    });
                }
            }
            // alert('Unexpected error (CODE: OMG01)');
            // this.__relations[relationProperty] = relation;
        }
        return relation || null;
    }

    protected setRelation(relationProperty: string, relation: any): any {
        let relatedDefinitions = this.getRelated();
        let relatedDefinition = relatedDefinitions[relationProperty];
        if(!relatedDefinition){
            return;
        }
        if(!relatedDefinition.many){
            if(relation && !(relation instanceof relatedDefinition.type)){
                let relationRaw = relation;
                relation = ModelCollection.getModelById(relatedDefinition.type, relation.id);
                relation.fill(relationRaw);
            }
            if(relatedDefinition.key){
                this.__values[relatedDefinition.key] = relation ? relation.id : null;
            }
            else if(relatedDefinition.inverseKey && relation && this.id){
                relation.setValue(relatedDefinition.inverseKey, this.id, false);
                // if(relatedDefinition.inverseProperty){
                //     relation.setRelation(relatedDefinition.inverseProperty, this);
                // }
            }
        }
        else {
            // console.log('ignoring many related property', relationProperty);
            // if(1 < 5){ return; }
            if(relation && !(relation instanceof relatedDefinition.collectionType)){
                relation = relatedDefinition.type.collection(relation);
            }
            if(relation && relation.getMeta && !relation.getMeta('partial')){
                if(relatedDefinition.inverseProperty){
                    for(let model of relation){
                        model[relatedDefinition.inverseProperty] = this;
                    }
                }
                // console.log('@TODO: SET one to many relation');
                // this.__relations[relationProperty] = relation;
            }
        }
        this.__relations[relationProperty] = relation || null;
    }

    protected getValue(property: string): any {
        return this.__values[property];
    }

    protected setValue(property: string, value: any, processRelated = true): any {
        let relatedDefinitions = this.getRelated();
        for(var relationProperty in relatedDefinitions){
            let relatedDefinition = relatedDefinitions[relationProperty];
            if(relationProperty == property){
                // console.log('going to set related property', property);
                return this.setRelation(property, value);
                // this.__values[relatedDefinition.key] = value ? value.id : null;
                // break;
            }
            if(processRelated && relatedDefinition.key == property){
                if(value){
                    let relation = this.__relations[relationProperty];
                    if(!relation){
                        relation = ModelCollection.getModelById(relatedDefinition.type, value);
                        this.__relations[relationProperty] = relation;
                    }
                    if(relation.getMeta('partial') && relation.getMeta('lastAttemptedId') != value){
                        relation.setMeta('lastAttemptedId', value);
                        relation.findById(value).then(()=> {
                            relation.setMeta('partial', false);
                        })
                        .catch((error: any)=> {
                        });
                    }
                }
                else {
                    this.__relations[relationProperty] = null;
                }
                break;
            }
        }
        this.__values[property] = value;
    }

    protected static getRelated(): any {
        return {};
    }

    protected getRelated(): any {
        return {};
    }

    static model(modelClass: any, values: ModelValues = {}): any {
        let model: any;
        if(values instanceof modelClass){
            model = values;
        }
        else {
            model = new (<any>modelClass)();
            model.fill(values);
        }
        return model;
    }

    static collection(collectionClass: any, models: ModelValues[] = []): any {
        let collection = new (<any>collectionClass)();
        for(let model of models){
            collection.add(collection.getModelClass().model(model));
        }
        return collection;
    }

    static filter(filter: ModelFilter = {}): ModelFilter {
        return filter;
    }

    static options(options: ModelOptions = {sort: {}}): ModelOptions {
        return options;
    }

    findById(id: number){
        id = parseInt(id + '');
        this.setValue('id', id);
        return this.find({id: id});
    }

    find(filter: ModelFilter = {}, options: ModelOptions = {}) {
        options.limit = 1;
        return new Promise<boolean>((resolve, reject)=> {
            let collection = this.getModelClass().collection();
            collection.find(filter, options).then(()=> {
                if(collection.has(0)){
                    this.fill(collection.get(0));
                    resolve();
                    return;
                }
                reject(this.getTypeName() + '(' + (JSON.stringify(filter)) + ') not found');
            }, reject);
        });
    }

    findByMethod(method: string, params: any = {}) {
        return new Promise<boolean>((resolve, reject)=> {
            let collection = this.getModelClass().collection();
            collection.findByMethod(method, params).then(()=> {
                if(collection.has(0)){
                    this.fill(collection.get(0));
                    resolve();
                    return;
                }
                reject(this.getTypeName() + ' not found with method ' + method);
            }, reject);
        });
    }

    saveByMethod(method: string, params: any = {}){
        return new Promise((resolve, reject)=> {
            let collection = this.getModelClass().collection([this]);
            collection.saveByMethod(method, params).then(()=> {
                resolve();
            }, reject);
        });
    }

}