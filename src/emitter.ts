import EventEmitter from "events";

/**
 * The `SharedEmitter` is a singleton wrapper arounf the standard EventEmitter
 * object, giving all files in this library the ability to share a single 
 * communication channel
 */
export class SharedEmitter {
    
    private static instance: EventEmitter;

    private constructor() {}

    public static getInstance() : EventEmitter {
        if(!SharedEmitter.instance) {
            SharedEmitter.instance = new EventEmitter();
        }
        return SharedEmitter.instance;
    }
}