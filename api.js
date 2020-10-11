import biquad from './biquad.js'
import { toFinite, parseFn } from './util.js'

export const api = {
  t: {
    sin:  (t,x) => Math.sin(t*x*2*Math.PI),
    cos:  (t,x) => Math.cos(t*x*2*Math.PI),
    tri:  (t,x) => Math.abs(1-(2*t*x)%2)*2-1,
    saw:  (t,x) => 1-2*(t%(1/x))*x,
    ramp: (t,x) =>   2*(t%(1/x))*x-1,
    sqr:  (t,x) =>       (t*x%1/x<1/x/2)*2-1,
    pulse: (t,x,w=.9) => (t*x%1/x<1/x/2*w)*2-1,
    noise: (t,x=1) => (x=Math.sin(x+t)*10e4, (x-Math.floor(x))*2-1),
    log:  (t,x=1) => Math.log1p(t*x),
    exp: (t,x=10) => Math.exp(-t*x),
  },
  x0: {
    val: (_,x)  => +x,
    mul: (x0,x) => x0*x,
    div: (x0,x) => x0/x,
    add: (x0,x) => x0+x,
    sub: (x0,x) => x0-x,
    pow: (x0,x) => x0**x,
    min: (x0,x=1)  => Math.max(x0,x),
    max: (x0,x=-1) => Math.min(x0,x),
    abs:  (x0,x=1) => Math.abs(x0*x),
    sqrt: (x0,x=1) => Math.sqrt(x0*x),
    atan: (x0,x=1) => Math.atan(x0*x),
    tanh: (x0,x=1) => Math.tanh(x0*x),
  },
  c: {
    pop: (c) =>
      c._spare[--c._spare_index],
    push: (c) => {
      c._spare[c._spare_index++] = c.x0
    },
    join: (c) => {
      c._spare_index = 0
      c.x0 = c.x0
      + c._spare[0] // inline as optimization
      + c._spare[1] // TODO: bench
      + c._spare[2]
      + c._spare[3]
      + c._spare[4]
      + c._spare[5]
      + c._spare[6]
      + c._spare[7]
      + c._spare[8]
      + c._spare[9]
    },
    sample: (c,id) => {
      let s = c.mem.samples[id]
      if (!s) {
        s = c.mem.samples[id] = c._zero
        c.mem.fetchSample(id)
      }
      c.x0 = s[0][c.p % s[0].length]
    },
    delay: (c,sig=1/16,feedback=.5,amt=.5) => {
      const d = c.delays[c._delay_index++]
      c.x0 = d.delay((c.mem.clock.Br*sig)|0).feedback(feedback).run(c.x0, amt)
    },
    daverb: (c,x={}) => {
      const dv = c.daverbs[c._daverb_index++]
      c.x0 = dv.process(c.x0,x)
    },
    out: (c,x=1) => {
      c.api.snd.out.self.c.x0 += c.x0*x
    },
    send: (c,id,amt=1) => {
      if (id in c.api.snd) {
        c.api.snd[id].self.c.x0 += c.x0*amt
      } else {
        c.api.snd(id).self.c.x0 = c.x0*amt
      }
    },
  },
  c_ig: {
    mod: (c,ig,x=1) => {
      x = toFinite(x) || 1 // TODO: do we need toFinite here?
      x = x * 4
      c._mod[ig] = x
      c[ig] = c[ig] % x
    },
    modn: (c,ig,x=1) => { // modn types handle negative values
      x = toFinite(x) || 1 // TODO: do we need toFinite here?
      x = x * 4
      c._mod[ig] = x
      c[ig] = (c[ig] % x + x) % x // but are more costly
    },
    on: (c,ig,x,measure,count=x) => {
      if (((c.mem.clock[ig]/(x*4))|0)%count !== x-1) {
        return this._ignoreNext
      }
    },
    onall: (c,ig,x,measure,count=x) => {
      if (((c.mem.clock[ig]/(x*4))|0)%count !== x-1) {
        return ignoreAll
      }
    },
  },
}

// here, we are compiling functions instead of wrapping
// because there is 3x-10x speed improvement this way :)
const compile = (args, body, writeValue, igName, igValue) => {
  let pre = []

  if (body[0] !== '{') { // implicit return = write value
    body = `c.${writeValue} = (${body})`
  } else {
    body = body.split('\n').slice(1,-1).join('\n').trim()
  }

  if (args[0] === 'ig') {
    pre.push(`const ig = "${writeValue}"`)
    args = args.slice(1)
  }

  let func

  eval(`func = function (${args}) {
    const c = this.c

    ${pre.join('\n')}

    ${igName ? `const ${igName} = c.${igValue}` : ''}

    ${body}

    return this
  }`)

  return func
}

