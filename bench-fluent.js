import Struct from './struct.js'
import Fluent from './fluent.js'
import osc from './osc.js'
import { toFinite } from './util.js'

const TIMES = 2**25
console.log('TIMES:', TIMES)
const bench = ([name, fn]) => {
  console.time(name)
  for (let i = TIMES; i--;) fn()
  console.timeEnd(name)
}

const c = new Struct({
  sr: ['float'],
  x0: ['float'],
  x: ['float'],
  t: ['float'],
  s: ['float'],
  n: ['float'],
  p: ['float'],
})

c.sr = 44100
// const c = {
//   x0: 0,
//   t: 0,
//   s: 0,
//   n: 0,
//   p: 0,
// }
const getContext = () => c

const fluent = Fluent(osc, (methodName, fn, pre = '') => {
  let func

  let [args, body] = fn.toString().split('=>')

  args.replace(/[\(\)]/, '').split(',')

  if (body[0] === '{') { // regular return
    body = body.replace('return ', 'c.x0 = ')
  } else { // implicit return
    body = 'c.x0 = (' + body + ');'
  }

  eval('func = function (x) {'
  + pre
  + 'let c = this.c;'
  + 'let t = c.s;'
  + 'c.x0 = ('
  + body
  + ');'
  + 'return this}')

  return func
})

const cases = [
  ['fluent chain', () => {
    c.n++
    c.s = c.n/c.sr
    fluent.tri(100).saw(100).sqr(100).sin(100)
  }],
  // ['fluent each', () => {
  //   c.n++
  //   c.s = c.n/c.sr
  //   fluent.tri(100)
  //   fluent.saw(100)
  //   fluent.sqr(100)
  //   fluent.sin(100)
  // }],
  // ['osc', () => {
  //   c.n++
  //   c.s = c.n/c.sr
  //   c.x0 = osc.tri(c.s,100)
  //   c.x0 = osc.saw(c.s,100)
  //   c.x0 = osc.sqr(c.s,100)
  //   c.x0 = osc.sin(c.s,100)
  // }],
  // ['raw', () => {
  //   c.n++
  //   c.s = c.n/c.sr
  //   c.x0 = Math.abs(1-(2*c.s*100)%2)*2-1
  //   c.x0 = 1-2*(c.s%(1/100))*100
  //   c.x0 = (c.s*100%1/100<1/100/2)*2-1
  //   c.x0 = Math.sin(c.s*100*2*Math.PI)
  // }],
]

for (let i = 0; i < 5; i++) {
  for (let cs of cases) {
    c.n = 0
    bench(cs)
    console.log(c.x0)
  }
}

console.log(c.x0)