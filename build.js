var ask = (title, text, defaultValue) => {
  return new Promise(resolve => {
    const div = document.createElement('div');
    div.className = 'prompt';
    div.innerHTML = `
      <div class="inner">
        <div class="title">${title}</div>
        <div class="text">${text}</div>
        <input type="text" value="${defaultValue}">
        <div class="buttons">
          <button class="cancel">Cancel</button> <button class="ok">OK</button>
        </div>
      </div>
    `;

    const keyListener = e => {
      e.stopPropagation();
      if (e.which === 13) ok();
      if (e.which === 27) cancel();
    };

    const prevent = e => {
      e.stopPropagation();
    };

    const preventEvents = [
      'keyup',
      'input',
      'keypress',
      'mousedown',
      'mouseup',
      'mousemove',
      'mousewheel'
    ];

    const cleanup = () => {
      window.removeEventListener('keydown', keyListener, { capture: true });
      preventEvents.forEach(event => {
        window.removeEventListener(event, prevent, { capture: true });
      });
      document.body.removeChild(div);
    };

    const ok = () => {
      cleanup();
      resolve({ value: div.querySelector('input').value });
    };

    const cancel = () => {
      cleanup();
      resolve(false);
    };

    div.querySelector('.ok').onclick = ok;
    div.querySelector('.cancel').onclick = cancel;

    window.addEventListener('keydown', keyListener, { capture: true });
    preventEvents.forEach(event => {
      window.addEventListener(event, prevent, { capture: true });
    });

    document.body.appendChild(div);

    div.querySelector('input').focus();
    div.querySelector('input').select();
  })
};

const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const pixelRatio = window.devicePixelRatio;

let ignore = false;
let selectionText = '';
let textarea;

const editors = {};
class Editor {
  constructor (data) {
    this.data = data;
    this.isVisible = true;
    this.hasSetup = false;
    this.toAdd = [];
    this.id = data.id ?? (Math.random() * 10e6 | 0).toString(36);
    editors[this.id] = this;
    this._onchange(data);

    this.focusedEditor = this;

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'editor';
    this.canvas.width = data.width * pixelRatio;
    this.canvas.height = data.height * pixelRatio;
    this.canvas.style.width = data.width + 'px';
    this.canvas.style.height = data.height + 'px';

    if (!this.pseudoWorker) {
      const workerUrl = new URL('worker.js', import.meta.url).href;
      this.worker = new Worker(workerUrl, { type: 'module' });
      this.worker.onerror = error => this._onerror(error);
      this.worker.onmessage = ({ data }) => this['_' + data.call](data);
    } else {
      this.setupPseudoWorker();
    }
  }

  async setupPseudoWorker () {
    const PseudoWorker = await import(new URL('worker.js', import.meta.url));
    this.worker = new PseudoWorker();
    this.worker.onerror = error => this._onerror(error);
    this.worker.onmessage = ({ data }) => this['_' + data.call](data);
  }

  destroy () {
    delete editors[this.id];
    this.worker.terminate();
    this.canvas.parentNode.removeChild(this.canvas);
  }

  _onerror (error) {
    console.error(error);
  }

  _onready () {
    const outerCanvas = this.pseudoWorker ? this.canvas : this.canvas.transferControlToOffscreen();
    this.worker.postMessage({
      call: 'setup',
      id: this.id,
      title: this.title,
      extraTitle: this.extraTitle,
      value: this.value,
      font: this.font,
      fontSize: this.fontSize,
      autoResize: this.autoResize,
      padding: this.padding,
      titlebarHeight: this.titlebarHeight,
      outerCanvas,
      pixelRatio,
    }, [outerCanvas]);
    this.onready?.();
    // this.stream = this.canvas.captureStream(15)
    // this.videoTrack = this.stream.getVideoTracks()[0]
    // this.videoTrack.requestFrame()
  }

