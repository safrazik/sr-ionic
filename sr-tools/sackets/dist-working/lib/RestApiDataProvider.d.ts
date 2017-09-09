import { IDataProvider } from './DataHandler';
export declare type HTTP_METHOD = 'GET' | 'POST' | 'PUT' | 'DELETE';
export declare class RestApiDataProvider implements IDataProvider {
    private url;
    private resourceMap;
    static headers: any;
    constructor(url: string, resourceMap?: any);
    static setHeader(key: string, value: string): void;
    doAjax(method: HTTP_METHOD, url: string): void;
    getResourceName(modelClass: any): string;
    doHttp(method: HTTP_METHOD, modelClass: any, params?: any, path?: any, data?: any): Promise<{}>;
    private getModelClassName(modelClass);
    save(modelClass: any, models: any[]): Promise<any[]>;
    delete(modelClass: any, models: any[]): Promise<any[]>;
    findBy(modelClass: any, filter: any): Promise<{}>;
    findByMethod(modelClass: any, method: any, params?: any): Promise<{}>;
    saveByMethod(modelClass: any, models: any[], method: any, params?: any): Promise<{}>;
    initialize(): Promise<{}>;
}
