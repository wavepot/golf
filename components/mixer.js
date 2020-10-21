// https://github.com/oosmoxiecode/xgui.js/blob/master/src/xgui.js
const relativeMouseCoords = function (canvas, event) {
  var totalOffsetX = 0;
  var totalOffsetY = 0;
  var canvasX = 0;
  var canvasY = 0;
  var currentElement = canvas;

  do {
    totalOffsetX += currentElement.offsetLeft;
    totalOffsetY += currentElement.offsetTop;
  }
  while (currentElement = currentElement.offsetParent)

  canvasX = event.pageX - totalOffsetX;
  canvasY = event.pageY - totalOffsetY;

  // Fix for variable canvas width
  canvasX = Math.round( canvasX * (canvas.width / canvas.offsetWidth) );
  canvasY = Math.round( canvasY * (canvas.height / canvas.offsetHeight) );

  return {x:canvasX, y:canvasY}
}

const pixelRatio = window.devicePixelRatio

const settings = {
  height: 20,
  colors: ['#6047ff','#00f3b2','#ff391f'],
  muteColor: '#336',
  color: a => `rgba(0,243,178,${a})`
}

export default class Mixer {
  constructor (el, faders) {
    faders.forEach(fader => fader.vol = fader.vol ?? 0.8) // 0.8 is default in xone
    this.el = el
    this.faders = faders
    this.canvas = document.createElement('canvas')
    this.canvas.className = 'mixer'
    this.ctx = this.canvas.getContext('2d')
    this.resize()
    this.ctx.scale(pixelRatio, pixelRatio)
    // this.ctx.fillStyle = 'rgba(0,0,0,.5)'
    // this.ctx.fillRect(0, 0, this.width, this.height)
    this.ctx.textBaseline = 'top'
    this.faders.forEach((_, i) => this.drawFader(i))
    this.registerEvents()
    this.el.appendChild(this.canvas)
  }

  destroy () {
    this.canvas.onmousedown = null
    this.el.removeChild(this.canvas)
  }

  updateFader (i) {
    let y = (settings.height + 2) * i
    let w = this.width
    let off = 8.1

    const gradient = this.ctx.createLinearGradient(0, 0, this.width, 0)
    gradient.addColorStop(.7, settings.colors[0])
    gradient.addColorStop(.9, settings.colors[1])
    gradient.addColorStop(.96, settings.colors[2])

    this.ctx.fillStyle = '#1f1f2f'
    this.ctx.fillRect(w/2+off, y+3, w/2-4-off, settings.height - 6)
    this.ctx.fillStyle = this.faders[i].mute ? settings.muteColor : gradient //settings.color(this.faders[i].vol*.8+.2)
    let r = ( (w/2-8-off) * (this.faders[i].vol) )
    this.ctx.fillRect(w/2+2+off, y+5, r, settings.height - 10)
  }

  drawFader (i) {
    let y = (settings.height + 2) * i
    let w = this.width
    let off = 8.1
    this.ctx.fillStyle = 'rgba(0,0,0,.5)'
    this.ctx.fillRect(0, y, w, settings.height)
    this.updateFader(i)
    // ctx.fillStyle = '#f00'
    // ctx.clearRect(x, h + 5, 30, 20)
    // ctx.fillStyle = faders[i].solo ? '#fff' : '#666'
    // ctx.fillText('S', x+3, 7 + h)
    this.ctx.font = '6pt mono' //sans serif'
    this.ctx.fillStyle = '#55a'
    this.ctx.fillText(i, 5, y + 6)

    this.ctx.fillStyle = settings.colors[this.faders[i].X ? 1 : 0]
    this.ctx.fillText('X', 119+off, y + 6)
    this.ctx.fillStyle = settings.colors[this.faders[i].Y ? 1 : 0]
    this.ctx.fillText('Y', 129+off, y + 6)

    this.ctx.font = '6.5pt mono' //sans serif'
    this.ctx.fillStyle = '#aaf'
    this.ctx.fillText(this.faders[i].title, 16, y + 5.5)
    // ctx.fillStyle = faders[i].mute ? '#fff' : '#666'
    // ctx.fillText('M', x + 21, 7 + h)
    this.ctx.beginPath()
    this.ctx.fillStyle = settings.colors[this.faders[i].mute ? 2 : 1]
    this.ctx.arc(w/2 - 8+off, y + settings.height/2, 1.9, 0, 2*Math.PI)
    this.ctx.fill()
  }

  registerEvents () {
    let mouseDown = false
    let strategy

    const get = e => {
      let { x, y } = relativeMouseCoords(this.canvas, e)
      const i = Math.ceil(y / pixelRatio / (settings.height + 2)) - 1
      x -= 8.1*2
      return { x, y, i }
    }

    let selected = null
    const reorderTrack = e => {
      const { i } = get(e)
      if (i < 0 || i > this.faders.length - 1) return
      if (selected === null) selected = i
      if (i !== selected) {
        this.faders.splice(selected, 1, this.faders.splice(i, 1, this.faders[selected])[0])
        this.drawFader(i)
        this.drawFader(selected)
        selected = i
      }
    }
    const stopReorderTrack = () => { selected = null }

    const adjustVolume = e => {
      const { x, i } = get(e)
      const vol = Math.max(0, Math.min(1, ( (x-(this.width)) / ((this.width * pixelRatio / 2)) )))
      if (this.faders[i]) {
        this.faders[i].vol = vol
        this.onchange?.(this.faders[i])
        this.updateFader(i)
      }
    }

    const onmousemove = e => strategy[0](e)

    const stop = () => {
      strategy[1]?.()
      mouseDown = false
      document.body.removeEventListener('mousemove', onmousemove)
      window.removeEventListener('blur', stop, { once: true })
      window.removeEventListener('mouseup', stop, { once: true })
    }

    this.canvas.onmousedown = e => {
      const { x, i } = get(e)

      // is mute button
      if (x < this.width && x >= this.width - 25) {
        this.faders[i].mute = !this.faders[i].mute
        this.onchange?.(this.faders[i])
        this.drawFader(i)
        return
      }

      // is Y
      if (x < this.width - 25 && x >= this.width - 45) {
        this.faders[i].Y = !this.faders[i].Y
        this.faders[i].X = false
        this.drawFader(i)
        return
      }

      // is X
      if (x < this.width - 45 && x >= this.width - 65) {
        this.faders[i].X = !this.faders[i].X
        this.faders[i].Y = false
        this.drawFader(i)
        return
      }

      mouseDown = true
      if (x < this.width * pixelRatio / 2 - 65) {
        strategy = [reorderTrack, stopReorderTrack]
      } else {
        strategy = [adjustVolume]
      }

      window.addEventListener('blur', stop, { once: true })
      window.addEventListener('mouseup', stop, { once: true })
      document.body.addEventListener('mousemove', onmousemove)
      onmousemove(e)
    }
  }

  resize () {
    this.width = 300, //(window.innerWidth - (window.innerWidth / 2)) / 2
    this.height = this.faders.length * (settings.height + 2)
    Object.assign(this.canvas, {
      width: this.width * pixelRatio,
      height: this.height * pixelRatio
    })
    Object.assign(this.canvas.style, {
      right: 0,
      width: this.width + 'px',
      height: this.height + 'px'
    })
  }
}

const fontUrl = '/fonts/mplus-1m-regular.woff2'

const fontFace = new FontFace(
  'mono',
  `local('mono'),
   url('${fontUrl}') format('woff2')`,
)
fontFace.load().then(font => {
  document.fonts.add(font)
})