const Qnext = require('./index');
const assert = require('chai').assert;

function makeAsync(time, value, rj = false) {
    return new Promise(function(resolve, reject) {
        setTimeout(() => rj ? reject(value) : resolve(value), time);
    });
}

describe('构造函数测试', function() {

    it('省略等待队列长度', function() {
        let q = new Qnext(3);
        assert.equal(q.activeLimit, 3);
        assert.equal(q.waitingLimit, Infinity);
    });

    it('设置等待队列长度', function() {
        let q = new Qnext(3, 2);
        assert.equal(q.activeLimit, 3);
        assert.equal(q.waitingLimit, 2);
    });

});

describe('基础测试', function() {

    let q = new Qnext(3, 2);

    it('测试队列长度', function() {
        for(let i = 1; i <= 3; i++) {
            q.add(function() {
                return makeAsync(10);
            });
            assert.equal(q.length, i, '队列总长度');
            assert.equal(q.activeLength, i, '活动队列长度');
            assert.equal(q.waitingLength, 0, '等待队列长度');
        }

        for(let i = 1; i <= 2; i++) {
            q.add(function() {
                return makeAsync(10);
            });
            assert.equal(q.length, i + 3, '队列总长度');
            assert.equal(q.activeLength, 3, '活动队列长度');
            assert.equal(q.waitingLength, i, '等待队列长度');
        }
    });

    it('测试refuse事件', function(done) {
        q.once('refuse', function() {
            assert.equal(q.length, 5, '队列总长度');
            assert.equal(q.activeLength, 3, '活动队列长度');
            assert.equal(q.waitingLength, 2, '等待队列长度');
            done();
        });

        q.add(function() {
            return makeAsync(10);
        });
    });

    it('测试empty事件', function(done) {
        q.once('empty', function() {
            assert.equal(q.length, 0, '队列总长度');
            assert.equal(q.activeLength, 0, '活动队列长度');
            assert.equal(q.waitingLength, 0, '等待队列长度');
            done();
        });
    });

});

describe('队列测试', function() {

    let q = new Qnext(2, 1);

    it('测试任务完成顺序1', function(done) {
        let vals = [];
        q.once('empty', function() {
            assert.equal(q.length, 0, '队列总长度');
            assert.deepEqual(vals, [1, 0, 2]);
            done();
        });
        q.add(function() {
            return makeAsync(20).then(() => vals.push(0));
        });
        q.add(function() {
            return makeAsync(15).then(() => vals.push(1));
        });
        q.add(function() {
            return makeAsync(10).then(() => vals.push(2));
        });
    });

    it('测试任务完成顺序2', function(done) {
        let vals = [];
        q.once('empty', function() {
            assert.equal(q.length, 0, '队列总长度');
            assert.deepEqual(vals, [1, 2, 0]);
            done();
        });
        q.add(function() {
            return makeAsync(20).then(() => vals.push(0));
        });
        q.add(function() {
            return makeAsync(10).then(() => vals.push(1));
        });
        q.add(function() {
            return makeAsync(5).then(() => vals.push(2));
        });
    });

    it('测试任务完成顺序3', function(done) {
        let vals = [];
        q.once('empty', function() {
            assert.equal(q.length, 0, '队列总长度');
            assert.deepEqual(vals, ['apple', 'suika', 'banana']);
            done();
        });
        q.add(function() {
            return makeAsync(20).then(() => {
                vals.push('banana');
            });
        });
        q.add(function() {
            return makeAsync(10).then(() => {
                vals.push('apple');

                q.add(function() {
                    return makeAsync(5).then(() => vals.push('suika'));
                });
            });
        });
    });

});