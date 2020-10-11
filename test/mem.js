import './setup.js'
import Mem from '../mem.js'

describe('Mem', () => {
  it('create a memory struct for given sampleRate', () => {
    const m = new Mem({
      api: { methods: { t: { inc: (t,x) => x+1 } } },
      sampleRate: 44100
    })
    expect(m.output.length).to.equal(2048)
    expect(m.wavetable.inc.length).to.equal(2**16)
    expect(m.wavetable.inc.subarray(0,3)).to.be.buffer([2,2,2])
  })
})