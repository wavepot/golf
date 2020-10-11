let i = 0
let foo
foo: do {
  if (i === 0) {
    console.log('hi')
  }
  foo = 1; break foo
} while(0)
console.log(foo)
