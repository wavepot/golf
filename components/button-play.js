import { Icon } from './dom.js'

export default class ButtonPlayPause {
  constructor (el, size = 21) {
    this.el = el
    this.play = Icon(size, 'play', 'M6 2 L6 28 26 15 Z')
    this.pause = Icon(size, 'play pause', 'M18 2 L18 28 M6 2 L6 28')
    this.play.onmousedown = () => {
      // this.setIconPause()
      this.onplay?.()
    }
    this.pause.onmousedown = () => {
      // this.setIconPlay()
      this.onpause?.()
    }
    this.setIconPause = () => {
      this.play.parentNode.replaceChild(this.pause, this.play)
    }
    this.setIconPlay = () => {
      this.pause.parentNode.replaceChild(this.play, this.pause)
    }
    this.el.appendChild(this.play)
  }
}
