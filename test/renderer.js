import './setup.js'
import renderer, { Renderer } from '../render-worker.js'

describe('renderer', () => {
  it('is a Renderer instance', () => {
    expect(renderer).to.be.instanceof(Renderer)
  })
})

describe('renderer.setup(settings)', function () {
  this.timeout(5000)

  it('should setup the renderer with given settings', () => {
    const settings = {
      sampleRate: 44100
    }

    renderer.setup(settings)
  })
})

describe('renderer.updateRenderFunction(code)', () => {
  it('should update render function with new code', () => {
    const last = renderer.renderFunction.toString()

    renderer.updateRenderFunction(`

    `)

    expect(renderer.renderFunction.toString()).to.not.equal(last)
  })
})

describe('renderer.render()', () => {
  it('should render compiled render function', () => {
    renderer.render()
    renderer.render()
    renderer.render()
    renderer.render()
    renderer.render()
    renderer.render()
    renderer.render()

    const out = renderer.mem.output //[renderer.mem.loop.index]
    expect(out.subarray(0,3)).to.be.buffer([5,5,5]) //2.5,2.5,2.5])
  })
})
