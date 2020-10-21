import { El, Button } from './dom.js'

export default class SelectMenu {
  constructor (el, items) {
    this.el = el
    this.items = items.map(item => {
      item.el = Button(item.id, item.text)
      item.el.onclick = () => item.fn()
      this[item.id] = item
      return item
    })
    this.menu = El('select-menu')
    this.items.forEach(item => this.menu.appendChild(item.el))
    this.el.appendChild(this.menu)
  }
}
