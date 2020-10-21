import { Icon } from './dom.js'

export default class ButtonSave {
  constructor (el) {
    this.el = el
    // this.save = Icon(22, 'save', 'M5 27  L30 27  30 10  25 4  10 4  5 4  Z  M12 4  L12 11  23 11  23 4  M12 27  L12 17  23 17  23 27')
    // this.save = Icon(22, 'save', 'M5 27  L30 27  30 10  25 4  10 4  5 4  Z  M11 4  L11 10  21 10  21 4', '<circle class="path" cx="17.5" cy="18.5" r="4" />')
    this.save = Icon(23, 'save', 'M5 27  L30 27  30 10  25 4  10 4  5 4  Z  M10.5 9.5  L21 9.5', '<circle class="path" cx="17.4" cy="18.5" r="3.4" />')
    // this.save = Icon(32, 'save', 'M7 26 L28 26', '<circle class="path" cx="17.4" cy="14.4" r="5" />')
    // this.save = Icon(28, 'save', 'M28 22 L28 30 4 30 4 22 M16 4 L16 24 M8 16 L16 24 24 16')
    // this.save = Icon(24, 'save', 'M17 4 Q13 6, 16 10.5 T 15 17  M7 16 L16 24 25 16 ')
    // this.save = Icon(30, 'save', 'M9 22 C0 23 1 12 9 13 6 2 23 2 22 10 32 7 32 23 23 22 M11 18 L16 14 21 18 M16 14 L16 29')
    // this.save = Icon(28, 'save', 'M14 9 L3 9 3 29 23 29 23 18 M18 4 L28 4 28 14 M28 4 L14 18')
    // this.save = Icon(28, 'save', 'M28 22 L28 30 4 30 4 22 M16 4 L16 24 M8 12 L16 4 24 12')

    // this.save.disabled = true
    this.save.onclick = () => this.onsave?.()
    this.el.appendChild(this.save)
  }

  enable () {
    this.save.disabled = false
  }

  disable () {
    this.save.disabled = true
  }
}
