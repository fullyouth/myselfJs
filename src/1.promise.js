const STATUS = {
  PENGIND: 'pending',
  FULFILLED: 'fulfilled',
  REJECTED: 'rejected'
}

const isType = type => x => Object.prototype.toString.call(x) === type
const isObject = isType('[object Object]')
const isFunc = isType('[object Function]')

function resolvePromise(x, promise2, resolve, reject) {
  if (promise2 == x) { // 防止自己等待自己完成
    return reject(new TypeError('出错了'))
  }

  if (isObject(x) || isFunc(x)) {
    // x可以是一个对象 或者是函数
    let called;
    try {
      let then = x.then; // 就看一下这个对象是否有then方法
      // then是函数 我就认为这个x是一个promise
      // 如果x是promise 那么就采用他的状态
      if (isFunc(then)) {
        then.call(x, function (y) { // 调用返回的promise 用他的结果 作为下一次then的结果
          if (called) return
          called = true;
          // 递归解析成功后的值 直到他是一个普通值为止
          resolvePromise(y, promise2, resolve, reject);
        }, function (r) {
          if (called) return
          called = true;
          reject(r);
        })
      }else {
        resolve(x)
      }
    } catch (e) {
      if (called) return
      called = true;
      reject(e); // 取then时抛出错误了
    }
  } else {
    resolve(x); // x是一个原始数据类型 不能是promise
  }
}

class Promise {
  constructor(execute) {
    this.status = STATUS.PENGIND;
    this.value = undefined;
    this.reason = undefined;
    this.onResolvedCallbacks = [];
    this.onRejectedCallbacks = [];

    const resolve = (val) => {
      if (val instanceof Promise) { // 是promise 就继续递归解析
        return val.then(resolve, reject)
      }
      if (this.status === STATUS.PENGIND) {
        this.status = STATUS.FULFILLED;
        this.value = val;
        this.onResolvedCallbacks.forEach(fn => fn());
      }
    }
    const reject = (reason) => {
      if (this.status === STATUS.PENGIND) {
        this.status = STATUS.REJECTED;
        this.reason = reason
        this.onRejectedCallbacks.forEach(fn => fn())
      }
    }
    execute(resolve, reject)
  }

  then(onFulfilled, onRejected) {
    onFulfilled = isFunc(onFulfilled) ? onFulfilled : x => x
    onRejected = isFunc(onRejected) ? onRejected : err => { throw err }

    let promise2 = new Promise((resolve, reject) => {
      if (this.status === STATUS.FULFILLED) {
        setTimeout(() => {
          try {
            let x = onFulfilled(this.value);
            resolvePromise(x, promise2, resolve, reject)
          } catch (err) {
            reject(err)
          }
        }, 0)
      }
      if (this.status === STATUS.REJECTED) {
        setTimeout(() => {
          try {
            let x = onRejected(this.reason);
            resolvePromise(x, promise2, resolve, reject)
          } catch (err) {
            reject(err)
          }
        }, 0)
      }
      if (this.status === STATUS.PENGIND) {
        this.onResolvedCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onFulfilled(this.value);
              resolvePromise(x, promise2, resolve, reject)
            } catch (e) {
              reject(e);
            }
          }, 0);
        });
        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onRejected(this.reason);
              resolvePromise(x, promise2, resolve, reject)
            } catch (e) {
              reject(e);
            }
          }, 0);
        });
      }
    })
    return promise2
  }

  catch(err) {
    return this.then(null, err)
  }

  static resolve(val) {
    return new Promise((resolve, reject) => {
      resolve(val)
    })
  }

  static reject(reason) {
    return new Promise((resolve, reject) => {
      reject(reason)
    })
  }
}
// 执行 promises-aplus-tests[file] 测试
Promise.defer = Promise.deferred = function () {
  let dfd = {};
  dfd.promise = new Promise((resolve, reject) => {
    dfd.resolve = resolve;
    dfd.reject = reject
  })
  return dfd;
}
module.exports = Promise;