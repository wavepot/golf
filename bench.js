import Mem from './typed-shared-array-object.js'
import Biquad_1 from './biquad.js'
import Biquad_2 from './biquad-old.js'
import * as biquad_1p from './biquad-pass.js'

const TIMES = 44100*10*2

const bench = (name, fn) => {
  console.time(name)
  for (let i = TIMES; i--;) fn()
  console.timeEnd(name)
}

const context = {
  mem: {
    biquad: new Mem({
      sampleRate: 'float',
      pi2: 'float',
      w0: 'float',
      sin_w0: 'float',
      cos_w0: 'float',
      a: 'float',
      c: 'float',
      alpha: 'float',
      gain: 'float',
      b0: 'float',
      b1: 'float',
      b2: 'float',
      a0: 'float',
      a1: 'float',
      a2: 'float',
    })
  }
}

let _ = context.mem.biquad
_.sampleRate = 44100
_.pi2 = 2 * Math.PI
_.gain = 1
// _.v1 = 1
// _.v2 = 2
// _.vm2 = -2
// _.v10 = 10
// _.v40 = 40

// _ = context2.mem.biquad
// _.sampleRate = 44100
// _.pi2 = 2 * Math.PI
// _.gain = 1
// _.v1 = 1
// _.v2 = 2
// _.vm2 = -2
// _.v10 = 10
// _.v40 = 40

const biquad_1 = Biquad_1(_)
const biquad_2 = Biquad_2(_.sampleRate)

const cases = [
  ['biquad new', () => {
    biquad_1.lp1(1000, .5)
    biquad_1.hp1(1100, .6)
    biquad_1.lp(1200, .7)
    biquad_1.hp(1300, .5, .2)
    biquad_1.bp(1400, .6, .3)
    biquad_1.ls(1500, .7, .4)
    biquad_1.hs(1600, .8, .5)
  }],
  ['biquad old', () => {
    biquad_2.lp1(1000, .5)
    biquad_2.hp1(1100, .6)
    biquad_2.lp(1200, .7)
    biquad_2.hp(1300, .5, .2)
    biquad_2.bp(1400, .6, .3)
    biquad_2.ls(1500, .7, .4)
    biquad_2.hs(1600, .8, .5)
  }],
]

setTimeout(() => {

cases.forEach(([name, fn, setup]) => bench(name, fn, setup))
cases.forEach(([name, fn, setup]) => bench(name, fn, setup))
cases.forEach(([name, fn, setup]) => bench(name, fn, setup))
cases.forEach(([name, fn, setup]) => bench(name, fn, setup))

}, 100)