  _onsetup () {
    this.hasSetup = true;
    if (this.toAdd.length) {
      this.toAdd.forEach(data => this.addSubEditor(data));
      this.toAdd = [];
    }
    this.onsetup?.();
  }

  async _onchange (data) {
    Object.assign(this, data);
    Object.assign(this.data, data);
    // if (this.cache) {
    //   this.filename = await this.cache.put(this.title, this.value)
    //   console.log('put in cache:', this.filename)
    // }
    this.onchange?.(data);
  }

  _ondraw () {
    // this.videoTrack.requestFrame()
  }

  _onrename (data) {
    this.focusedEditor = data;
    this.onrename?.(data);
  }

  _onadd (data) {
    this.onadd?.(data);
  }

  _onremove (data) {
    this.onremove?.(data);
  }

  _onhistory (history) {
    this.history = history;
  }

  _onfocus (editor) {
    this.focusedEditor = editor;
    this.onfocus?.(editor);
  }

  _onselection ({ text }) {
    if (textarea) {
      if (text.length) {
        textarea.select();
      } else {
        textarea.selectionStart = -1;
        textarea.selectionEnd = -1;
      }
    }
    selectionText = text;
  }

  _onresize () {
    this.resize(); // TODO: is this necessary?
    this.onresize?.();
  }

  resize ({ width, height } = {}) {
    this.parent = this.parent ?? this.canvas.parentNode;
    let rect = this.canvas.getBoundingClientRect();
    rect.y += window.pageYOffset;
    rect.x += window.pageXOffset;
    this.rect = rect;
    if ((width || height) && (rect.width !== width || rect.height !== height)) {
      this.worker
        .postMessage({
          call: 'onresize',
          width: width*pixelRatio,
          height: height*pixelRatio
        });
      this.canvas.style.width = width + 'px';
      this.canvas.style.height = height + 'px';
      rect = this.canvas.getBoundingClientRect();
      rect.y += window.pageYOffset;
      rect.x += window.pageXOffset;
      this.rect = rect;
    }
  }

  addSubEditor (data) {
    if (this.hasSetup) {
      this.worker
        .postMessage({
          ...this.data,
          ...data,
          call: 'addSubEditor',
        });
    } else {
      this.toAdd.push(data);
    }
  }

  _onimagebitmap ({ imageBitmap }) {
    this.imageBitmap = imageBitmap;
  }

  handleEvent (type, eventName, e = {}) {
    const data = eventHandlers[type](e, eventName, this);
    if (!data) return false
    // if (ignore) return false

    if (!(data.cmdKey && data.key === 'x')) {
      e.preventDefault?.();
      e.stopPropagation?.();
    }

    // remove editor
    if ((data.ctrlKey || data.metaKey) && data.key === 'b') {
      const { title } = this.focusedEditor;
      if (confirm('Are you sure you want to delete ' + title + '?')) {
        this.worker.postMessage({
          call: 'deleteEditor',
          id: this.focusedEditor.id
        });
      }
    }

    // add editor
    if ((data.ctrlKey || data.metaKey) && data.key === ',') {
      this.ontoadd?.();
    }

    // rename editor
    if ((data.ctrlKey || data.metaKey) && data.key === 'm') {
      // TODO: completely hacky way to remove the textarea while
      // there is title change
      methods.events.setTarget('hover', null, new MouseEvent('mouseout'));
      e.preventDefault();
      ask('Change name', `Type a new name for "${this.focusedEditor.title}"`,
        this.focusedEditor.title).then(async (result) => {
        if (!result) return
        // if (this.id === this.focusedEditor.id) {
        //   const oldTitle = this.title
        //   this.title = result.value
        //   // this.onrename?.(oldTitle, this.title)
        // }
        this.worker
          .postMessage({
            call: 'renameEditor',
            id: this.focusedEditor.id,
            title: result.value
          });
      });
      return false
    }

    this.worker.postMessage({ call: eventName, ...data });
  }
}

