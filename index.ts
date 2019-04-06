import EventEmitter = require('events');

interface Task {
    () : Promise<any>
}

class Qnext extends EventEmitter {
    private readonly _activeQueue: Promise<any>[]
    private readonly _waitingQueue: Task[]
    private readonly _activeLimit: number
    private readonly _waitingLimit: number

    constructor(activeLimit: number, waitingLimit = Infinity) {
        super();

        this._activeQueue  = [];     // 活动队列
        this._waitingQueue = [];     // 等待队列
        
        this._activeLimit  = activeLimit;      // 活动队列最大长度
        this._waitingLimit = waitingLimit;     // 等待队列最大长度
    }

    get length() {
        return this.activeLength + this.waitingLength;
    }

    get activeLength() {
        return this._activeQueue.length;
    }

    get waitingLength() {
        return this._waitingQueue.length;
    }

    get activeLimit() {
        return this._activeLimit;
    }

    get waitingLimit() {
        return this._waitingLimit;
    }

    public add(task: Task) : boolean {

        // 活动队列未满
        if(this.activeLength !== this.activeLimit) {
            this._runTask(task);
            return true;
        }

        // 等待队列未满
        if(this.waitingLength !== this.waitingLimit) {
            this._waitingQueue.push(task);   // 加入等待队列末尾
            return true;
        }

        // 活动队列与等待队列都已满
        this.emit('refuse');
        return false;
    }

    // 运行task并加入活动队列
    private _runTask(task: Task) : void {

        // 活动队列已满时不应该调用该函数
        if(this.activeLength === this.activeLimit) throw new Error();

        let promise: Promise<any>;

        const nextStep = () => {

            const index = this._activeQueue.indexOf(promise);
            if(index === -1) throw new Error();
            this._activeQueue.splice(index, 1);     // 从活动队列删除

            // 活动队列和等待队列都为空
            if(this.activeLength === 0 && this.waitingLength === 0) {
                this.emit('empty');
            }

            // 活动队列未满且等待队列不为空
            if(this.activeLength !== this.activeLimit && this.waitingLength !== 0) {
                const task = this._waitingQueue.shift();
                this._runTask(task);
            }
        }

        const whenError = (err) => {
            nextStep();
            throw err;
        }

        promise = task();   // 执行任务        

        // then会返回一个新的promise，所以这里给promise变量重新赋值
        promise = promise.then(nextStep, whenError);    // 绑定任务成为完成态时的回调函数

        this._activeQueue.push(promise);    // 将promise加入活动队列
    }
}

export = Qnext;