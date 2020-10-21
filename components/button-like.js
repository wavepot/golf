import { Icon } from './dom.js'

export default class ButtonHeart {
  constructor (el) {
    this.el = el
    this.heart = Icon(19.8, 'like', 'M4 16 C1 12 2 6 7 4 12 2 15 6 16 8 17 6 21 2 26 4 31 6 31 12 28 16 25 20 16 28 16 28 16 28 7 20 4 16 Z')
    this.heart.onclick = () => this.onclick?.()
    this.el.appendChild(this.heart)
  }
}