const methods = {};

const registerEvents = (parent) => {
  textarea = document.createElement('textarea');
  textarea.style.position = 'fixed';
  // textarea.style.left = (e.clientX ?? e.pageX) + 'px'
  // textarea.style.top = (e.clientY ?? e.pageY) + 'px'
  textarea.style.width = '100px';
  textarea.style.height = '100px';
  textarea.style.marginLeft = '-50px';
  textarea.style.marginTop = '-50px';
  textarea.style.opacity = 0;
  textarea.style.visibility = 'none';
  textarea.style.resize = 'none';
  textarea.autocapitalize = 'none';
  textarea.autocomplete = 'off';
  textarea.spellchecking = 'off';
  textarea.value = 0;

  const createUndoRedo = methods.createUndoRedo = () => {
    // create undo/redo capability
    ignore = true;
    textarea.focus();
    textarea.select();
    document.execCommand('insertText', false, 1);
    textarea.select();
    document.execCommand('insertText', false, 2);
    document.execCommand('undo', false);
    textarea.selectionStart = -1;
    textarea.selectionEnd = -1;
    ignore = false;
  };

  const removeUndoRedo = methods.removeUndoRedo = () => {
    // remove undo/redo capability
    ignore = true;
    textarea.focus();
    textarea.select();
    document.execCommand('undo', false);
    // document.execCommand('undo', false)
    // document.execCommand('undo', false)
    textarea.selectionStart = -1;
    textarea.selectionEnd = -1;
    // ignore = false
  };

  textarea.oncut = e => {
    e.preventDefault();
    e.clipboardData.setData('text/plain', selectionText);
    selectionText = '';
    events.targets?.focus?.worker.postMessage({ call: 'onkeydown', cmdKey: true, key: 'x' });
    textarea.selectionStart = -1;
    textarea.selectionEnd = -1;
  };

  textarea.oncopy = e => {
    e.preventDefault();
    e.clipboardData.setData('text/plain', selectionText);
  };

  textarea.onpaste = e => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    events.targets?.focus?.worker.postMessage({ call: 'onpaste', text });
  };

  textarea.oninput = e => {
    if (ignore) return

    ignore = true;
    const editor = events.targets.focus;
    const needle = +textarea.value;
    if (needle === 0) { // is undo
      document.execCommand('redo', false);
      if (editor?.history) {
        if (editor.history.needle > 1) {
          editor.history.needle--;
          editor.worker.postMessage({
            call: 'onhistory',
            needle: editor.history.needle
          });
        }
      }
    } else if (needle === 2) { // is redo
      document.execCommand('undo', false);
      if (editor?.history) {
        if (editor.history.needle < editor.history.log.length) {
          editor.history.needle++;
          editor.worker.postMessage({
            call: 'onhistory',
            needle: editor.history.needle
          });
        }
      }
    }
    ignore = false;
    // if (needle !== history.needle) {
    //   if (needle >= 1) {
    //     history.needle = needle
    //     textarea.selectionStart = -1
    //     textarea.selectionEnd = -1
    //     events.targets?.focus?.postMessage({ call: 'onhistory', needle })
    //     // app.storeHistory(editor, history)
    //   } else {
    //     document.execCommand('redo', false)
    //   }
    // }
    // document.execCommand('redo', false)

    textarea.selectionStart = -1;
    textarea.selectionEnd = -1;
  };

  const targetHandler = (e, type) => {
    // if (ignore) return
    let _target = emptyTarget;
    for (const target of Object.values(editors)) {
      if (events.isWithin(e, target)) {
        _target = target;
        break
      }
    }
    events.setTarget(type, _target, e);
  };

  const rect = parent.getBoundingClientRect();
  const emptyTarget = {
    rect,
    parent,
    handleEvent () {}
  };

  const events = methods.events = {
    ignore: false,
    targets: {},
    setTarget (type, target, e) {
      const previous = this.targets[type];
      let noBlur = false;

      // enable overlayed items to handle their own events
      // so as far as we are concerned, the target is null
      if (target
      && e.target !== textarea
      && e.target !== target.canvas
      && e.target !== target.parent
      && (target !== emptyTarget && events.targets.hover !== emptyTarget)
      ) {
        target = null;
        type = 'hover';
        noBlur = true;
      }

      this.targets[type] = target;

      if (previous !== target) {
        const focus = type === 'focus';
        if (previous && !noBlur) {
          previous.handleEvent(
            focus ? 'window' : 'mouse',
            focus ? 'onblur' : 'onmouseout',
            e
          );
        }
        if (target) {
          target.handleEvent(
            focus ? 'window' : 'mouse',
            focus ? 'onfocus' : 'onmouseenter',
            e
          );
          target.handleEvent('mouse', 'on' + e.type, e);
        }
      }
    },
    isWithin (e, { isVisible, rect, parent }) {
      if (!isVisible) return
      let { left, top, right, bottom } = rect;
      left -= parent.scrollLeft; //+ window.pageXOffset
      right -= parent.scrollLeft; //+ window.pageXOffset
      top -= parent.scrollTop; //+ window.pageYOffset
      bottom -= parent.scrollTop; //+ window.pageYOffset
      if ((e.pageX ?? e.clientX) >= left && (e.pageX ?? e.clientX) <= right
      && (e.pageY ?? e.clientY) >= top && (e.pageY ?? e.clientY) <= bottom) {
        return true
      }
    },
    destroy () {
      const handlers = [
        ...mouseEventHandlers,
        ...keyEventHandlers,
        ...windowEventHandlers
      ];

      for (const [target, eventName, fn] of handlers.values()) {
        target.removeEventListener(eventName, fn);
      }

      window.removeEventListener('mousedown', focusTargetHandler, { capture: true, passive: false });
      window.removeEventListener('mousewheel', hoverTargetHandler, { capture: true, passive: false });
      window.removeEventListener('mousemove', hoverTargetHandler, { capture: true, passive: false });

      document.body.removeChild(textarea);
      textarea.oncut =
      textarea.oncopy =
      textarea.onpaste =
      textarea.oninput = null;
      textarea = null;
    }
  };

  const handlerMapper = (target, type) => eventName => {
    const handler = e => {
      let targets = events.targets;

      if (!targets.forceWithin) {
        if (eventName === 'onmousedown') {
          targetHandler(e, 'focus');
        } else if (eventName === 'onmousewheel' || eventName === 'onmousemove') {
          targetHandler(e, 'hover');
        }
      }
      if (type === 'mouse') {
        if (eventName === 'onmouseup') {
          targets.forceWithin = null;
        }
        if (eventName === 'onmousedown' && !targets.forceWithin) {
          targets.forceWithin = targets.hover;
        }
        if (targets.forceWithin) {
          return targets.forceWithin.handleEvent?.(type, eventName, e)
        }
        if (targets.hover && events.isWithin(e, targets.hover)) {
          return targets.hover.handleEvent?.(type, eventName, e)
        }
      } else if (targets.focus) {
        return targets.focus.handleEvent?.(type, eventName, e)
      }
      if (type === 'window') {
        if (eventName === 'onfocus') {
          return targets.focus?.handleEvent?.(type, eventName, e)
        } else {
          for (const editor of Object.values(editors)) {
            editor.handleEvent?.(type, eventName, e);
          }
        }
      }
    };
    target.addEventListener(
      eventName.slice(2),
      handler,
      { passive: false }
    );
    return [target, eventName.slice(2), handler]
  };

  const mouseEventHandlers = [
    'onmousewheel',
    'onmousedown',
    'onmouseup',
    'onmouseover',
    'onmousemove',
  ].map(handlerMapper(parent, 'mouse'));

  const keyEventHandlers = [
    'onkeydown',
    'onkeyup',
  ].map(handlerMapper(parent, 'key'));

  const windowEventHandlers = [
    'onblur',
    'onfocus',
    'onresize',
    'oncontextmenu',
  ].map(handlerMapper(window, 'window'));

  return events
};