const buildMethods = (integrator, name, fn) => {
  const result = []

  // parse function source
  let { args, body, inner } = parseFn(fn)
  let [_ig, ...rest] = args

  // integrator/compiler heuristics and enhancements
  if (integrator === 't') {
    if (['log','exp'].includes(name)) { // common case "t", special case "s"
      result.push([name,     compile(rest, body, 'x0', 't', 't')])
      result.push(['s'+name, compile(rest, body, 'x0', 't', 's')])
    } else { // common case "s", special case "t"
      result.push([name,     compile(rest, body, 'x0', 't', 's')])
      result.push(['t'+name, compile(rest, body, 'x0', 't', 't')])
    }
    // TODO: wavetables should store state for smooth freq shifting?
    body = 'c.mem.wavetable.' + name + '[p*x*c.mem.wavetable.coeff & mem.wavetable.mask]'
    result.push(['w'+name,   compile(rest, body, 'x0', 'p', 'p')])
  } else if (integrator === 'x0') {
    result.push([name,       compile(rest, body, 'x0', 'x0', 'x0')])
    result.push(['p'+name,   compile(rest, body, 'p', 'x0', 'p')])
    result.push(['s'+name,   compile(rest, body, 's', 'x0', 's')])
    result.push(['t'+name,   compile(rest, body, 't', 'x0', 't')])
  } else if (integrator === 'c_ig') {
    result.push([name,       compile(rest, body, 't')])
    result.push(['p'+name,   compile(rest, body, 'p')])
    result.push(['s'+name,   compile(rest, body, 's')])
  } else if (integrator === 'c') {
    result.push([name,       compile(rest, body, 'x0')])
  } else {
    throw new TypeError('Invalid integrator: ' + integrator)
  }

  return result
}

const publicMethods = methodName => methodName[0] !== '_' && methodName !== 'constructor'

class Fluent {
  constructor () {
    this._methodNames =
      Object.getOwnPropertyNames(
      Object.getPrototypeOf(this))
      .filter(publicMethods)

    this._ignoreNext = this._ignoreNext.bind(this)
    this._returnThis = this._returnThis.bind(this)
    this._returnThisApi = Object.fromEntries(
      this._methodNames.map(name => [name, this._returnThis]))

    this._entry =
      Object.fromEntries(
      this._methodNames.map(name => {
        let target = name

        // on.as().entry() becomes an .onall()
        if (target === 'on') target = 'onall'

        return [name, this[target].bind(this)]
      }))

    this._entry.self = this

    return this._entry
  }
  _returnThis () { return this }
  _ignoreNext () { return this._returnThisApi }
}

Object.assign(Fluent.prototype,
  Object.fromEntries(
  Object.entries(api).map(([ig, proto]) =>
    Object.entries(proto).map(([method, fn]) =>
      buildMethods(ig, method, fn)
    ).flat()
  ).flat()))

Object.assign(Fluent.prototype, biquad())

const fluentMethodNames =
  Object.getOwnPropertyNames(Fluent.prototype)
  .filter(publicMethods)

const noop = function () { return this }
const ignoreAll = Object.fromEntries(
  fluentMethodNames.map(name => [name, noop]))

const bindAllMethods = instance => {
  Object.getOwnPropertyNames(
  Object.getPrototypeOf(instance))
  .filter(publicMethods)
  .forEach(method => {
    instance[method] = instance[method].bind(instance)
  })
}

class API {
  methods = api

  constructor () {
    bindAllMethods(this)
  }

  _setup (mem) {
    this.mem = mem
    // TODO: investigate/bench Symbol.for()
    this.mem.fluent_pool = Array(100).fill(0).map(() => new Fluent())
  }

  // purposefully ambiguous because
  // sEnds and sOUnds are the same entities
  snd (id) {
    // TODO: investigate/bench Symbol.for(id)
    let fluent = this.snd[id]

    if (!fluent) {
      fluent = this.mem.fluent_pool[this.mem.fluent_named_index--]
      fluent.self.c = this.mem.contexts[this.mem.context_named_index--]
      this.snd[id] = fluent
    }

    return fluent
  }
}

// we eval to inline "name" instead of wrapping
// because function calls/scope access are expensive
// and kill instruction inlining :(
Object.assign(API.prototype,
  Object.fromEntries(fluentMethodNames.map(name => {
    let func
    eval(`func = function (a0,a1,a2,a3,a4) {
      const fluent = this.mem.fluent_pool[this.mem.fluent_index++]
      fluent.self.c = this.mem.contexts[this.mem.context_index++]
      return fluent.${name}(a0, a1, a2, a3, a4)
    }`)
    return [name, func]
  })))

export default API








// class CaptureMany {
//   constructor () {
//     this.end = function () {
//       for (let [method,a0,a1,a2,a3,a4] of this.calls) {
//         this.parent[method](a0,a1,a2,a3,a4)
//       }
//       // this.calls.forEach(([method,a0,a1,a2,a3,a4]) =>
//       //   this.parent[method](a0,a1,a2,a3,a4))
//     }.bind(this)
//     return this.end
//   }
// }

// Object.assign(CaptureMany.prototype,
//   Object.fromEntries(
//     Object.entries(fluent).map(([name]) => [name,
//       eval(
//         'function (a0,a1,a2,a3,a4) {'
//       + '  this.calls.push(["' + name + '",a0,a1,a2,a3,a4]);'
//       + '  return this;'
//       + '}'
//       )])))

// CaptureMany.prototype.out = function (a0,a1,a2) {
//   for (let [method,a0,a1,a2,a3,a4] of this.calls) {
//     this.parent[method](a0,a1,a2,a3,a4)
//   }
//   return this.parent.out(a0,a1,a2)
// }

// CaptureMany.prototype.on = function (a0,a1,a2) {
//   for (let [method,a0,a1,a2,a3,a4] of this.calls) {
//     this.parent[method](a0,a1,a2,a3,a4)
//   }
//   return this.parent.on(a0,a1,a2)
// }

// CaptureMany.prototype[Symbol.toPrimitive] = function () {
//   this.calls.forEach(([method,a0,a1,a2,a3,a4]) =>
//     this.parent[method](a0,a1,a2,a3,a4))
//   return this.parent[Symbol.toPrimitive]()
// }
