export class Storage {

    latency = 0;

    constructor(options: {latency?: number} = {latency: 0}){
        this.latency = options.latency;
    }

    simulateLatency(data: any = null){
        return new Promise((resolve, reject)=> {
            window.setTimeout(()=> {
                resolve(data);
            }, this.latency);
        });
    }

    getItem(key: string){
        var value = localStorage.getItem(key);
        return this.simulateLatency(JSON.parse(value));
    }

    setItem(key: string, value: any){
        value = JSON.stringify(value);
        localStorage.setItem(key, value);
        return this.simulateLatency();
    }

}