const eventHandlers = {
  window (e, eventName, editor) {
    if (eventName === 'oncontextmenu') {
      return
    }
    if (eventName === 'onresize') {
      return
      // return {
      //   width: editor.width * pixelRatio,
      //   height: editor.height * pixelRatio
      // }
    }
    return {/* todo */}
  },
  mouse (e, eventName, editor) {
    if (textarea) {
      if (eventName === 'onmouseenter') {
        document.body.appendChild(textarea);
        methods.createUndoRedo();
        textarea.style.pointerEvents = 'all';
        textarea.focus();
      } else if (eventName === 'onmouseout') {
        textarea.style.pointerEvents = 'none';
        methods.removeUndoRedo();
        document.body.removeChild(textarea);
        textarea.blur();
      }
    }
    const rect = editor.rect;
    const clientX = e.pageX;
    const clientY = e.pageY;
    const deltaX = (e.deltaX || 0) / 1000;
    const deltaY = (e.deltaY || 0) / 1000;
    if (textarea) {
      textarea.style.left = e.clientX + 'px';
      textarea.style.top = e.clientY + 'px';
    }
    return {
      clientX: clientX - rect.x,
      clientY: clientY - rect.y,
      deltaX,
      deltaY,
      left: e.which === 1,
      middle: e.which === 2,
      right: e.which === 3
    }
  },
  key (e, eventName) {
    const {
      key,
      which,
      altKey,
      shiftKey,
      ctrlKey,
      metaKey
    } = e;
    const cmdKey = isMac ? metaKey : ctrlKey;
    if (cmdKey && key === 'r') return false
    if (cmdKey && key === 'z') return false
    if (cmdKey && key === 'y') return false
    if (cmdKey && key === 'c') return false
    if (cmdKey && key === 'x') return false
    if (cmdKey && (key === 'v' || key === 'V')) return false
    if (cmdKey && shiftKey && key === 'J') return false
    return {
      key,
      which,
      char: String.fromCharCode(which),
      altKey,
      shiftKey,
      ctrlKey,
      metaKey,
      cmdKey
    }
  }
};

