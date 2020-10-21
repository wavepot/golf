import { El } from './dom.js'
import ButtonPlayPayse from './button-play-pause.js'
import ButtonSave from './button-save.js'
import ButtonHeart from './button-heart.js'
import ButtonLogo from './button-logo.js'
import InputBpm from './input-bpm.js'

export default class Toolbar {
  constructor (el) {
    this.el = el

    this.toolbar = El('toolbar')
    this.toolbarLeft = El('toolbar-left')
    this.toolbarCenter = El('toolbar-center')
    this.toolbarRight = El('toolbar-right')
    this.toolbar.appendChild(this.toolbarLeft)
    this.toolbar.appendChild(this.toolbarCenter)
    this.toolbar.appendChild(this.toolbarRight)

    this.inputBpm = new InputBpm(this.toolbarRight)
    this.buttonPlayPause = new ButtonPlayPayse(this.toolbarRight)
    this.buttonSave = new ButtonSave(this.toolbarLeft)
    this.buttonLogo = new ButtonLogo(this.toolbarCenter)

    this.el.appendChild(this.toolbar)
  }
}
