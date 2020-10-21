import { Icon } from './dom.js'

export default class ButtonLogo {
  constructor (el) {
    this.el = el
    this.logo = Icon(23, 'logo', 'M4.9 6 A 13.8 13.8 0 1 0 27.4 6', '<path class="path wave" d="M9.7 13.5 Q12 10.5, 15.5 13.9 T 22 13.9" />')
    this.logo.onclick = () => this.onclick?.()
    this.el.appendChild(this.logo)
  }
}