class LoopNode {
  constructor ({ bpm = null, numberOfChannels = 2 } = {}) {
    this.currentBufferIndex = 0;
    this.offsetTime = 0;
    this.numberOfChannels = numberOfChannels;
    if (bpm) this.setBpm(bpm);
  }

  get bpm () {
    return parseFloat(
      (60 * (
        this.sampleRate
      / getBeatRate(this.sampleRate, this._bpm)
      )
    ).toFixed(6))
  }

  get beatRate () {
    return getBeatRate(this.sampleRate, this.bpm)
  }

  get currentTime () {
    return this.context.currentTime - this.offsetTime
  }

  get sampleRate () {
    return this.context.sampleRate
  }

  get barTime () {
    return this.bufferSize / this.sampleRate
  }

  get remainTime () {
    const bar = this.barTime;
    const time = this.currentTime;
    const remain = bar - (time % bar);
    return remain
  }

  get syncTime () {
    const bar = this.barTime;
    const time = this.currentTime;
    const remain = bar - (time % bar);
    return time + remain + this.offsetTime
  }

  get bufferSize () {
    return this.beatRate * 4 /// 5 | 0
  }

  resetTime (offset = 0) {
    this.offsetTime = this.context.currentTime + offset;
  }

  setBpm (bpm) {
    this._bpm = bpm;
  }

  _onended () {
    this.gain.disconnect();
    this.playingNode?.disconnect();
    this.onended?.();
  }

