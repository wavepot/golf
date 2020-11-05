import { Icon } from './dom.js'

export default class ButtonCode {
  constructor (el) {
    this.el = el
    this.code = Icon(24, 'code', 'M10 9 L3 17 10 25 M22 9 L29 17 22 25 M18 7 L14 27')
    this.code.onclick = () => this.onclick?.()
    this.el.appendChild(this.code)
  }
}
