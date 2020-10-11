import Struct, { nextPow2 } from './struct.js'
import Delay from './delay.js'
import Daverb from './daverb.js'

export default class Mem extends Struct {
  constructor ({ api, sampleRate: sr }) {
    super({
      loop: [{
        start: ['float'],
        end: ['float'],
        size: ['uint'],
        index: ['uint'],
      }],
      output: [2048, {
        LR: [128, { // TODO: test copying LR closest to Context memory
          L: ['float'], // TODO: bench interleaved vs non-interleaved
          R: ['float'],
        }]
      }],
      wavetable: [{
        len: ['uint'],
        coeff: ['float'],
        mask: ['uint'],
        ...Object.fromEntries(Object.keys(api.methods.t)
          .map(name => [name,
            ['float', 2**16]]))
      }],
      clock: [{
        bpm: ['float'],
        Br: ['uint'], // bar rate
        i: ['uint'],
        n: ['uint'],
        sr: ['uint'], // sample rate
        br: ['uint'], // beat rate
        s: ['float'],
        t: ['float'],
      }],
      biquad: [{
        sr: ['uint'], // sample rate
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
      }],
      fluent_index: ['uint'],
      fluent_named_index: ['uint'],
      context_index: ['uint'],
      context_named_index: ['uint'],
      contexts: [100, {
        p: ['uint'],
        s: ['float'],
        t: ['float'],

        x0: ['float'],
        x1: ['float'],
        x2: ['float'],

        _mod: [{
          t: ['float'],
          s: ['float'],
          p: ['float'],
        }],

        _zero: ['float', 0],

        _spare_index: ['uint'],
        _spare: ['float', 10],

        _filter_index: ['uint'],
        _filters: [30, {
          x1: ['float'],
          x2: ['float'],
          y0: ['float'],
          y1: ['float'],
          y2: ['float'],
        }],

        _delay_index: ['uint'],
        _delays: [3, {
          delay: ['float',sr]
        }],

        _daverb_index: ['uint'],
        _daverbs: [2, {
          sr: ['uint'],
          parameters: [{
            default: [{ // TODO: add min-max
              preDelay: ['uint'],
              bandwidth: ['float'],
              inputDiffusion1: ['float'],
              inputDiffusion2: ['float'],
              decay: ['float'],
              decayDiffusion1: ['float'],
              decayDiffusion2: ['float'],
              damping: ['float'],
              excursionRate: ['float'],
              excursionDepth: ['float'],
              wet: ['float'],
              dry: ['float'],
            }],
            local: [{
              seed: ['float'],
              preDelay: ['uint'],
              bandwidth: ['float'],
              inputDiffusion1: ['float'],
              inputDiffusion2: ['float'],
              decay: ['float'],
              decayDiffusion1: ['float'],
              decayDiffusion2: ['float'],
              damping: ['float'],
              excursionRate: ['float'],
              excursionDepth: ['float'],
              wet: ['float'],
              dry: ['float'],
            }],
          }],
          preDelay: ['float',sr],
          pDWrite: ['uint'],
          lp1: ['float'],
          lp2: ['float'],
          lp3: ['float'],
          excPhase: ['float'],
          Delays: [{...Daverb.TapDelays.map(x => [{
            array: ['float', nextPow2(x*sr)],
            len: ['uint'],
            read: ['uint'],
            mask: ['uint'],
          }])}],
          taps: ['uint', 14],
          cubic: [{
            frac: ['uint'],
            int: ['uint'],
            x0: ['float'],
            x1: ['float'],
            x2: ['float'],
            x3: ['float'],
            a: ['float'],
            b: ['float'],
            c: ['float'],
          }],
          lo: ['float'],
          ro: ['float'],
          pre: ['float'],
          split: ['float'],
          exc: ['float'],
          exc2: ['float'],
          temp: ['float'],
          out: ['float'],
        }],
      }]
    })

    this.context_named_index = 99
    this.contexts.forEach(c => {
      c.api = api
      c.mem = this
      c.delays = c._delays.map(_ => new Delay(_))
      c.daverbs = c._daverbs.map(_ => {
        _.sr = sr
        return new Daverb(_)
      })
    })
    this.fluent_named_index = 99

    this.clock.sr = sr

    this.biquad.sr = sr
    this.biquad.pi2 = 2 * Math.PI

    // calculate wavetables
    this.wavetable.len = 2**16
    this.wavetable.coeff = sr / this.wavetable.len
    this.wavetable.mask = this.wavetable.len - 1
    Object.entries(api.methods.t).forEach(([name, fn]) => {
      const table = this.wavetable[name]
      for (let i = 0, t = 0; i < this.wavetable.len; i++) {
        t = i / this.wavetable.len
        table[i] = fn(t, 1)
      }
    })

    this.samples = {}
    this.fetchSample = () => {
      // TODO:
    }
  }

  reset () {
    for (let i = 0, c; i < this.context_index; i++) {
      c = this.contexts[i]

      c.n = this.clock.n
      c.p = this.clock.n
      c.s = this.clock.s
      c.t = this.clock.t

      c.x2 = c.x1
      c.x1 = c.x0

      c._spare_index =
      c._filter_index =
      c._delay_index =
      c._daverb_index =
      c.x0 = 0

      // TODO: reset c._mod ?
    }

    for (let i = this.context_named_index + 1, c; i < 100; i++) {
      c = this.contexts[i]

      c.n = this.clock.n
      c.p = this.clock.n
      c.s = this.clock.s
      c.t = this.clock.t

      c.x2 = c.x1
      c.x1 = c.x0

      c._spare_index =
      c._filter_index =
      c._delay_index =
      c._daverb_index =
      c.x0 = 0
    }

    this.fluent_index = 0
    this.context_index = 0
  }

}