  connect (destination) {
    this.context = destination.context;
    this.destination = destination;
    this.gain = this.context.createGain();
    this.audioBuffers = [1,2].map(() =>
      this.context.createBuffer(
        this.numberOfChannels,
        this.bufferSize,
        this.sampleRate
      )
    );
    this.nextBuffer = this.audioBuffers[0];
  }

  _onbar () {
    if (!this.playing) return
    if (this.scheduledNode) {
      this.playingNode = this.scheduledNode;
      this.scheduledNode = null;
      this.currentBufferIndex = 1 - this.currentBufferIndex;
      this.nextBuffer = this.audioBuffers[this.currentBufferIndex];
    }
    this.scheduleNextBar();
    this.onbar?.();
  }

  scheduleNextBar (syncTime = this.syncTime) {
    const bar = this.context.createConstantSource();
    bar.onended = () => this._onbar();
    bar.start();
    bar.stop(syncTime);
  }

  playBuffer (buffer) {
    const syncTime = this.syncTime;
    const output = this.nextBuffer;
    for (let i = 0; i < this.numberOfChannels; i++) {
      const target = output.getChannelData(i);
      if (target.length !== buffer[i].length) {
        throw new RangeError('loop node: buffer size provided unequal to internal buffer size: '
          + buffer[i].length + ' instead of ' + target.length)
      }
      target.set(buffer[i]);
    }

    if (!this.scheduledNode) {
      const node = this.scheduledNode = this.context.createBufferSource();
      node.buffer = this.nextBuffer;
      node.connect(this.gain);
      node.loop = true;
      node.start(syncTime);
      this.playingNode?.stop(syncTime);
    }
  }

  start () {
    if (!this.playing) {
      this.playing = true;
      this.gain.connect(this.destination);
      this.scheduleNextBar();
    }
  }

  stop (syncTime = this.syncTime) {
    if (!this.playing) {
      throw new Error('loop node: `stop()` called but has not started')
    }
    this.playing = false;
    if (this.playingNode) {
      this.playingNode.onended = () => this._onended();
      this.playingNode.stop(syncTime);
    }
    if (this.scheduledNode) {
      this.scheduledNode.stop(0);
      this.scheduledNode.disconnect();
    }
  }
}

const getBeatRate = (sampleRate, bpm) => {
  return Math.round(sampleRate * (60 / bpm))
};

class Shared32Array {
  constructor (length) {
    return new Float32Array(
      new SharedArrayBuffer(
        length * Float32Array.BYTES_PER_ELEMENT)
    )
  }
}

const initial = `\
sin(mod(1/4).hz(35.881).exp(.057))
  .mod(1/4)
  .exp(5.82)
  .tanh(2.18).tanh(5.22)
    .on(7,1/4,8).tanh(15).vol(.3)
    .on(4,1/4).vol(0)
  .out(.7)

// sin(mod(1/8).hz(85.881).exp(.257)
    // .on(3,1/2,4).mul(2))
  // .mod(1/16)
  // .exp(5.82)
  // .tanh(10.18)
    // .on(4,1/4).vol(0)
  // .out(.12)

// mod(1/4).noise(133377).exp(10)
  // .delay(1/(800+sin(bt(1/2))*200),.7)
  // .delay(1/8,.2)
  // .delay(1/16,.8)
  // .eq(bp(700,.2))
  // .mod(1/2).exp(13)
  // .on(1,1/4,2).vol(0)._
  // .tanh(1.2)
  // .out(1.5)

mod(1/8).noise(133377).exp(19)
  .on(1,1/8,2).vol(0)
  .out(.3)

mod(1/16).noise(1377).exp(40)
  .out(.2)

mod(1/4).noise(500).exp(110)
  .offt(.986).noise(450).exp(110).vol(1.25)
  .offt(.976).noise(500).exp(110).vol(.9)
  .noise(8200).exp(8.5).vol(.1)
  .join()
  .eq(
    bp(1300,1.2,.7),
    bp(1100,1,.7),
    bp(800,.3,.75),
  )
    .on(1,1/4,4).vol(0)
    .on(3,1/4,4).vol(0)
  .out(1.4)

// offt(3/16).mod(1/8).sin(hz(570)+val(5).mod(1/8).exp(3)).exp(8).tanh(5)
  // .noise(800).exp(8).vol(.015)
  // .out(.20)

offt(3/16).mod(1/8).sin(hz(val(200).on(2,1/4,2).val(370).on(3,1/4,4).val(500)._.mul(.5))+val(5).mod(1/8).exp(3)).exp(8).tanh(5)
  .noise(800).exp(8).vol(.015)
  .out(.16)
`;

