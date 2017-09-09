import {BaseObj} from './BaseObj';
import {Storage} from './Storage';

export abstract class BaseList<T extends BaseObj> extends Array<T> {
    storage: Storage;

    constructor(){
        super();
        this.storage = new Storage();
    }

	get entityTypeName(){
		var ret = this.getEntityClass().toString();
		ret = ret.substr('function '.length);
		ret = ret.substr(0, ret.indexOf('('));
		return ret;
	}

    abstract getEntityClass(): { new(): T; };

    select(where = {}){
        return new Promise((resolve, reject)=> {
            // here comes your own logic
            this.storage.getItem('entities.' + this.entityTypeName).then((rawEntities)=> {
                for(var rawEntity of <Array<any>>rawEntities){
                    var entityClass = this.getEntityClass();
                    var entity = new entityClass();
                    for(var key in rawEntity){
                        entity[key] = rawEntity[key];
                    }
                    this.push(<T>entity);
                }
                resolve();
            });
        });
    }
}