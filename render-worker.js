import biquad from './biquad.js'
import Delay from './delay.js'
import {
  toFinite,
  clamp,
  proxify
} from './util.js'

const filterKeys = Object.keys(biquad())

let i_c = 0
const contexts = []

let i_d = 0
const delays = []

const sends = {}

const patterns = {}

const Fluent = (api, method) => {
  const init = (a0,a1,a2,a3,a4) => {
    let c = contexts[i_c]
    if (!c) {
      c = contexts[i_c] = Context()

      c.o = {}

      Object.assign(c.o, Object.fromEntries(
        Object.entries(api).map(([k, v]) => [k,
          Array.isArray(v)
          ? proxify(c, v, c.o)
          : (a0,a1,a2,a3,a4) => {

            c.x0 = toFinite(v(c,a0,a1,a2,a3,a4) ?? c.x0)
            return c.o
          }
        ])))

      c.o.valueOf =
      c.o[Symbol.toPrimitive] = () => (c.o.join(), c.x0)
    }

    i_c++

    c.x2 = c.x1
    c.x1 = c.x0
    c.x0 = 0

    c.i = c.$.i
    c.n = c.$.n
    c.p = c.$.n

    c.s = c.$.s
    c.t = c.$.t // TODO: c.br = beatrate

    // clear filter history if filters are added/removed
    // otherwise math blows up
    if (c._prev_filter_n !== c._curr_filter_n) {
      c.y.fill(0)
    }
    c._prev_filter_n = c._curr_filter_n
    c._curr_filter_n = 0

    // eq buffer position increment
    c._i_e = 0

    return c.o[method](a0,a1,a2,a3,a4)
  }

  return init
}

const $ = {
  _out: [new Float32Array]
}

const Context = () => ({
  ...$,
  $,
  t: 0,
  s: 0,
  n: 0,
  i: 0,
  sr: 0,
  br: 0,
  x0: 0,
  x1: 0,
  x2: 0,
  _i_e: 0,
  _curr_filter_n: 0,
  _prev_filter_n: 0,
  _mod: Infinity,
  _spare: [],
  y: new Float32Array(256),
})

Object.assign($, Context())

const create = () => {
  const context = Context()
  const PI = Math.PI
  const TAU = 2*PI
  const freqToFloat = (freq = 500) => toFinite(freq / ($.sr / 2))
  const join = (c) => c._spare.splice(0).reduce((p,n)=>p+n,c.x0)
  const gen = fn => (c,x) => { c._spare.push(c.x0); return fn(c,x) }
  const sin = gen((c,x) => Math.sin(c.s*x*TAU))
  const saw = gen((c,x) => 1-2*(c.s%(1/x))*x)
  const ramp = gen((c,x) => 2*(c.s%(1/x))*x-1)
  const tri = gen((c,x) => Math.abs(1-(2*c.s*x)%2)*2-1)
  const sqr = gen((c,x) => (c.s*x%1/x<1/x/2)*2-1)
  const pulse = gen((c,x,w=.5) => (c.s*x%1/x<1/x/2*w)*2-1)
  const noise = gen((c,x=123456) => {
    x=Math.sin(x+c.p)*100000
    return (x-Math.floor(x))*2-1
  })
  const eq = (c,...f) => {
    f.filter(Boolean).map(([[b0,b1,b2,a1,a2],amt=1],i) => {
      i = c._i_e
      c._i_e += 3
      c._curr_filter_n++

      c.y[i] = clamp(-1,1,toFinite(
        b0*c.x0
      + b1*c.x1
      + b2*c.x2
      - a1*c.y[i+1]
      - a2*c.y[i+2]
      ))

      c.y[i+2] = c.y[i+1]
      c.y[i+1] = c.y[i]

      return [c.y[i],amt]
    }).forEach(([y,amt]) => {
      c.x0 = c.x0*(1-amt) + y*amt
    })
  }
  const delay = (c,sig=1/16,feedback=.5,amt=.5) => {
    let d = delays[i_d] = delays[i_d] ?? new Delay($.br*8)
    i_d++
    return d.delay(Math.floor($.br*4*sig)).feedback(feedback).run(c.x0, amt)
  }
  const val = (c,x) => x
  const hz = (c,x) => c.s*x
  const bt = (c,x) => c.t*(1/(x*16))
  const exp = (c,x=10) => c.x0*Math.exp(-c.t*x)
  const tanh = (c,x=1) => Math.tanh(c.x0*x)
  const mod = (c,x=1) => {
    x = toFinite(x) || 1
    x = x * 4
    c.s = c.s % x
    c.t = c.t % x
    c.p = c.n % (x*c.$.br) // TODO: beatrate
    c._mod = x
  }
  const repeat = mod
  const offt = (c,x) => { c.t=toFinite((c.t+x)%c._mod) }
  const vol = (c,x) => c.x0*x
  const mul = vol
  const out = (c,x=1,send=0) => { c.$._out[send][c.i]+=c.o*x } // calls toPrimitive = join()
  const on = [
    (c,count,beat,mod) => { c._on = [count,beat,mod] },
    (run, { $, _on: [count,beat,mod=count] }) => {
      Math.floor($.t/(beat*4))%mod === count-1 && run()
    }
  ]
  const send = (c,key,amt=1) => {
    if (key in sends) {
      o.send[key] += c.x0*amt
    } else {
      o.send[key] = sends[key] = c.x0*amt
    }
  }
  const pat = (c,x) => {
    const vols = patterns[x] = patterns[x] ?? x.replace(/ {1,}|\n/g, ' ').trim().split(' ')
      .map(n => toFinite(parseFloat(n)))
    return c.x0 * vols[Math.floor(($.t/c._mod)%vols.length)]
  }
  const api = {
    join,
    sin,
    saw,
    ramp,
    tri,
    sqr,
    pulse,
    noise,
    delay,
    hz,
    bt,
    exp,
    tanh,
    mod,
    offt,
    pat,
    eq,
    send,
    repeat,
    val,
    vol,
    mul,
    out,
    on,
  }

  Object.assign(api, Object.fromEntries(
    filterKeys.map(key => [key, (c,a0,a1,a2,a3,a4) => eq(c,o[key](a0,a1,a2,a3,a4))])))

  const o = Object.fromEntries(
    Object.entries(api).map(([k,v]) =>
      [k,Fluent(api, k)]))

  return o
}


const api = create()

let buffer
let prev, render

$.clear = i => {
  let key

  $._out[0][i] =
  i_c =
  i_d = 0

  for (key in sends) api.send[key] = 0

  $.s = $.n/$.sr
  $.t = $.n/$.br // TODO: c.br = beatrate
}

const methods = {
  setup (data) {
    buffer = data.buffer
    $.sr = data.sampleRate
    $.br = data.beatRate
    Object.assign(api, biquad($.sr))
  },
  updateRenderFunction ({ value, n }) {
    api.sr = $.sr
    api.br = $.br
    prev = render
    render = new Function(...Object.keys(api), value).bind(null, ...Object.values(api))
    if (!prev) prev = render
    $.n = n
    methods.play()
  },
  play () {
    if (!render) return

    console.time('play')

    $._out[0] = buffer[0]

    $.clear(0)
    try {
      render()
    } catch (err) {
      console.error(err)
      render = prev
      render()
    }

    $.n++

    for ($.i = 1; $.i < buffer[0].length; $.i++, $.n++) {
      $.clear($.i)
      render()
    }

    console.timeEnd('play')

    postMessage({ call: 'play', n: $.n })
  }
}

onmessage = ({ data }) => methods[data.call](data)

addEventListener('error', error => {
  console.error('CAPTURE ERROR', error)
})
