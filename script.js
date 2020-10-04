import Editor, { registerEvents } from './editor/editor.js'
import LoopNode from './loop-node.js'
import Shared32Array from './shared32array.js'

const initial = `\
var kick = mod(1/4).sin(60).exp(15).tanh(6)
  .on(8,1/2).vol(0)()

var hihat = mod(1/16).noise(666).exp(30)
  .pat('.1 .4 1 .4')
  .on(8,1/4).mod(1/32).vol(5).pat('.3 3')()
  .hs(16000)
  .bpp(12000,1,.5)
  .bpp(500+mod(1/2).val(8000).exp(2.85),.5,.5)

var bass_melody = val(50)
  .on(8,1/8).val(70)()
  .on(8,1/2,16).mul(1.5)()
  .on(16,1/2).mul(2)()

var bass = mod(1/16).pulse(bass_melody,.9).exp(10)
  .pat('.1 .1 .5 1')
  .lp(800,1.2)

var clap = mod(1/4).noise(500).exp(110)
  .offt(.986).noise(450).exp(110).vol(1.25)
  .offt(.976).noise(500).exp(110).vol(.9)
  .noise(8200).exp(8.5).vol(.1)
  .join()
  .pat('- 1')
  .bpp(1300,1.1,.75)

// mixer
// kick.delay(1/8,.5)
kick.out(.7)
hihat.out(.23)//.send('fx')
clap.out(.27).on(8,1/4).send('fx')()
bass.out(.7)

var delay_w_fade_out = val(send.fx)
  .delay(1/6,.45,1)
  .bpp(18000-mod(1).val(10000).exp(1),1,1)

delay_w_fade_out.out(.8)
`

const numberOfChannels = 1
const sampleRate = 44100
const bpm = 120

let audio, node, buffer, render = () => {}

let once = true

let editor

let currentWorker
let nextWorker

let playing = false
let updateInProgress = false
let hasChanged = false

let n = 0

const methods = {
  play (worker, data) {
    n = data.n
    playing = true
    updateInProgress = false
  }
}

const workerUrl = new URL('render-worker.js', import.meta.url)
const worker = new Worker(workerUrl, { type: 'module' })
worker.onmessage = ({ data }) => {
  methods[data.call](worker, data)
}
worker.onerror = error => {
  updateInProgress = false
  console.error(error)
}
worker.onmessageerror = error => {
  updateInProgress = false
  console.error(error)
}

const requestNextBuffer = () => {
  worker.postMessage({ call: 'play' })
}

const updateRenderFunction = () => {
  if (updateInProgress) return

  hasChanged = false
  updateInProgress = true

  worker.postMessage({
    call: 'updateRenderFunction',
    value: editor.value,
    n: n //+node.bufferSize
  })
}

let toggle = () => {
  audio = new AudioContext({
    numberOfChannels,
    sampleRate,
    latencyHint: 'playback' // without this audio glitches
  })

  node = new LoopNode({ numberOfChannels, bpm })

  node.connect(audio.destination)

  worker.buffer = Array(numberOfChannels).fill(0).map(() =>
    new Shared32Array(node.bufferSize))

  worker.postMessage({
    call: 'setup',
    buffer: worker.buffer,
    sampleRate,
    beatRate: node.beatRate
  })

  node.onbar = () => {
    node.playBuffer(worker.buffer)
    if (hasChanged) {
      updateRenderFunction()
    } else {
      requestNextBuffer()
    }
  }

  console.log('connected node')

  const start = () => {
    updateRenderFunction()
    node.start()

    document.body.onclick = () => {}

    toggle = () => {
      node.stop(0)
      toggle = start
    }
  }

  toggle = start

  start()
}

setTimeout(() => {
  document.body.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.stopPropagation()
      e.preventDefault()
      toggle()
      return false
    }
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      // hasChanged = true
    }
  }, { capture: true })
}, 100)

const main = async () => {
  editor = new Editor({
    id: 'main',
    title: 'new-project.js',
    font: '/fonts/SpaceMono-Regular.woff2',
    value: localStorage.last ?? initial,
    fontSize: '11.5pt',
    // fontSize: '16.4pt',
    padding: 10,
    titlebarHeight: 42,
    width: window.innerWidth,
    height: window.innerHeight,
  })

  editor.onchange = () => {
    localStorage.last = editor.value
    hasChanged = true
  }

  container.appendChild(editor.canvas)
  editor.parent = document.body
  editor.rect = editor.canvas.getBoundingClientRect()

  registerEvents(document.body)
}

main()
