
export interface IStorage {
    getItem(key: string): Promise<any>;
    setItem(key: string, value: any): Promise<void>;
}

export class LocalStorage implements IStorage {

    getItem(key: string): Promise<any> {
        var value = localStorage.getItem(key);
        return Promise.resolve(JSON.parse(value));
    }

    setItem(key: string, value: any): Promise<void> {
        value = JSON.stringify(value);
        localStorage.setItem(key, value);
        return Promise.resolve();
    }

}

let _storage: any = {};
export class InMemoryStorage implements IStorage {

    static getItemSync(key: string): any {
        let value = _storage[key];
        return value
    }

    static getItem(key: string): Promise<any> {
        return Promise.resolve(InMemoryStorage.getItemSync(key));
    }

    getItemSync(key: string): any {
        return InMemoryStorage.getItemSync(key);
    }

    getItem(key: string): Promise<any> {
        return InMemoryStorage.getItem(key);
    }

    static setItemSync(key: string, value: any): void {
        _storage[key] = value;
    }

    static setItem(key: string, value: any): Promise<void> {
        InMemoryStorage.setItemSync(key, value);
        return Promise.resolve();
    }

    setItemSync(key: string, value: any): void {
        InMemoryStorage.setItemSync(key, value);
    }

    setItem(key: string, value: any): Promise<void> {
        return InMemoryStorage.setItem(key, value);
    }

}