import Editor, { registerEvents } from './editor/editor.js'
import LoopNode from './loop-node.js'
import Shared32Array from './shared32array.js'

const initial = `\
sin(mod(1/4).hz(35.881).exp(.057))
  .mod(1/4)
  .exp(5.82)
  .tanh(2.18).tanh(5.22)
    .on(7,1/4,8).tanh(15).vol(.3)
    .on(4,1/4).vol(0)
  .out(.7)

// sin(mod(1/8).hz(85.881).exp(.257)
    // .on(3,1/2,4).mul(2))
  // .mod(1/16)
  // .exp(5.82)
  // .tanh(10.18)
    // .on(4,1/4).vol(0)
  // .out(.12)

// mod(1/4).noise(133377).exp(10)
  // .delay(1/(800+sin(bt(1/2))*200),.7)
  // .delay(1/8,.2)
  // .delay(1/16,.8)
  // .eq(bp(700,.2))
  // .mod(1/2).exp(13)
  // .on(1,1/4,2).vol(0)._
  // .tanh(1.2)
  // .out(1.5)

mod(1/8).noise(133377).exp(19)
  .on(1,1/8,2).vol(0)
  .out(.3)

mod(1/16).noise(1377).exp(40)
  .out(.2)

mod(1/4).noise(500).exp(110)
  .offt(.986).noise(450).exp(110).vol(1.25)
  .offt(.976).noise(500).exp(110).vol(.9)
  .noise(8200).exp(8.5).vol(.1)
  .join()
  .eq(
    bp(1300,1.2,.7),
    bp(1100,1,.7),
    bp(800,.3,.75),
  )
    .on(1,1/4,4).vol(0)
    .on(3,1/4,4).vol(0)
  .out(1.4)

// offt(3/16).mod(1/8).sin(hz(570)+val(5).mod(1/8).exp(3)).exp(8).tanh(5)
  // .noise(800).exp(8).vol(.015)
  // .out(.20)

offt(3/16).mod(1/8).sin(hz(val(200).on(2,1/4,2).val(370).on(3,1/4,4).val(500)._.mul(.5))+val(5).mod(1/8).exp(3)).exp(8).tanh(5)
  .noise(800).exp(8).vol(.015)
  .out(.16)
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
    if (!updateInProgress || worker === currentWorker) {
      return // discard
    }
    playing = true
    updateInProgress = false
    nextWorker = currentWorker
    currentWorker = worker
  }
}

const workers = [1,2].map(() => {
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
  return worker
})

currentWorker = workers[0]
nextWorker = workers[1]

const requestNextBuffer = () => {
  currentWorker.postMessage({ call: 'play' })
}

const updateRenderFunction = () => {
  if (updateInProgress) return
  hasChanged = false

  if (!playing) {
    nextWorker = workers[0]
    currentWorker = workers[1]
  }

  updateInProgress = nextWorker
  nextWorker.postMessage({
    call: 'updateRenderFunction',
    value: editor.value,
    n: n //+node.bufferSize
  })
}

document.body.onclick = () => {
  audio = new AudioContext({
    numberOfChannels,
    sampleRate,
    latencyHint: 'playback' // without this audio glitches
  })

  node = new LoopNode({ numberOfChannels, bpm })

  node.connect(audio.destination)

  workers.forEach(worker => {
    worker.buffer = Array(numberOfChannels).fill(0).map(() =>
      new Shared32Array(node.bufferSize))

    worker.postMessage({
      call: 'setup',
      buffer: worker.buffer,
      sampleRate,
      beatRate: node.beatRate
    })
  })

  node.onbar = () => {
    node.playBuffer(currentWorker.buffer)
    if (hasChanged) {
      updateRenderFunction()
    }
    requestNextBuffer()
  }

  console.log('connected node')

  const toggle = () => {
    updateRenderFunction()
    node.start()

    document.body.onclick = () => {}

    document.body.ondblclick = () => {
      node.stop(0)
      document.body.onclick = toggle
    }
  }

  toggle()
}

const main = async () => {
  editor = new Editor({
    id: 'main',
    title: 'new-project.js',
    font: '/fonts/SpaceMono-Regular.woff2',
    value: initial,
    fontSize: '11.5pt',
    // fontSize: '16.4pt',
    padding: 10,
    titlebarHeight: 42,
    width: window.innerWidth,
    height: window.innerHeight,
  })

  editor.onchange = () => {
    hasChanged = true
  }

  container.appendChild(editor.canvas)
  editor.parent = document.body
  editor.rect = editor.canvas.getBoundingClientRect()

  registerEvents(document.body)
}

main()
