const numberOfChannels = 1
const sampleRate = 44100
const length = 4096

let once = true
const proxify = (context,[begin,end],exit,parent) => {
  const acc = []

  const add = (a0,a1,a2,a3,a4) => {
    acc[acc.length-1].push(a0,a1,a2,a3,a4)
    return proxy
  }

  const run = () => {
    acc.splice(0).forEach(([method,a0,a1,a2,a3,a4]) =>
      parent[method](a0,a1,a2,a3,a4))
  }

  const handler = {
    get (obj, prop) {
      if (exit[prop]) {
        end(run, context())
        return parent[prop] ?? parent
      }
      acc.push([prop])
      return add
    }
  }

  const proxy = new Proxy(parent, handler)

  return (a0,a1,a2,a3,a4) => {
    acc.splice(0)
    begin(context(),a0,a1,a2,a3,a4)
    return proxy
  }
}

const exit = Object.fromEntries(['sin','on','out','repeat','_',Symbol.toPrimitive].map(key => [key, true]))

let ic = 0
const contexts = window.contexts = []

const Fluent = (api, method) => {
  let c

  const init = (a0,a1,a2,a3,a4) => {
    c = contexts[ic] = contexts[ic] ?? Context()
    ic++

    c.xm1 = c.x0
    c.x0 = 0

    c.i = c.$.i
    c.n = c.$.n
    c.p = c.$.n

    c.s = c.$.s
    c.t = c.$.t // TODO: c.br = beatrate

    return o[method](a0,a1,a2,a3,a4)
  }

  const o = {}

  Object.assign(o, Object.fromEntries(
    Object.entries(api).map(([k, v]) => [k,
      Array.isArray(v)
      ? proxify(() => c, v, exit, o)
      : (a0,a1,a2,a3,a4) => {
        c.x0 = v(c,a0,a1,a2,a3,a4) ?? c.x0
        return o
      }
    ])))

  o.valueOf =
  o[Symbol.toPrimitive] = () => (o.join(), c.x0)

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
  n: 1,
  i: 0,
  sr: sampleRate,
  x0: 0,
  xm1: 0,
  _mod: Infinity,
  _spare: [],
})

Object.assign($, Context())

const create = () => {
  const context = Context()
  const PI = Math.PI
  const TAU = 2*PI
  const join = (c) => c._spare.splice(0).reduce((p,n)=>p+n,c.x0)
  const sin = (c,x) => {
    c._spare.push(c.x0)
    return Math.sin(x*TAU)
  }
  const noise = (c,x=123456) => {
    c._spare.push(c.x0)
    x=Math.sin(x+c.p)*100000
    return (x-Math.floor(x))*2-1
  }
  const val = (c,x) => x
  const hz = (c,x) => c.s*x
  const bt = (c,x) => c.t*4*x
  const exp = (c,x) => c.x0*Math.exp(-c.t*x)
  const tanh = (c,x) => Math.tanh(c.x0*x)
  const mod = (c,x) => {
    x = x * 4
    c.s = c.s % x
    c.t = c.t % x // TODO: beatrate
    c.p = c.n % (x*c.sr) // TODO: beatrate
    c._mod = x
  }
  const repeat = mod
  const offt = (c,x) => { c.t=(c.t+x)%c._mod }
  const vol = (c,x) => c.x0*x
  const mul = vol
  const out = (c,x=1,send=0) => { c.x0=join(c); c.$._out[send][c.i]+=c.x0*x }
  const on = [
    (c,count,beat,mod) => { c._on = [count,beat,mod] },
    (run, { $, _on: [count,beat,mod=count] }) => {
      Math.floor($.t/(beat*4))%mod === count-1 && run()
    }
  ]
  const api = {
    join,
    sin,
    noise,
    hz,
    bt,
    exp,
    tanh,
    mod,
    offt,
    repeat,
    val,
    vol,
    mul,
    out,
    on,
  }
  return Object.fromEntries(
    Object.entries(api).map(([k,v]) =>
      [k,Fluent(api, k)]))
}


const api = create()
const { sin, offt, noise, val, mod, hz, repeat, exp, out } = api

const play = e => {
  $._out[0] = e.outputBuffer.getChannelData(0)

  console.time('play')
  for ($.i = 0; $.i < length; $.i++, $.n++) {
    $._out[0][$.i] = ic = 0

    $.s = $.n/$.sr
    $.t = $.n/$.sr // TODO: c.br = beatrate

    // sin(hz(300)).out()

    sin(mod(1/4).hz(35.881).exp(.057))
      .mod(1/4)
      .exp(5.82)
      .tanh(2.18).tanh(5.22)
        .on(7,1/4,8).tanh(15).vol(.3)
        .on(4,1/4).vol(0)
      .out(.7)

    sin(mod(1/8).hz(85.881).exp(.257)
        .on(3,1/2,4).mul(2))
      .mod(1/16)
      .exp(5.82)
      .tanh(10.18)
        .on(4,1/4).vol(0)
      .out(.12)

    mod(1/8).noise(133377).exp(19)
      .on(1,1/8,2).vol(0)
      .out(.3)

    mod(1/4).noise(500).exp(110)
      .offt(.983).noise(450).exp(110).vol(1.25)
      .offt(.969).noise(500).exp(110).vol(.9)
      .noise(8200).exp(7).vol(.1)
      .join()
        .on(1,1/4,4).vol(0)
        .on(3,1/4,4).vol(0)
      .out()

    mod(1/8).sin(hz(570)+val(5).mod(1/8).exp(20)).exp(5)
      .mod(1/8).noise(800).exp(8).vol(.015)
      .out(.2)

    $.n++
  }
  console.timeEnd('play')
}

let audio, script

document.body.onclick = () => {
  audio = new AudioContext({
    numberOfChannels,
    sampleRate,
    latencyHint: 'playback' // without this audio glitches
  })

  script = audio.createScriptProcessor(
    length,
    numberOfChannels,
    numberOfChannels
  )

  script.onaudioprocess = play

  const toggle = () => {
    script.connect(audio.destination)
    console.log('connected script')
    document.body.onclick = () => {
      script.disconnect(audio.destination)
      document.body.onclick = toggle
    }
  }

  toggle()
}
