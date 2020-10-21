import { El } from './dom.js'
import * as GL from '../shader/gl.js'
import Audio from '../shader/sources/audio-service.js'
import Webcam from '../shader/sources/webcam-service.js'
import Youtube from '../shader/sources/youtube-service.js'
import Editor from '../shader/sources/editor-service.js'

// hacky way to switch root urls from dev to prod
const prefix = location.port == 8080
  ? '/shader/' : ''

const pixelRatio = window.devicePixelRatio
const workerUrl = new URL(prefix + 'shader-worker.js', import.meta.url).href
console.log('worker url', workerUrl)

export default class Shader {
  constructor (el, { source, stream }) {
    this.el = el
    this.source = source
    this.stream = stream
    this.canvas = El('shader', '', {
      tag: 'canvas',
      width: window.innerWidth,
      height: window.innerHeight
    })
    this.el.insertBefore(this.canvas, this.el.firstChild)

    this.worker = new Worker(workerUrl, { type: 'module' })
    this.worker.onmessage = ({ data }) => this[data.call](data)
    this.worker.onmessageerror = error => this.onerror(error)
    this.worker.onerror = error => this.onerror(error)

    this.sources = {}
    this.frame = 0
    this.tick = () => {
      if (this.frame % 2 === 0) { // videos only need <30fps
        this.sources.webcam?.update()
        this.sources.youtube?.update()
        this.sources.editor?.update()
      }
      this.sources.audio?.update()
      this.frame++
    }

    this.render = this.render.bind(this)

    this.offscreen = this.canvas.transferControlToOffscreen()

    this.worker.postMessage({
      call: 'setup',
      canvas: this.offscreen,
      pixelRatio,
    }, [this.offscreen])
  }

  async makeSources () {
    this.sources = {}
    this.sources.audio = this.sources.audio ?? Audio(this.worker, { source: this.source, size: 1024, depth: 60*8 })
    this.sources.webcam = this.sources.webcam ?? await Webcam(this.worker)
    this.sources.youtube = this.sources.youtube ?? Youtube(this.worker)
    this.sources.editor = this.sources.editor ?? Editor(this.worker, { stream: this.stream })
  }

  sourcecall ({ name, method, params }) {
    this.sources?.[name]?.[method]?.(...params)
  }

  onerror (error) {
    console.error(error.error ?? error)
    // this.stop()
  }

  load (filename) {
    this.worker.postMessage({
      call: 'load',
      filename //new URL(prefix + 'test-cg.js', import.meta.url).href,
    })
    this.start()
  }

  start () {
    if (this.playing) return
    this.makeSources()
    cancelAnimationFrame(this.animFrame)
    this.animFrame = requestAnimationFrame(this.render)
    this.worker.postMessage({
      call: 'start'
    })
    this.playing = true
  }

  stop () {
    Object.values(this.sources).forEach(s => s.stop?.())
    this.sources = {}
    cancelAnimationFrame(this.animFrame)
    this.worker.postMessage({
      call: 'stop'
    })
    this.playing = false
  }

  render () {
    this.animFrame = requestAnimationFrame(this.render)
    this.tick()
  }
}
