import { Icon } from './dom.js'

export default class ButtonEye {
  constructor (el) {
    this.el = el
    this.eye = Icon(24, 'eye', 'M2 16 C2 16 7 6 16 6 25 6 30 16 30 16 30 16 25 26 16 26 7 26 2 16 2 16 Z', `
    <circle cx="16" cy="16" r="4" />
    `)
    this.eye.onclick = () => this.onclick?.()
    this.el.appendChild(this.eye)
  }
}
