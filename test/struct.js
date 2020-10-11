import './setup.js'
import Struct from '../struct.js'

describe('Struct', () => {
  it('single struct', () => {
    const o = new Struct({
      i: ['uint'],
      n: ['uint'],
      s: ['float'],
      t: ['float'],
      chunki: ['uint',4],
      chunkf: ['float',4],
    })

    o.i = 1
    o.n = 2
    o.s = 5.5
    o.t = 6.5
    o.chunki = [7,8,9,10]
    o.chunkf = [1.1, 1.2, 1.3, 1.4]

    expect(o.uint.subarray(0,2)).to.be.buffer([1,2])
    expect(o.float.subarray(2,4)).to.be.buffer([5.5,6.5])
    expect(o.uint.subarray(4,8)).to.be.buffer([7,8,9,10])
    expect(o.float.subarray(8,12)[0]).to.closeTo(1.1,.01)
    expect(o.float.subarray(8,12)[1]).to.closeTo(1.2,.01)
    expect(o.float.subarray(8,12)[2]).to.closeTo(1.3,.01)
    expect(o.float.subarray(8,12)[3]).to.closeTo(1.4,.01)

    expect(o.i).to.equal(1)
    expect(o.n).to.equal(2)
    expect(o.s).to.be.closeTo(5.5,.01)
    expect(o.t).to.be.closeTo(6.5,.01)
    expect(o.chunki[0]).to.equal(7)
    expect(o.chunkf[0]).to.be.closeTo(1.1,.01)
  })

  it('struct pass buffer', () => {
    const o = new Struct({
      pad: ['uint',3],
      big: ['uint',10],
    })
    o.big = [1,2,3,4,5,6,7,8,9,10]
    expect(o.uint).to.be.buffer([0,0,0,1,2,3,4,5,6,7,8,9,10])

    const nested = new Struct({
      a: ['uint'],
      b: ['uint',2]
    }, o.big)

    nested.a = 101
    nested.b = [102,103]
    expect(o.uint).to.be.buffer([0,0,0,101,102,103,4,5,6,7,8,9,10])
  })

  it('nested inline struct', () => {
    const o = new Struct({
      pad: ['uint',3],
      nested: [{
        i: ['uint'],
        n: ['uint'],
      }],
    })

    o.nested.uint.set([1,2])

    expect(o.uint).to.be.buffer([0,0,0,1,2])
    expect(o.nested.uint).to.be.buffer([1,2])
    expect(o.nested.i).to.equal(1)
    expect(o.nested.n).to.equal(2)

    o.nested.i = 11
    o.nested.n = 12

    expect(o.uint).to.be.buffer([0,0,0,11,12])
    expect(o.nested.uint).to.be.buffer([11,12])
    expect(o.nested.i).to.equal(11)
    expect(o.nested.n).to.equal(12)
  })

  it('nested pool struct', () => {
    const o = new Struct({
      pad: ['uint',3],
      nested: [3, {
        i: ['uint'],
        n: ['uint'],
      }],
    })

    expect(o.nested.length).to.equal(3)

    o.nested[0].uint.set([1,2])

    expect(o.uint).to.be.buffer([0,0,0,1,2,0,0,0,0])
    expect(o.nested[0].uint).to.be.buffer([1,2])
    expect(o.nested[0].i).to.equal(1)
    expect(o.nested[0].n).to.equal(2)

    o.nested[0].i = 11
    o.nested[0].n = 12

    expect(o.uint).to.be.buffer([0,0,0,11,12,0,0,0,0])
    expect(o.nested[0].uint).to.be.buffer([11,12])
    expect(o.nested[0].i).to.equal(11)
    expect(o.nested[0].n).to.equal(12)

    o.nested[2].uint.set([3,4])

    expect(o.uint).to.be.buffer([0,0,0,11,12,0,0,3,4])
  })

  it('deeply nested pool struct', () => {
    const o = new Struct({
      pad: ['uint',3],
      nested: [2, {
        i: ['uint'],
        n: ['uint'],
        deep: [2, {
          x: ['uint'],
          y: ['uint'],
        }]
      }],
      f: ['uint', 6]
    })

    expect(o.nested.length).to.equal(2)

    o.nested[0].uint.set([1,2])

    expect(o.uint).to.be.buffer([0,0,0, 1,2, 0,0,0,0, 0,0, 0,0,0,0, 0,0,0,0,0,0])
    expect(o.nested[0].uint).to.be.buffer([1,2, 0,0,0,0])
    expect(o.nested[0].i).to.equal(1)
    expect(o.nested[0].n).to.equal(2)

    o.nested[0].i = 11
    o.nested[0].n = 12

    expect(o.uint).to.be.buffer([0,0,0, 11,12, 0,0,0,0, 0,0, 0,0,0,0, 0,0,0,0,0,0])
    expect(o.nested[0].uint).to.be.buffer([11,12, 0,0,0,0])
    expect(o.nested[0].i).to.equal(11)
    expect(o.nested[0].n).to.equal(12)

    o.nested[1].uint.set([3,4])

    expect(o.uint).to.be.buffer([0,0,0, 11,12, 0,0,0,0, 3,4, 0,0,0,0, 0,0,0,0,0,0])

    o.nested[0].deep[0].x = 21
    o.nested[0].deep[1].y = 22

    expect(o.uint).to.be.buffer([0,0,0, 11,12, 21,0,0,22, 3,4, 0,0,0,0, 0,0,0,0,0,0])

    o.nested[1].deep[0].x = 31
    o.nested[1].deep[1].y = 32

    expect(o.uint).to.be.buffer([0,0,0, 11,12, 21,0,0,22, 3,4, 31,0,0,32, 0,0,0,0,0,0])

    o.f = [6,6,6,7,7,7]

    expect(o.uint).to.be.buffer([0,0,0, 11,12, 21,0,0,22, 3,4, 31,0,0,32, 6,6,6,7,7,7])
  })

  it('pass arraybuffer', () => {
    const typeDef = {
      pad: ['uint',3],
      nested: [2, {
        i: ['uint'],
        n: ['uint'],
        deep: [2, {
          x: ['uint'],
          y: ['uint'],
        }]
      }],
    }

    const o = new Struct(typeDef)
    o.nested[0].uint.set([1,2])
    o.nested[0].i = 11
    o.nested[0].n = 12
    o.nested[1].uint.set([3,4])
    o.nested[0].deep[0].x = 21
    o.nested[0].deep[1].y = 22
    o.nested[1].deep[0].x = 31
    o.nested[1].deep[1].y = 32
    expect(o.uint).to.be.buffer([0,0,0, 11,12, 21,0,0,22, 3,4, 31,0,0,32])
    const p = new Struct(typeDef, o.buffer)
    expect(p.uint).to.be.buffer([0,0,0, 11,12, 21,0,0,22, 3,4, 31,0,0,32])
    expect(p.nested[1].deep[0].x).to.equal(31)
  })
})
