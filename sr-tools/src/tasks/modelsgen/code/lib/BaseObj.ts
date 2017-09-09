import {Storage} from './Storage';

export interface NumberPredicate {
	$eq?: number;
	$neq?: number;
	$lt?: number;
	$gt?: number;
}

export interface StringPredicate {
	$eq?: string;
	$neq?: string;
	$contains?: string;
	$startswith?: string;
	$endswith?: string;
}

export interface BaseFilter {
	id?: number | NumberPredicate;
	$and?: BaseFilter[];
	$or?: BaseFilter[];
}

// var lastId = 1000;
var storage = new Storage();

export abstract class BaseObj {
    id: number;

	get typeName(){
        // return this.constructor.name;
		var ret = this.constructor.toString();
		ret = ret.substr('function '.length);
		ret = ret.substr(0, ret.indexOf('('));
		return ret;
	}

    retrieve(){
        return new Promise((resolve, reject)=> {
            // write your own logic within here
            storage.getItem('entities.' + this.typeName).then((rawEntities: any[])=> {
                for(var key in rawEntities){
                    if(rawEntities[key].id == this.id){
                        for(var prop in rawEntities[key]){
                            this[prop] = rawEntities[key][prop];
                        }
                    }
                }
                resolve();
            });
        });
    }
    create(){
        return new Promise((resolve, reject)=> {
            storage.getItem('entities.' + this.typeName).then((rawEntities: any[])=> {
                var maxId = 0;
                for(var rawEntity of rawEntities){
                    var id = parseInt(rawEntity.id);
                    maxId = id > maxId ? id : maxId;
                }
                this.id = maxId + 1;
                rawEntities.push(this);
                storage.setItem('entities.' + this.typeName, rawEntities);
                resolve();
            });
        });
    }
    modify(){
        return new Promise((resolve, reject)=> {
            // write your own logic within here
            storage.getItem('entities.' + this.typeName).then((rawEntities)=> {
                for(var key in rawEntities){
                    if(rawEntities[key].id == this.id){
                        rawEntities[key] = this;
                    }
                }
                storage.setItem('entities.' + this.typeName, rawEntities);
                resolve();
            });
        });
    }
    delete(){
        return new Promise((resolve, reject)=> {
            storage.getItem('entities.' + this.typeName).then((rawEntities: any[])=> {
                for(var key in rawEntities){
                    if(rawEntities[key].id == this.id){
                        rawEntities.splice(<any>key, 1);
                    }
                }
                storage.setItem('entities.' + this.typeName, rawEntities);
                resolve();
            });
        });
    }

    static collection() {
    }

    find(criteria: BaseFilter): Promise<boolean> {
        this.id = <number>criteria.id;
        return this.retrieve();
        // return new Promise<boolean>((resolve, reject)=> {
        // });
    }
}