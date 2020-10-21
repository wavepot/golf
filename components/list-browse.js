import { El } from './dom.js'
import ButtonPlayPause from './button-play-pause.js'
import Audio from './audio.js'
import * as API from './api.js'

export default class ListBrowse {
  constructor (el, list) {
    this.el = el
    this.list = El('list-browse')

    list.forEach(item => {
      const path = item.replace(/[^a-z0-9-/]/gi, '')
      const meta = item.replace(/[^a-z0-9]/gi, '_')
      const img = `${API.URL}/${meta}.webp`
      const ogg = `${API.URL}/${meta}.ogg`
      const image = new Image
      image.setAttribute('crossorigin', 'anonymous')
      image.src = img
      let dragImg
      image.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 100
        canvas.height = 50
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#373174'
        ctx.fillRect(0,0,100,50)
        ctx.drawImage(image, 0, 0, 100, 50)
        dragImg = new Image
        dragImg.src = canvas.toDataURL()
      }

      const itemEl = El('item', `
        <a href="/${item}">
          <div class="name">${item}</div>
          <img src="${img}" crossorigin="anonymous">
        </a>
      `, { draggable: true })

      itemEl.ondragstart = e => {
        const dropArea = El('drop-area', 'drop here<br>to add track')
        dropArea.ondrop = e => {
          e.preventDefault()
          const data = e.dataTransfer.getData('text/plain')
          this.ondrop?.(data)
        }
        itemEl.ondragend = e => {
          document.body.removeChild(dropArea)
        }
        dropArea.ondragover = e => { // really? wtf?
          e.preventDefault()
        }
        dropArea.ondragenter = e => {
          dropArea.classList.add('dragover')
        }
        dropArea.ondragleave = e => {
          dropArea.classList.remove('dragover')
        }
        document.body.appendChild(dropArea)
        e.dataTransfer.setData('text/plain', item)
        e.dataTransfer.dropEffect = 'link'
        e.dataTransfer.setDragImage(dragImg, 100, 50)
      }

      let node

      const buttonPlayPause = new ButtonPlayPause(itemEl, 22)
      buttonPlayPause.onplay = async () => {
        const audio = Audio()
        const res = await fetch(ogg)
        const arrayBuffer = await res.arrayBuffer()
        const audioBuffer = await audio.decodeAudioData(arrayBuffer)
        if (node) {
          node.stop()
        }
        node = audio.createBufferSource()
        node.buffer = audioBuffer
        node.loop = true
        node.connect(audio.destination)
        node.start()
      }
      buttonPlayPause.onpause = () => {
        if (node) {
          node.stop()
          node = null
        }
      }
      this.list.onclick = () => {
        return false
      }
      this.list.appendChild(itemEl)
    })

    this.el.appendChild(this.list)
  }
}
