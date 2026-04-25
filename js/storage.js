export class StorageAPI {
    constructor() {
        this.prefix = 'pmp_prep_';
    }

    saveState(key, data) {
        localStorage.setItem(this.prefix + key, JSON.stringify(data));
    }

    getState(key) {
        const data = localStorage.getItem(this.prefix + key);
        return data ? JSON.parse(data) : null;
    }

    clearState(key) {
        localStorage.removeItem(this.prefix + key);
    }
}
