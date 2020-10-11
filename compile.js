import { parseFn } from './util.js'

export default class Compiler {
  constructor ({ mem, api }) {
    this.mem = mem
    this.api = api
  }

  compile (inner) {
    const reset = parseFn(this.mem.reset).inner.replaceAll('this', 'mem')
    const body = `
      with (api) {
        const o = mem.output[mem.loop.index].LR
        const _ = mem.clock

        for (_.i = 0; _.i < 128; _.i++, _.n++) {
          _.s = _.n / _.sr
          _.t = _.n / _.br

          ${reset}

          ${inner}

          // TODO: add guard for out=not finite
          // TODO: merge to mono for now, later do stereo
          o.L[_.i] = o.R[_.i] = snd.out.self.c.x0
        }
      }
    `
    return new Function('api', body, this.api)
  }
}


// const new Function(
//       ...Object.keys(this.api), value
//     ).bind(null, ...Object.values(this.api))


// let context = Object.create({
//           console
//         });
//     const createSandbox = () => {

//         const proxy = new Proxy(context, {
//             set: (obj, prop, value) => {
//                 obj[prop] = value;
//             },
//             get: (obj, prop) => {
//                 return obj[prop];
//             },
//             has: () => {
//                 return true;
//             }
//         });
//         return code => {
//             return Function(
//                 'proxy',
//                 `
//                 with(proxy) {
//                     ;${code};
//                 }
//             `
//             ).bind(null, proxy);
//         };
//     };
//     const sandbox = createSandbox();
//     const fn = sandbox(`
//         var a = 1;
//         var b = 2;
//         console.log(a, b);
//         outterVariable = 'sandbox';
//         console.log(outterVariable);
//     `);

// console.log(context)
// fn()
// console.log(context)