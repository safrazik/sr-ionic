export interface IStorage {
    getItem(key: string): Promise<any>;
    setItem(key: string, value: any): Promise<void>;
}
export declare class LocalStorage implements IStorage {
    getItem(key: string): Promise<any>;
    setItem(key: string, value: any): Promise<void>;
}
export declare class InMemoryStorage implements IStorage {
    static getItemSync(key: string): any;
    static getItem(key: string): Promise<any>;
    getItemSync(key: string): any;
    getItem(key: string): Promise<any>;
    static setItemSync(key: string, value: any): void;
    static setItem(key: string, value: any): Promise<void>;
    setItemSync(key: string, value: any): void;
    setItem(key: string, value: any): Promise<void>;
}
