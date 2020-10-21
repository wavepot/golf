export default class InputBpm {
  constructor (el) {
    this.el = el

    this.bpm = document.createElement('div')
    this.value = this.bpm.textContent = '125'
    this.bpm.className = 'bpm'

    this.input = document.createElement('input')
    this.input.className = 'bpm'
    this.input.autocomplete = 'off'
    this.input.type = 'number'
    this.input.min = '1'
    this.input.max = '999'

    this.bpm.ondblclick = () => {
      this.input.value = this.bpm.textContent
      this.bpm.parentNode.replaceChild(this.input, this.bpm)
      this.input.focus()
    }
    this.input.onblur = () => {
      this.input.parentNode.replaceChild(this.bpm, this.input)
      this.setValue(this.input.value || this.bpm.textContent)
    }

    this.el.appendChild(this.bpm)
  }

  setValue (bpm) {
    this.value = this.bpm.textContent = Math.min(
      999,
      Math.max(
        1,
        parseInt(
          bpm
        )))
  }
}
