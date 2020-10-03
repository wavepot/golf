const toFinite = n => Number.isFinite(n) ? n : 0
const clamp = (min, max, n) => Math.max(min, Math.min(max, n))

function Delay(size){
  if (!(this instanceof Delay)) return new Delay(size);
  size = size || 512;
  this.buffer = new Float32Array(size);
  this.size = size;
  this.counter = 0;
  this._feedback = 0.5;
  this._delay = 100;
}

Delay.prototype.feedback = function(n){
  n = toFinite(n)
  this._feedback = n;
  return this;
};

Delay.prototype.delay = function(n){
  n = toFinite(n)
  this._delay = n;
  return this;
};

Delay.prototype.run = function(inp, mix = .5) {
  mix = toFinite(clamp(0, 1, mix))
  var back = this.counter - this._delay;
  if (back < 0) back = this.size + back;
  var index0 = Math.floor(back);

  var index_1 = index0 - 1;
  var index1 = index0 + 1;
  var index2 = index0 + 2;

  if (index_1 < 0) index_1 = this.size - 1;
  if (index1 >= this.size) index1 = 0;
  if (index2 >= this.size) index2 = 0;

  var y_1 = this.buffer[index_1];
  var y0 = this.buffer[index0];
  var y1 = this.buffer[index1];
  var y2 = this.buffer[index2];

  var x = back - index0;

  var c0 = y0;
  var c1 = 0.5 * (y1 - y_1);
  var c2 = y_1 - 2.5 * y0 + 2.0 * y1 - 0.5 * y2;
  var c3 = 0.5 * (y2 - y_1) + 1.5 * (y0 - y1);

  var out = ((c3*x+c2)*x+c1)*x+c0;

  this.buffer[this.counter] = inp + out*this._feedback;

  this.counter++;

  if (this.counter >= this.size) this.counter = 0;

  return out * mix + inp * (1-mix);
};

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
        end(run, context)
        return parent[prop] ?? parent
      }
      acc.push([prop])
      return add
    }
  }

  const proxy = new Proxy(parent, handler)

  return (a0,a1,a2,a3,a4) => {
    acc.splice(0)
    begin(context,a0,a1,a2,a3,a4)
    return proxy
  }
}

const exit = Object.fromEntries(['sin','on','out','repeat','_',Symbol.toPrimitive].map(key => [key, true]))

let i_c = 0
const contexts = []

let i_d = 0
const delays = []

const Fluent = (api, method) => {
  const init = (a0,a1,a2,a3,a4) => {
    let c = contexts[i_c]
    if (!c) {
      c = contexts[i_c] = Context()

      c.o = {}

      Object.assign(c.o, Object.fromEntries(
        Object.entries(api).map(([k, v]) => [k,
          Array.isArray(v)
          ? proxify(c, v, exit, c.o)
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
  const sin = (c,x) => {
    c._spare.push(c.x0)
    return Math.sin(x*TAU)
  }
  const noise = (c,x=123456) => {
    c._spare.push(c.x0)
    x=Math.sin(x+c.p)*100000
    return (x-Math.floor(x))*2-1
  }
  const eq = (c,...f) => {
    f.filter(Boolean).map(([[b0,b1,b2,a1,a2],amt=1],i) => {
      i *= 3

      c.y[i] = toFinite(b0*c.x0 + b1*c.x1 + b2*c.x2 - a1*c.y[i+1] - a2*c.y[i+2])
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
    c.x0 = d.delay(Math.floor($.br*4*sig)).feedback(feedback).run(c.x0, amt)
  }
  const val = (c,x) => x
  const hz = (c,x) => c.s*x
  const bt = (c,x) => c.t*(1/(x*16))
  const exp = (c,x) => c.x0*Math.exp(-c.t*x)
  const tanh = (c,x) => Math.tanh(c.x0*x)
  const mod = (c,x) => {
    x = toFinite(x) || 1
    x = x * 4
    c.s = c.s % x
    c.t = c.t % x // TODO: beatrate
    c.p = c.n % (x*c.$.br) // TODO: beatrate
    c._mod = x
  }
  const repeat = mod
  const offt = (c,x) => { c.t=toFinite((c.t+x)%c._mod) }
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
    delay,
    hz,
    bt,
    exp,
    tanh,
    mod,
    offt,
    eq,
    repeat,
    val,
    vol,
    mul,
    out,
    on,
  }

  const o = Object.fromEntries(
    Object.entries(api).map(([k,v]) =>
      [k,Fluent(api, k)]))

  const bp = (cut, res=.5, amt=1) => {
    cut = freqToFloat(cut)
    res = toFinite(res)
    amt = toFinite(clamp(0,1,amt))

    let b0 = 0.0, b1 = 0.0, b2 = 0.0
    let a1 = 0.0, a2 = 0.0

    if (cut > 0 && cut < 1) {
      if (res > 0) {
        const u = Math.PI * cut
        const a = Math.sin(u) / (2 * res)
        const k = Math.cos(u)
        const ia0 = 1 / (1 + a)

        b0 = a * ia0
        b1 = 0
        b2 = -a * ia0
        a1 = -2 * k * ia0
        a2 = (1 - a) * ia0
      } else {
        b0 = b1 = b2 = a1 = a2 = 0
      }
    } else {
      b0 = b1 = b2 = a1 = a2 = 0
    }

    return [[b0, b1, b2, a1, a2], amt]
  }

  o.bp = bp

  return o
}


const api = create()

let buffer
let render

const methods = {
  setup (data) {
    buffer = data.buffer
    $.sr = data.sampleRate
    $.br = data.beatRate
  },
  updateRenderFunction ({ value, n }) {
    api.sr = $.sr
    api.br = $.br
    render = new Function(...Object.keys(api), value).bind(null, ...Object.values(api))
    $.n = n
    methods.play()
  },
  play () {
    if (!render) return

    $._out[0] = buffer[0]

    console.time('play')
    for ($.i = 0; $.i < buffer[0].length; $.i++, $.n++) {
      $._out[0][$.i] =
      i_c =
      i_d = 0

      $.s = $.n/$.sr
      $.t = $.n/$.br // TODO: c.br = beatrate

      render()
      // sin(hz(300)).out()
      // $.n++
    }
    // node.playBuffer(buffer)

    console.timeEnd('play')

    postMessage({ call: 'play', n: $.n })
  }
}

onmessage = ({ data }) => methods[data.call](data)

addEventListener('error', error => {
  console.error('CAPTURE ERROR', error)
})
