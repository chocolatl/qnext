/// <reference types="node" />
import EventEmitter = require('events');
interface Task {
    (): Promise<any>;
}
declare class Qnext extends EventEmitter {
    private readonly _activeQueue;
    private readonly _waitingQueue;
    private readonly _activeLimit;
    private readonly _waitingLimit;
    constructor(activeLimit: number, waitingLimit?: number);
    readonly length: number;
    readonly activeLength: number;
    readonly waitingLength: number;
    readonly activeLimit: number;
    readonly waitingLimit: number;
    add(task: Task): boolean;
    private _runTask;
}
export = Qnext;
