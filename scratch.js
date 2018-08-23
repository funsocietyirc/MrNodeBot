// Top level store Map
const store = new Map();

// Symbol Decelerations
const getStore = Symbol('getStore');
const getData = Symbol('getData');
const setData = Symbol('setData');

class DataStore {
    constructor(name) {
        this.storeId = Symbol('dataStore');
        store.set(this.storeId, new Map());

        this[getStore].set('firstName', name);
    }
    // Private Functions
    [getData](key){
        return this[getStore].get(key);
    }
    [setData](key, value) {
        this[getStore].set(data, value);
    }
    get [getStore](){
        return store.get(this.storeId);
    }
    // Public Functions
    get(key) {
        this[getStore].get(key);
    }

    set(key, value) {
        this[getStore].set(key, value);
    }
}

// Testing
const instance1 = new DataStore('John');
console.log('Instance 1');
console.dir(instance1);
instance1.run();

const instance2 = new DataStore('Jacob');
console.log('Instance 2');
console.dir(instance1);
instance2.run();

const instance3 = new DataStore();
console.log('Instance 3');
console.dir(instance1);
instance3.run();
