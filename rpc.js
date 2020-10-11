export default class Rpc {
  constructor () {
    this.callbackId = 0
    this.callbacks = new Map
  }

  postCall (method, data) {
    this.port.postMessage({ call: method, ...data })
  }

  rpc (method, data) {
    return new Promise((resolve, reject) => {
      const id = this.callbackId++

      this.callbacks.set(id, data => {
        this.callbacks.delete(id)
        if (data.error) reject(data.error)
        else resolve(data)
      })

      this.postCall(method, { callback: id, ...data })
    })
  }

  callback (data) {
    this.callbacks.get(data.callback)(data)
  }

  register (port) {
    this.port = port

    this.port.addEventListener('message', async ({ data }) => {
      if (!(data.call in this)) {
        throw new ReferenceError(data.call + ' is not a method')
      }

      let result
      try {
        result = await this[data.call](data)
      } catch (error) {
        result = { error }
      }

      if (data.callback) {
        this.postCall('callback', { ...result, callback: data.callback })
      }
    })

    this.port.addEventListener('error', error => {
      console.error(error)
      this.postCall('onerror', { error })
    })

    this.port.addEventListener('messageerror', error => {
      console.error(error)
      this.postCall('onmessageerror', { error })
    })

    return this
  }
}
