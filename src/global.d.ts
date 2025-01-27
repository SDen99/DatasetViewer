import type { UIState } from "$lib/core/services/StorageServices";

declare global {
    interface Window {
        dataStore: any, 
        UIStore: UIState,
        sortStore: any,
        erroStore:any,
        tableUIstore: any
    }
}

export {};