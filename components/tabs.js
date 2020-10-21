import { El } from './dom.js'

export default class Tabs {
  constructor (el, tabs) {
    this.el = el

    this.tabs = El('tabs')

    for (const tab of tabs) {
      this[tab] = El('tab ' + tab)
      this.tabs.appendChild(this[tab])
    }

    this.el.appendChild(this.tabs)
  }

  setActive (tab) {
    if (this.active) {
      this.active.classList.remove('active')
    }
    tab.classList.add('active')
    this.active = tab
  }
}
