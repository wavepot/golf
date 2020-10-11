import API from './api.js'
import Mem from './mem.js'
import Rpc from './rpc.js'
import { parseFn } from './util.js'

export class Renderer extends Rpc {
  constructor () {
    super()
  }

  setup (settings) {
    Object.assign(this, settings)
    this.api = new API()
    this.mem = new Mem(this)
    this.api._setup(this.mem)
  }

  renderFunction () {}
  updateRenderFunction (code) {
    const reset = parseFn(this.mem.reset).inner.replaceAll('this', 'mem')

    const func = new Function(`
      with (this) {
        const o = mem.output[mem.loop.index].LR
        const _ = mem.clock

        for (_.i = 0; _.i < 128; _.i++, _.n++) {
          _.s = _.n / _.sr
          _.t = _.n / _.br

          ${reset}

          snd('out')

          ${code}

          // TODO: add guard for out=not finite
          // TODO: merge to mono for now, later do stereo
          o[_.i].L = o[_.i].R = snd.out.self.c.x0 * .5
          //debugger
        }
      }
    `)

    this.renderFunction = func.bind(this.api)
  }

  render () {
    console.time('render')
    // debugger
    this.renderFunction()
    console.timeEnd('render')
  }
}

export default new Renderer().register(self)