const numberOfChannels = 1;
const sampleRate = 44100;
const bpm = 120;

let audio, node;

let editor;

let currentWorker;
let nextWorker;

let playing = false;
let updateInProgress = false;
let hasChanged = false;

let n = 0;

const methods$1 = {
  play (worker, data) {
    n = data.n;
    if (!updateInProgress || worker === currentWorker) {
      return // discard
    }
    playing = true;
    updateInProgress = false;
    nextWorker = currentWorker;
    currentWorker = worker;
  }
};

const workers = [1,2].map(() => {
  const workerUrl = new URL('render-worker.js', import.meta.url);
  const worker = new Worker(workerUrl, { type: 'module' });
  worker.onmessage = ({ data }) => {
    methods$1[data.call](worker, data);
  };
  worker.onerror = error => {
    updateInProgress = false;
    console.error(error);
  };
  worker.onmessageerror = error => {
    updateInProgress = false;
    console.error(error);
  };
  return worker
});

currentWorker = workers[0];
nextWorker = workers[1];

const requestNextBuffer = () => {
  currentWorker.postMessage({ call: 'play' });
};

const updateRenderFunction = () => {
  if (updateInProgress) return
  hasChanged = false;

  if (!playing) {
    nextWorker = workers[0];
    currentWorker = workers[1];
  }

  updateInProgress = nextWorker;
  nextWorker.postMessage({
    call: 'updateRenderFunction',
    value: editor.value,
    n: n //+node.bufferSize
  });
};

document.body.onclick = () => {
  audio = new AudioContext({
    numberOfChannels,
    sampleRate,
    latencyHint: 'playback' // without this audio glitches
  });

  node = new LoopNode({ numberOfChannels, bpm });

  node.connect(audio.destination);

  workers.forEach(worker => {
    worker.buffer = Array(numberOfChannels).fill(0).map(() =>
      new Shared32Array(node.bufferSize));

    worker.postMessage({
      call: 'setup',
      buffer: worker.buffer,
      sampleRate,
      beatRate: node.beatRate
    });
  });

  node.onbar = () => {
    node.playBuffer(currentWorker.buffer);
    if (hasChanged) {
      updateRenderFunction();
    }
    requestNextBuffer();
  };

  console.log('connected node');

  const toggle = () => {
    updateRenderFunction();
    node.start();

    document.body.onclick = () => {};

    document.body.ondblclick = () => {
      node.stop(0);
      document.body.onclick = toggle;
    };
  };

  toggle();
};

const main = async () => {
  editor = new Editor({
    id: 'main',
    title: 'new-project.js',
    font: '/fonts/SpaceMono-Regular.woff2',
    value: initial,
    fontSize: '11.5pt',
    // fontSize: '16.4pt',
    padding: 10,
    titlebarHeight: 42,
    width: window.innerWidth,
    height: window.innerHeight,
  });

  editor.onchange = () => {
    hasChanged = true;
  };

  container.appendChild(editor.canvas);
  editor.parent = document.body;
  editor.rect = editor.canvas.getBoundingClientRect();

  registerEvents(document.body);
};

main();
