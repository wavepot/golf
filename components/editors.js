import Editor, { registerEvents } from '../editor/editor.js'
import * as API from './api.js'

registerEvents(document.body)

const getSettings = () => {
  const sideWidth = 300

  const common = {
    font: '/fonts/mplus-1m-regular.woff2',
    fontSize: '9.4pt',
    // fontSize: '16.4pt',
    padding: 10,
    titlebarHeight: 42,
  }

  const modules = {
    ...common,
    width: (window.innerWidth - sideWidth) / 2,
    height: window.innerHeight,
  }

  const tracks = {
    ...common,
    width: modules.width, //(window.innerWidth - modules.width),
    height: window.innerHeight,
  }

  return { tracks, modules }
}

export default class Editors {
  static async fromProject (el, title) {
    const json = await API.load(title)
    return new Editors(el, json)
  }

  constructor (el, project) {
    if (!project || typeof project === 'string') {
      const title = typeof project === 'string' ? project : 'untitled'
      project = {
        title,
        bpm: '125',
        tracks: [{
          title: title + '/track.js',
          value: 'export default c => 0'
        }],
        modules: [{
          title: title + '/module.js',
          value: 'export default c => 0'
        }]
      }
    }
    project.tracks = project.tracks.filter(track => !!track.value.trim())
    project.modules = project.modules.filter(mod => !!mod.value.trim())
    this.project = project
    this.el = el
    this.title = project.title
    this.tracks = [project.tracks[0]]
    this.modules = [project.modules[0]]
    this.modulesEditors = {}
    this.currentModuleEditor = null
    this.createEditors()
  }

  destroy () {
    this.tracksEditor.destroy()
    for (const moduleEditor of Object.values(this.modulesEditors)) {
      moduleEditor.destroy()
    }
  }

  createEditors () {
    const settings = getSettings()
    this.tracksEditor = new Editor({
      ...this.project.tracks[0],
      ...settings.tracks
    })
    this.tracksEditor.onchange = data => {
      const track = this.tracks.find(track => track.title === data.title)
      track.value = data.value
      this.onchange?.(track)
      console.log('track changed:', data)
    }
    this.tracksEditor.onrename = data => {
      const track = this.tracks.find(track => track.title === data.prevTitle)
      track.title = data.title
      this.onrename?.(track)
      console.log('track renamed:', data.prevTitle, data.title)
    }
    this.tracksEditor.onadd = data => {
      this.onadd?.(data)
      this.tracksEditor.resize()
    }
    this.tracksEditor.onremove = data => {
      const track = this.tracks.find(track => track.title === data.title)
      this.tracks.splice(this.tracks.indexOf(track), 1)
      this.onremove?.(data)
      this.tracksEditor.resize()
    }
    this.tracksEditor.ontoadd = () => this.ontoaddtrack?.()

    this.ensureModuleEditor(this.project.modules?.[0]?.title.split('/')[0] ?? this.title, this.project.modules[0])

    this.tracksEditor.onfocus = editor => {
      const [dir, title] = editor.title.split('/')
      const prevModuleEditor = this.currentModuleEditor
      const moduleEditor = this.ensureModuleEditor(dir)
      if (prevModuleEditor !== moduleEditor) {
        prevModuleEditor.canvas.style.display = 'none'
        prevModuleEditor.isVisible = false
        moduleEditor.canvas.style.display = 'block'
        moduleEditor.isVisible = true
        this.currentModuleEditor = moduleEditor
        moduleEditor.resize()
      }
      this.onfocus?.(this.tracksEditor)
    }
    this.tracksEditor.canvas.style.left = settings.modules.width + 'px'
    this.tracksEditor.parent = this.el

    this.el.appendChild(this.tracksEditor.canvas)
    this.tracksEditor.resize()

    this.project.tracks.slice(1).forEach(track => this.addTrack(track))
    this.project.modules.slice(1).forEach(module => this.addModule(module))
  }

  ensureModuleEditor (dir, module) {
    let moduleEditor = this.modulesEditors[dir]

    if (moduleEditor) {
      if (module) {
        moduleEditor.addSubEditor(module)
        if (!this.modules.find(mod => mod.title === module.title)) {
          this.modules.push(module)
        }
      }
      return moduleEditor
    }

    if (!module) {
      module = { title: dir + '/module.js', value: 'export default c => 0' }
    }
    if (!this.modules.find(mod => mod.title === module.title)) {
      this.modules.push(module)
    }

    const settings = getSettings()
    moduleEditor = this.modulesEditors[dir] = new Editor({
      ...module,
      ...settings.modules
    })
    moduleEditor.onfocus = () => this.onfocus?.(moduleEditor)
    moduleEditor.onchange = data => {
      const module = this.modules.find(module => module.title === data.title)
      module.value = data.value
      this.onchange?.(module)
      console.log('module changed:', data)
    }
    moduleEditor.onrename = data => {
      const module = this.modules.find(module => module.title === data.prevTitle)
      module.title = data.title
      this.onrename?.(module)
      console.log('module renamed:', data.prevTitle, data.title)
    }
    moduleEditor.onadd = data => {
      this.onadd?.(data)
      moduleEditor.resize()
    }
    moduleEditor.onremove = data => {
      const module = this.modules.find(module => module.title === data.title)
      this.modules.splice(this.modules.indexOf(module), 1)
      console.log('removed', module, this.modules)
      this.onremove?.(data)
      moduleEditor.resize()
    }
    moduleEditor.ontoadd = () => this.ontoaddmodule?.()

    if (this.currentModuleEditor) {
      moduleEditor.canvas.style.display = 'none'
      moduleEditor.isVisible = false
    } else {
      this.currentModuleEditor = moduleEditor
      moduleEditor.isVisible = true
    }
    moduleEditor.canvas.style.left = 0
    moduleEditor.parent = this.el
    this.el.appendChild(moduleEditor.canvas)
    moduleEditor.resize()

    return moduleEditor
  }

  addTrack (track) {
    this.tracksEditor.addSubEditor(track)
    this.tracks.push(track)
  }

  addModule (module) {
    const [dir, title] = module.title.split('/')
    this.ensureModuleEditor(dir, module)
    // this.modules.push(module)
  }

  resize () {
    const settings = getSettings()
    this.tracksEditor.resize(settings.tracks)
    this.tracksEditor.canvas.style.left = settings.modules.width + 'px'
    Object.values(this.modulesEditors).forEach(editor => editor.resize(settings.modules))
  }

  async importProject (title) {
    const json = await API.load(title)
    json.tracks.forEach(track => this.addTrack(track))
    json.modules.forEach(module => this.addModule(module))
  }
}
