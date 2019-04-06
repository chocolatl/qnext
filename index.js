"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var EventEmitter = require("events");
var Qnext = /** @class */ (function (_super) {
    __extends(Qnext, _super);
    function Qnext(activeLimit, waitingLimit) {
        if (waitingLimit === void 0) { waitingLimit = Infinity; }
        var _this = _super.call(this) || this;
        _this._activeQueue = []; // 活动队列
        _this._waitingQueue = []; // 等待队列
        _this._activeLimit = activeLimit; // 活动队列最大长度
        _this._waitingLimit = waitingLimit; // 等待队列最大长度
        return _this;
    }
    Object.defineProperty(Qnext.prototype, "length", {
        get: function () {
            return this.activeLength + this.waitingLength;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Qnext.prototype, "activeLength", {
        get: function () {
            return this._activeQueue.length;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Qnext.prototype, "waitingLength", {
        get: function () {
            return this._waitingQueue.length;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Qnext.prototype, "activeLimit", {
        get: function () {
            return this._activeLimit;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Qnext.prototype, "waitingLimit", {
        get: function () {
            return this._waitingLimit;
        },
        enumerable: true,
        configurable: true
    });
    Qnext.prototype.add = function (task) {
        // 活动队列未满
        if (this.activeLength !== this.activeLimit) {
            this._runTask(task);
            return true;
        }
        // 等待队列未满
        if (this.waitingLength !== this.waitingLimit) {
            this._waitingQueue.push(task); // 加入等待队列末尾
            return true;
        }
        // 活动队列与等待队列都已满
        this.emit('refuse');
        return false;
    };
    // 运行task并加入活动队列
    Qnext.prototype._runTask = function (task) {
        var _this = this;
        // 活动队列已满时不应该调用该函数
        if (this.activeLength === this.activeLimit)
            throw new Error();
        var promise;
        var nextStep = function () {
            var index = _this._activeQueue.indexOf(promise);
            if (index === -1)
                throw new Error();
            _this._activeQueue.splice(index, 1); // 从活动队列删除
            // 活动队列和等待队列都为空
            if (_this.activeLength === 0 && _this.waitingLength === 0) {
                _this.emit('empty');
            }
            // 活动队列未满且等待队列不为空
            if (_this.activeLength !== _this.activeLimit && _this.waitingLength !== 0) {
                var task_1 = _this._waitingQueue.shift();
                _this._runTask(task_1);
            }
        };
        var whenError = function (err) {
            nextStep();
            throw err;
        };
        promise = task(); // 执行任务        
        // then会返回一个新的promise，所以这里给promise变量重新赋值
        promise = promise.then(nextStep, whenError); // 绑定任务成为完成态时的回调函数
        this._activeQueue.push(promise); // 将promise加入活动队列
    };
    return Qnext;
}(EventEmitter));
module.exports = Qnext;
