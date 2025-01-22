import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class ToggleService {
    private stateInit: boolean;
    constructor() {
        this.stateInit = false; // default;
    }
    get state() {
        return this.stateInit;
    }
    toggle() {
        this.stateInit = !this.stateInit;
    }
}
