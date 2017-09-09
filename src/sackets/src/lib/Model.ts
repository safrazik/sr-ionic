import {ModelFilter, ModelWith, ModelValues} from './Filter';
import {ModelCollection} from './ModelCollection';

export abstract class Model<T extends Model<T>> {

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

    abstract get id(): any;

    protected abstract getModelClass(): any;

    toRaw(withRelations: boolean | ModelWith = false){
        let raw: any = {};
        for(let prop in this.__values){
            raw[prop] = this.__values[prop];
        }
        if(withRelations){
            for(let prop in this.__relations){
                if(withRelations !== true && !(<any>withRelations)[prop]){
                    continue;
                }
                if(this.__relations[prop]){
                    raw[prop] = this.__relations[prop].toRaw();
                }
            }
        }
        return raw;
    }

    toJson(withRelations: boolean | ModelWith = false){
        let raw = this.toRaw(withRelations);
        let json = JSON.stringify(raw);
        return json;
    }

    private getTypeName(){
        var ret = this.constructor.toString();
        ret = ret.substr('function '.length);
        ret = ret.substr(0, ret.indexOf('('));
        return ret;
    }


    fill(values: ModelValues): this {
        if(values instanceof Model){
            values = values.toRaw(true);
        }
        for(var prop in values){
            this.setValue(prop, (<any>values)[prop], false);
        }
        return this;
    }

    save(options: any = {}): Promise<void> {
        return new Promise<void>((resolve, reject)=> {
            let collection = this.getModelClass().collection([this]);
            collection.save(options).then(()=> {
                resolve();
            }, reject);
        });
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
                        relation.findBy({[relatedDefinition.inverseKey]: this.id}).then(()=> {
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
                }
                if(relation.getMeta('partial') && relation.getMeta('lastAttemptedId') != relatedId){
                    relation.setMeta('lastAttemptedId', relatedId);
                    relation.findBy({id: relatedId}).then(()=> {
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
                    relation.findBy({[relatedDefinition.inverseKey]: this.id}).then(()=> {
                        relation.setMeta('partial', false);
                    }).catch((error: any)=> {
                    });
                }
            }
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
            }
        }
        else {
            if(relation && !(relation instanceof relatedDefinition.collectionType)){
                relation = relatedDefinition.type.collection(relation);
            }
            if(relation && relation.getMeta && !relation.getMeta('partial')){
                if(relatedDefinition.inverseProperty){
                    for(let model of relation){
                        model[relatedDefinition.inverseProperty] = this;
                    }
                }
            }
        }
        this.__relations[relationProperty] = relation || null;
    }

    protected getValue(property: string): any {
        let value = this.__values[property];
        let propertyDefinitions = this.getPropertyDefinitions();
        // console.log('propertyDefinitions', propertyDefinitions, this);
        if(propertyDefinitions[property] && ['number', 'boolean', 'string', 'Date'].indexOf(propertyDefinitions[property].type) !== -1) {
            if(propertyDefinitions[property].type == 'Date' && !(value instanceof Date)){
                // console.log('ready to get the date');
                let d = new Date(value);
                if(!isNaN(d.getTime()) && d.getTime()){
                    value = d;
                }
            }
            if(propertyDefinitions[property].type == 'number' && (typeof value == 'string')){
                value = parseFloat(value);
            }
        }
        return value;
    }

    protected setValue(property: string, value: any, processRelated = true): any {
        let propertyDefinitions = this.getPropertyDefinitions();
        if(propertyDefinitions[property] && ['number', 'boolean', 'string', 'Date'].indexOf(propertyDefinitions[property].type) !== -1) {
            if(propertyDefinitions[property].type == 'Date' && !(value instanceof Date)){
                // console.log('ready to set the date');
                let d = new Date(value);
                if(!isNaN(d.getTime()) && d.getTime()){
                    value = d;
                }
            }
            if(propertyDefinitions[property].type == 'number' && (typeof value == 'string')){
                value = parseFloat(value);
            }
            this.__values[property] = value;
            if(!processRelated){
                return;
            }
        }
        let relatedDefinitions = this.getRelated();
        for(var relationProperty in relatedDefinitions){
            let relatedDefinition = relatedDefinitions[relationProperty];
            if(relationProperty == property){
                return this.setRelation(property, value);
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
                        relation.findBy({id: value}).then(()=> {
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

    protected static getPropertyDefinitions(): any {
        return {};
    }

    protected getPropertyDefinitions(): any {
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

    findBy(filter: ModelFilter = {}): Promise<boolean> {
        filter.$limit = 1;
        return new Promise<boolean>((resolve, reject)=> {
            let collection = this.getModelClass().collection();
            collection.findBy(filter).then(()=> {
                if(collection[0]){
                    this.fill(collection[0]);
                    resolve(true);
                    return;
                }
                resolve(false);
            }, reject);
        });
    }

    getBy(filter: ModelFilter = {}): boolean {
        let collection = this.getModelClass().collection();
        try {
            collection.getBy(filter);
            if(collection[0]){
                this.fill(collection[0]);
                return true;
            }
        }
        catch(e) {
        }
        return false;
    }

    findByMethod(method: string, params: any = {}): Promise<boolean> {
        return new Promise<boolean>((resolve, reject)=> {
            let collection = this.getModelClass().collection();
            collection.findByMethod(method, params).then(()=> {
                if(collection[0]){
                    this.fill(collection[0]);
                    resolve(true);
                    return;
                }
                resolve(false);
            }, reject);
        });
    }

    saveByMethod(method: string, params: any = {}): Promise<void>{
        return new Promise<void>((resolve, reject)=> {
            let collection = this.getModelClass().collection([this]);
            collection.saveByMethod(method, params).then(()=> {
                resolve();
            }, reject);
        });
    }

    static findAll(modelClass: any, filter: ModelFilter = {}): Promise<any> {
        return new Promise((resolve, reject)=> {
            let collection = modelClass.collection();
            collection.findBy(filter).then(()=> {
                resolve(collection);
            }).catch(reject);
        });
    }

    static findOne(modelClass: any, filter: ModelFilter = {}): Promise<any> {
        return new Promise((resolve, reject)=> {
            let collection = modelClass.collection();
            collection.findBy(filter).then(()=> {
                resolve(collection[0] || null);
            }).catch(reject);
        });
    }

    static getAll(modelClass: any, filter: ModelFilter = {}): any {
        let collection = modelClass.collection();
        collection.getBy(filter);
        return collection;
    }

    static getOne(modelClass: any, filter: ModelFilter = {}): any {
        let collection = modelClass.collection();
        collection.getBy(filter);
        return collection[0] || null;
    }

}