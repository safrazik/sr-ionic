import {IDataProvider} from './DataHandler';

// import {Http} from '@angular/http';

export type HTTP_METHOD = 'GET' | 'POST' | 'PUT' | 'DELETE';
type DATA_TYPE = 'json';

interface AjaxRequestOptions {
    url?: string, params?: any, method?: HTTP_METHOD, dataType?: DATA_TYPE, data?: any, headers?: any, xhr?: XMLHttpRequest
}
class AjaxRequest {
    url: string;
    method: HTTP_METHOD;
    dataType: DATA_TYPE;
    xhr: XMLHttpRequest;
    data: any;
    params: any;
    headers: any = {};

    constructor(options: AjaxRequestOptions = {}) {
        this.url = options.url;
        this.params = options.params || {};
        this.method = options.method || 'GET';
        this.dataType = options.dataType || 'json';
        this.data = options.data;
        this.xhr = options.xhr || new XMLHttpRequest();
        if(options.headers){
            for(let key in options.headers){
                this.setHeader(key, options.headers[key]);
            }
        }
    }

    setHeader(key: string, value: string){
        this.headers[key] = value;
    }

    unserializeData(rawData: any){
        if(this.dataType == 'json'){
            return JSON.parse(rawData);
        }
        return rawData;
    }

    serializeData(data: any){
        if(this.dataType == 'json'){
            return JSON.stringify(data);
        }
        return data;
    }

    send(){
        let encode = encodeURIComponent;
        encode = data => data;
        let query = Object.keys(this.params)
            .map(k => encode(k) + '=' + encode(this.params[k]))
            .join('&');
        let url = this.url + (query ? '?' + query : '');
        this.xhr.open(this.method, url);
        if(this.dataType == 'json'){
            this.setHeader('Accept', 'application/json');
            this.setHeader('Content-Type', 'application/json');
        }
        for(let key in this.headers){
            if(this.headers.hasOwnProperty(key)){
                this.xhr.setRequestHeader(key, this.headers[key]);
            }
        }
        return new Promise((resolve, reject)=> {
            this.xhr.onload = ()=> {
                if (this.xhr.status === 200 || this.xhr.status == 201) {
                    let data = this.unserializeData(this.xhr.responseText);
                    resolve(data);
                }
                else {
                    reject(new Error(this.xhr.statusText));
                }
            };
            this.xhr.onerror = ()=> {
                reject('Ajax Request Failed');
            };
            this.xhr.ontimeout = ()=> {
                reject('Ajax Request Timed Out');
            };
            this.xhr.send(this.serializeData(this.data));
        });

    }

}

export class RestApiDataProvider implements IDataProvider {


    static headers: any = {};

    constructor(private url: string, private resourceMap: any = {}){
    }

    static setHeader(key: string, value: string){
        RestApiDataProvider.headers[key] = value;
    }

    doAjax(method: HTTP_METHOD, url: string){
    }

    getResourceName(modelClass: any){
        for(var resource in this.resourceMap){
            if(this.resourceMap[resource] === modelClass){
                return resource;
            }
        }
        return this.getModelClassName(modelClass).toLowerCase() + 's';
    }

    doHttp(method: HTTP_METHOD, modelClass: any, params: any = {}, path: any = null, data: any = null){
        return new Promise((resolve, reject)=> {
            let resource = this.getResourceName(modelClass);
            let url = this.url + '/' + resource;
            if(path !== null){
                url += '/' + path;
            }
            let ajax = new AjaxRequest({
                url: url,
                params: params,
                method: method,
                data: data,
                headers: RestApiDataProvider.headers,
            });
            ajax.send().then(resolve, reject);
        });
    }

    private getModelClassName(modelClass: Function){
        var ret = modelClass.toString();
        ret = ret.substr('function '.length);
        ret = ret.substr(0, ret.indexOf('('));
        return ret;
    }

    save(modelClass: any, models: any[]){
        var promises: any[] = [];
        // let model = models[0];
        // let rawModel = model;

        // let rawModel = JSON.parse(JSON.stringify(model));
        // for(var relatedProp in model.getRelated()){
        //     // alert(relatedProp);
        //     delete rawModel[relatedProp];
        // }
        // delete rawModel.__relations;
        for(let model of models){
            promises.push(this.doHttp(model.id ? 'PUT' : 'POST', modelClass, {}, model.id, model));
        }
        return Promise.all(promises);
        // return new Promise((resolve, reject)=> {
        // });
    }

    delete(modelClass: any, models: any[]){
        var promises: any[] = [];
        // let model = models[0];
        for(let model of models){
            promises.push(this.doHttp('DELETE', modelClass, {}, model.id));
        }
        return Promise.all(promises);
        // return new Promise((resolve, reject)=> {
        // });
    }

    findBy(modelClass: any, filter: any){

        let $sort = filter.$sort;
        let $limit = filter.$limit;
        let $skip = filter.$skip;
        let $with = filter.$with;
        delete filter.$sort;
        delete filter.$limit;
        delete filter.$skip;
        delete filter.$with;

        let params: any = {};
        if(Object.keys(filter).length){
            params.filter = JSON.stringify(filter);
        }
        if($limit !== undefined){
            params.limit = $limit;
        }
        if($skip !== undefined){
            params.skip = $skip;
        }
        if($sort !== undefined){
            // params.sort = JSON.stringify(options.sort);
            let sortArray: string[] = [];
            for(let prop in $sort){
                sortArray.push(($sort[prop] == -1 ? '-' : '') + prop);
            }
            if(sortArray.length){
                params.sort = sortArray.join(',');
            }
        }
        if($with !== undefined){
            let withArray: string[] = [];
            for(let prop in $with){
                if($with[prop]){
                    withArray.push(prop);
                }
            }
            if(withArray.length){
                params.expand = withArray.join(',');
            }
        }
        return this.doHttp('GET', modelClass, params);
        // return new Promise((resolve, reject)=> {
        // });
    }

    findByMethod(modelClass: any, method: any, params: any = {}){
        return this.doHttp('GET', modelClass, params, method);
    }

    saveByMethod(modelClass: any, models: any[], method: any, params: any = {}){
        let model = models[0];
        let rawModel = model;
        return this.doHttp('POST', modelClass, params, method, rawModel);
    }

    initialize(){
        return new Promise((resolve, reject)=> {
            resolve();
        });
    }
}