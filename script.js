import Editor, { registerEvents } from './editor/editor.js'
import LoopNode from './loop-node.js'
import Shared32Array from './shared32array.js'

const initial = `\
// docs:
//
// ctrl+enter = play/pause
//
// mod(measure=1) = [beat time] modulo(%) [measure] (loop)
// sin(hz) saw(hz) sqr(hz) tri(hz) pulse(hz,width) noise(seed)
// val(x) = explicit value x
// join() = joins/sums previous generators
// exp(decay_speed=10) = reverse exponential curve (decay)
// pat('.1 .2 .5 1') = volume pattern based on last mod
// offt(time_offset) = shift time by time_offset (used with mod)
// vol(x)|mul(x) = multiply current value by x
// lp1(cut,amt=1) hp1(cut,amt=1)
// lp(cut,res=1,amt=1) hp(cut,res=1,amt=1)
// bp(cut,res=1,amt=1) bpp(cut,res=1,amt=1)
// not(cut,res=1,amt=1) ap(cut,res=1,amt=1)
// pk(cut,res=1,gain=1,amt=1)
// ls(cut,res=1,gain=1,amt=1) hs(cut,res=1,gain=1,amt=1)
// eq(bp(...),ls(...),...) = equalizer (note: this executes
//                               the filters in parallel
//                               whereas chaining is serial)
// on(beat,measure,count=beat)...() = schedule all calls
//                    between \`on\` and \`()\` to play on
//                    target beat in measure, loops on count
// delay(measure=1/16,feedback=.5,amt=.5)
// tanh(x=1) = tanh value multiplied by x (s-curve distortion)
// out(vol=1) = send value to speakers
// send('send_name',amt=1) = sends to send channel \`send_name\`
// val(send.send_name)...out() = process send \`send_name\`
//
// all changes are saved immediately and refresh
// brings back the state as it was. to reset it
// type in devtools console: delete localStorage.last

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
