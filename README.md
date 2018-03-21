# qnext

一个轻量级Node.js异步任务并发控制库

## 安装

```
npm install qnext --save
```

## 介绍

控制异步任务的并发数是Node.js中一个很常见的需求：

```js
const fetch = require('node-fetch');

for(let i = 0; i < 100; i++) {
    fetch('http://localhost/post/' + i);
}
```

上面的代码会导致瞬间发起大量的异步请求，通常这种行为并不是我们所期望的，因为会导致请求的服务无法同时处理那么大量的请求

`qnext.js`能帮助我们维持一个异步任务执行队列，将并发数限定在指定的数值内：

```js
const fetch = require('node-fetch');
const Qnext = require('qnext');

let queue = new Qnext(3);   // 最大并发数限制为3
for(let i = 0; i < 100; i++) {
    queue.add(function() {
        return fetch('http://localhost/post/' + i);
    });
}
```

现在这100个请求不会同时发出了，仅会同时发出3个请求，每当有请求完成，再发起等待队列中的下一个请求

## 属性与方法

### constructor(activeLimit, waitingLimit)

- activeLimit: `number`

    活动队列最大长度，当活动队列已满时，继续添加任务会进入等待队列等待执行

- waitingLimit?: `number`
    
    等待队列最大长度，当等待队列已满时，继续添加任务会被拒绝，并触发`refuse`事件

    `waitingLimit`默认为`Infinity`，所以`waitingLimit`为默认值时不需要监听`refuse`事件

### qnext.add(task)

添加一个任务到任务队列中，如果活动队列未满，任务会添加到活动队列并立即执行

如果活动队列已满但等待队列未满，任务会添加到等待队列，当活动队列有空时再被执行

如果活动队列和等待队列都已满时，添加任务操作会被拒绝，返回`false`，并触发`refuse`事件

- task: `function`

    `task`是一个返回Promise实例的函数

### qnext.length

当前任务队列长度，任务队列长度是指正在执行的任务与等待执行的任务数量总和

### qnext.activeLength

当前活动队列任务数量

### qnext.waitingLength

当前等待队列任务数量

### qnext.on('empty', callback)

- callback: `function`
    
    当任务队列为空时触发，一个Qnext实例被创建时任务队列为空，但不会触发该事件

### qnext.on('refuse', callback)

- callback: `function`
    
    当任务队列长度达到上限时调用`qnext.add`会触发该事件，任务不会进入任务队列

    `refuse`事件是同步的，意味着需要在调用`qnext.add`之前监听，否则会遗漏监听之前的`refuse`事件

## 使用示例

基本用法：

```js
const fetch = require('node-fetch');
const Qnext = require('qnext');

let queue = new Qnext(3);

for(let i = 0; i < 100; i++) {
    // 将一个"任务"添加到队列中，"任务"是一个执行后返回一个Promise实例的函数
    queue.add(function() {
        return fetch('http://localhost/post/' + i).then(res => {
            // ...
        }).catch(err => {
            // ...
        });
    });
}

// 当任务队列为空时触发（即任务队列中所有任务都已完成）
queue.on('empty', function() {
    // ...
});
```

使用`maxLength`选项：

```js
const fetch = require('node-fetch');
const Qnext = require('qnext');

let queue = new Qnext(2, 1);    // 活动队列长度最大为2，等待队列长度最大为1

// 当任务队列长度达到上限时，继续添加任务会触发refuse事件，任务不会进入任务队列
// refuse事件是同步的，所以请在调用queue.add之前监听
queue.on('refuse', function() {
    // ...
});

let fetchPost = (id) => () => fetch('http://localhost/post/' + id);

queue.add(fetchPost(0));    // 加入队列并立即执行
queue.add(fetchPost(1));    // 加入队列并立即执行
queue.add(fetchPost(2));    // 加入队列并等待执行
queue.add(fetchPost(3));    // 加入队列被拒绝，触发refuse事件
queue.add(fetchPost(4));    // 加入队列被拒绝，触发refuse事件
```

在express中使用的示例：

```js
const Qnext = require('qnext');

// 等待队列长度最大为0，即不存在等待执行的队列，只有立即执行和拒绝两种情况
let qnext = new Qnext(10, 0);

router.get('/:id', function(req, res, next) {

    function dosomething(id) {
        return promise;
    }

    let success = qnext.add(function() {
        return dosomething(req.params.id).then(result => {
            res.end(result);
        }).catch(err => {
            next(err);
        });
    });
    
    if(!success) {
        res.status(429).end('已达到处理上限，暂时无法处理该请求');
    }
});
```