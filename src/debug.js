let __DEBUG__
let displayBuffer

const colors = {
  prevState: '#9E9E9E',
  action: '#03A9F4',
  nextState: '#4CAF50'
}

function initBuffer () {
  displayBuffer = {
    header: [],
    prev: [],
    action: [],
    next: [],
    msgs: []
  }
}

function printBuffer () {
  let { header, prev, next, action, msgs } = displayBuffer
  if (console.group) {
    console.groupCollapsed(...header)
    console.log(...prev)
    console.log(...action)
    console.log(...next)
    console.log(...msgs)
    console.groupEnd()
  } else {
    console.log(...header)
    console.log(...prev)
    console.log(...action)
    console.log(...next)
    console.log(...msgs)
  }
}

function colorFormat (text, color, obj) {
  return [
    `%c${text}`,
    `color: ${color}; font-weight: bold`,
    obj
  ]
}

function start (action, state) {
  initBuffer()
  if (__DEBUG__) {
    if (console.group) {
      displayBuffer.header = ['%credux-undo', 'font-style: italic', 'action', action.type]
      displayBuffer.action = colorFormat('action', colors.action, action)
      displayBuffer.prev = colorFormat('prev history', colors.prevState, state)
    } else {
      displayBuffer.header = ['redux-undo action', action.type]
      displayBuffer.action = ['action', action]
      displayBuffer.prev = ['prev history', state]
    }
  }
}

function end (nextState) {
  if (__DEBUG__) {
    if (console.group) {
      displayBuffer.next = colorFormat('next history', colors.nextState, nextState)
    } else {
      displayBuffer.next = ['next history', nextState]
    }
    printBuffer()
  }
}

function log (...args) {
  if (__DEBUG__) {
    displayBuffer.msgs = displayBuffer.msgs
      .concat([...args, '\n'])
  }
}

function set (debug) {
  __DEBUG__ = debug
}

export { set, start, end, log }
