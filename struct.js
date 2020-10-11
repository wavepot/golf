const types = {
  'uint': Uint32Array,
  'float': Float32Array,
}

export const nextPow2 = n => 2**Math.ceil(Math.log2((n)))

const calcLength = elements => {
  return Object.entries(elements).reduce((p, [_, typeDef]) => {
    let [typeName, length = 1, _typeDef] = typeDef
    if (typeof typeName === 'object') {
      length = calcLength(typeName)
      typeDef[1] = length
    } else if (typeof typeName === 'number') {
      if (_typeDef) {
        length = typeName * length
      } else {
        typeDef[2] = length
        length = calcLength(length)
        typeDef[1] = length
        length = typeName * length
      }
    }
    return p + length
  }, 0)
}

export default class Struct {
  constructor (elements, view) {
    // determine buffer length in elements
    this.length = calcLength(elements)
    this.offset = 0

    if (view) {
      if (ArrayBuffer.isView(view)) {
        this.buffer = view.buffer
        this.offset = view.byteOffset
      } else {
        this.buffer = view
      }
    } else {
      // calculate size in bytes
      // and optimize by rounding up to next power of two
      const lengthPow2 = nextPow2(this.length * 4)

      // create buffer
      this.buffer = new SharedArrayBuffer(lengthPow2)
      this.offset = 0
    }

    // create typed array views pointing to the buffer
    Object.entries(types).forEach(([typeName, TypeClass]) => {
      this[typeName] = new TypeClass(this.buffer, this.offset, this.length)
    })

    // create element accessors
    let byteOffset = 0
    Object.entries(elements).forEach(([key, [typeName, length = 1, typeDef]]) => {
      const ptr = byteOffset / 4
      let byteLength = 4 * length
      if (length === 1) {
        const view = this[typeName]
        Object.defineProperty(this, key, {
          get () { return view[ptr] },
          set (value) { view[ptr] = value }
        })
      } else if (typeof typeName === 'object') {
        this[key] = new Struct(typeName, new DataView(
          this.buffer,
          this.offset + byteOffset,
          byteLength
        ))
      } else if (typeof typeName === 'number') {
        this[key] = Array(typeName).fill(0).map((_, i) => {
          return new Struct(typeDef, new DataView(
            this.buffer,
            this.offset + byteOffset + (i * byteLength),
            byteLength
          ))
        })
        byteLength *= typeName
      } else if (length === 0) {
        this[key] = new Float32Array(1)
      } else {
        const view = this[typeName].subarray(ptr, ptr + length)
        Object.defineProperty(this, key, {
          get () { return view },
          set (value) { view.set(value) }
        })
      }
      byteOffset += byteLength
    })

    this.byteLength = byteOffset
  }
}
