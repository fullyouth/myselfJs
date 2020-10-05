const Promise = require('./1.promise')
const p1 = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve(1)
  }, 1000)
})

p1.then((res) => {
  console.log('p1.then', res)
})