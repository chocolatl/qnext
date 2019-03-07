const EventEmitter = require('events');

class Qnext extends EventEmitter {
    constructor(activeLimit, waitingLimit = Infinity) {
        super();

        this._active  = [];     // 活动队列
        this._waiting = [];     // 等待队列
        
        this._activeLimit  = activeLimit;      // 活动队列最大长度
        this._waitingLimit = waitingLimit;     // 等待队列最大长度
    }

    get length() {
        return this.activeLength + this.waitingLength;
    }

    get activeLength() {
        return this._active.length;
    }

    get waitingLength() {
        return this._waiting.length;
    }

    get activeLimit() {
        return this._activeLimit;
    }

    get waitingLimit() {
        return this._waitingLimit;
    }

    add(task) {

        // 活动队列未满
        if(this.activeLength !== this.activeLimit) {
            this._runTask(task);
            return true;
        }

        // 等待队列未满
        if(this.waitingLength !== this.waitingLimit) {
            this._waiting.push(task);   // 加入等待队列末尾
            return true;
        }

        // 活动队列与等待队列都已满
        this.emit('refuse');
        return false;
    }

    // 运行task并加入活动队列
    _runTask(task) {

        // 活动队列已满时不应该调用该函数
        if(this.activeLength === this.activeLimit) throw new Error();

        let promise;

        let nextStep = () => {

            let index = this._active.indexOf(promise);
            if(index === -1) throw new Error();
            this._active.splice(index, 1);     // 从活动队列删除

            // 活动队列和等待队列都为空
            if(this.activeLength === 0 && this.waitingLength === 0) {
                this.emit('empty');
            }

            // 活动队列未满且等待队列不为空
            if(this.activeLength !== this.activeLimit && this.waitingLength !== 0) {
                let task = this._waiting.shift();
                this._runTask(task);
            }
        }

        let whenError = (err) => {
            nextStep();
            throw err;
        }

        promise = task();   // 执行任务        

        // then会返回一个新的promise，所以这里给promise变量重新赋值
        promise = promise.then(nextStep, whenError);    // 绑定任务成为完成态时的回调函数

        this._active.push(promise);    // 将promise加入活动队列
    }
}

module.exports = Qnext;