import './setup.js'
import Mem from '../mem.js'
import API from '../api.js'

describe('Mem', () => {
  it('create a memory struct for given sampleRate', () => {
    const m = new Mem(44100)
    const api = API()
    m.attach(api)
    // expect(m.output.length).to.equal(2048)
    expect(m.wavetable.sqr.length).to.equal(2**16)
    expect(m.wavetable.sqr.subarray(0,3)).to.be.buffer([1,1,1])

    console.log(m.length, m.byteLength)
  })
})