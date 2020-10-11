import Struct from './struct.js'
import Biquad_1 from './biquad.js'
import Osc_1 from './osc.js'
import Osc_2 from './osc-old.js'

const TIMES = 2**21
console.log('TIMES:', TIMES)
const bench = ([name, fn]) => {
  // console.time(name)
  let now = performance.now()
  for (let i = TIMES; i--;) fn()
  console.log(name, performance.now() - now)
  // console.timeEnd(name)
}

const context = {
  mem: {
    biquad: new Struct({
      sampleRate: ['float'],
      pi2: ['float'],
      w0: ['float'],
      sin_w0: ['float'],
      cos_w0: ['float'],
      a: ['float'],
      c: ['float'],
      alpha: ['float'],
      gain: ['float'],
      b0: ['float'],
      b1: ['float'],
      b2: ['float'],
      a0: ['float'],
      a1: ['float'],
      a2: ['float'],
    })
  }
}

let _ = context.mem.biquad
_.sampleRate = 44100
_.pi2 = 2 * Math.PI
_.gain = 1

const c = {
  t: 0,
  s: 0,
  p: 0,
}

const biquad_1 = Biquad_1(_)
const osc_1 = Osc_1
const osc_2 = Osc_2()

let pf_1 = 0
let pf_2 = 0

const dummy = { another: () => Math.random() }
dummy.another = (t,x) => osc_1.sin(t,x)
dummy.yet = (t,x) => dummy.another(t,x)
const cases = [
  ['osc new', () => {
    c.s += 0.0001
    c.p++
    osc_1.sin(c.s,100)
    osc_1.saw(c.s,100)
    osc_1.tri(c.s,100)
    osc_1.sqr(c.s,100)
    osc_1.pulse(c.s,100)
    osc_1.noise(c.p,100)
    dummy.yet(c.s,100)
    dummy.another(c.s,100)
  }],
  ['dummy', () => {
    osc_1.sin(c.s,100)
  }]
  // ['biquad new', () => {
  //   biquad_1.lp1(1000, .5)
  //   biquad_1.hp1(1100, .6)
  //   biquad_1.lp(1200, .7)
  //   biquad_1.hp(1300, .5, .2)
  //   biquad_1.bp(1400, .6, .3)
  //   biquad_1.ls(1500, .7, .4)
  //   biquad_1.hs(1600, .8, .5)
  // }],
  // ['osc old', () => {
  //   c.s += 0.0001
  //   c.p++
  //   osc_2.sin(c,100)
  //   osc_2.saw(c,100)
  //   osc_2.tri(c,100)
  //   osc_2.sqr(c,100)
  //   osc_2.pulse(c,100)
  //   osc_2.noise(c,100)
  //   // pf_1 += performance.now() - pf_1

  //   // pf_2 = performance.now()
  //   // osc_2.xsin(c.s, 100)
  //   // osc_2.xsaw(c.s, 100)
  //   // osc_2.xtri(c.s, 100)
  //   // osc_2.xsqr(c.s, 100)
  //   // osc_2.xpulse(c.s, 100)
  //   // osc_2.xnoise(c.s, c.p, 100)
  //   // pf_2 += performance.now() - pf_2

  // }],
]

setTimeout(() => {

for (let i = 0; i < 5; i++) {
  // pf_1 = 0
  // pf_2 = 0
  // for (let cs of cases) {
    bench(cases[0])
    // bench(cases[1])
  // }
  // cases.forEach(cs => bench(cs))
  // [cases[1]].forEach(cs => bench(cs))
  // bench('new', cases[1][1])
  // bench('old', cases[1][1])
  // console.log('old', pf_1)
  // console.log('new', pf_2)
}


}, 100)