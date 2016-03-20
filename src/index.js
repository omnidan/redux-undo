// debug output
let __DEBUG__
/* istanbul ignore next: debug messaging is not tested */
let debug = (function debugGrouper () {
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

  return {
    start,
    end,
    log
  }
})()
// /debug output

// action types
export const ActionTypes = {
  UNDO: '@@redux-undo/UNDO',
  REDO: '@@redux-undo/REDO',
  JUMP_TO_FUTURE: '@@redux-undo/JUMP_TO_FUTURE',
  JUMP_TO_PAST: '@@redux-undo/JUMP_TO_PAST',
  JUMP: '@@redux-undo/JUMP',
  CLEAR_HISTORY: '@@redux-undo/CLEAR_HISTORY'
}
// /action types

// action creators to change the state
export const ActionCreators = {
  undo () {
    return { type: ActionTypes.UNDO }
  },
  redo () {
    return { type: ActionTypes.REDO }
  },
  jumpToFuture (index) {
    return { type: ActionTypes.JUMP_TO_FUTURE, index }
  },
  jumpToPast (index) {
    return { type: ActionTypes.JUMP_TO_PAST, index }
  },
  jump (index) {
    return { type: ActionTypes.JUMP, index }
  },
  clearHistory () {
    return { type: ActionTypes.CLEAR_HISTORY }
  }
}
// /action creators

// length: get length of history
function length (history) {
  const { past, future } = history
  return past.length + 1 + future.length
}
// /length

// insert: insert `state` into history, which means adding the current state
//         into `past`, setting the new `state` as `present` and erasing
//         the `future`.
function insert (history, state, limit) {
  debug.log('inserting', state)
  debug.log('new free: ', limit - length(history))

  const { past, present } = history
  const historyOverflow = limit && length(history) >= limit

  return {
    past: [
      ...past.slice(historyOverflow ? 1 : 0),
      present
    ],
    present: state,
    future: []
  }
}
// /insert

// undo: go back to the previous point in history
function undo (history) {
  const { past, present, future } = history

  if (past.length <= 0) return history

  return {
    past: past.slice(0, past.length - 1), // remove last element from past
    present: past[past.length - 1], // set element as new present
    future: [
      present, // old present state is in the future now
      ...future
    ]
  }
}
// /undo

// redo: go to the next point in history
function redo (history) {
  const { past, present, future } = history

  if (future.length <= 0) return history

  return {
    future: future.slice(1, future.length), // remove element from future
    present: future[0], // set element as new present
    past: [
      ...past,
      present // old present state is in the past now
    ]
  }
}
// /redo

// jumpToFuture: jump to requested index in future history
function jumpToFuture (history, index) {
  if (index === 0) return redo(history)
  if (index < 0 || index >= history.future.length) return history

  const { past, present, future } = history

  return {
    future: future.slice(index + 1),
    present: future[index],
    past: past.concat([present])
              .concat(future.slice(0, index))
  }
}
// /jumpToFuture

// jumpToPast: jump to requested index in past history
function jumpToPast (history, index) {
  if (index === history.past.length - 1) return undo(history)
  if (index < 0 || index >= history.past.length) return history

  const { past, present, future } = history

  return {
    future: past.slice(index + 1)
                .concat([present])
                .concat(future),
    present: past[index],
    past: past.slice(0, index)
  }
}
// /jumpToPast

// jump: jump n steps in the past or forward
function jump (history, n) {
  if (n > 0) return jumpToFuture(history, n - 1)
  if (n < 0) return jumpToPast(history, history.past.length + n)
  return history
}
// /jump

// createHistory
function createHistory (state) {
  return {
    past: [],
    present: state,
    future: []
  }
}
// /createHistory

// parseActions
export function parseActions (rawActions, defaultValue = []) {
  if (Array.isArray(rawActions)) {
    return rawActions
  } else if (typeof rawActions === 'string') {
    return [rawActions]
  }
  return defaultValue
}
// /parseActions

// redux-undo higher order reducer
export default function undoable (reducer, rawConfig = {}) {
  __DEBUG__ = rawConfig.debug

  const config = {
    initTypes: parseActions(rawConfig.initTypes, ['@@redux-undo/INIT']),
    limit: rawConfig.limit,
    filter: rawConfig.filter || (() => true),
    undoType: rawConfig.undoType || ActionTypes.UNDO,
    redoType: rawConfig.redoType || ActionTypes.REDO,
    jumpToPastType: rawConfig.jumpToPastType || ActionTypes.JUMP_TO_PAST,
    jumpToFutureType: rawConfig.jumpToFutureType || ActionTypes.JUMP_TO_FUTURE,
    jumpType: rawConfig.jumpType || ActionTypes.JUMP,
    clearHistoryType: rawConfig.clearHistoryType || ActionTypes.CLEAR_HISTORY
  }

  return (state = config.history, action = {}) => {
    debug.start(action, state)

    let history = state
    if (!config.history) {
      debug.log('history is uninitialized')

      if (state === undefined) {
        history = createHistory(reducer(state, {}))
        debug.log('do not initialize on probe actions')
      } else if (isHistory(state)) {
        history = config.history = state
        debug.log('initialHistory initialized: initialState is a history', config.history)
      } else {
        history = config.history = createHistory(state)
        debug.log('initialHistory initialized: initialState is not a history', config.history)
      }
    }

    let res
    switch (action.type) {
      case undefined:
        return history

      case config.undoType:
        res = undo(history)
        debug.log('perform undo', res)
        debug.end(res)
        return res

      case config.redoType:
        res = redo(history)
        debug.log('perform redo', res)
        debug.end(res)
        return res

      case config.jumpToPastType:
        res = jumpToPast(history, action.index)
        debug.log(`perform jumpToPast to ${action.index}`, res)
        debug.end(res)
        return res

      case config.jumpToFutureType:
        res = jumpToFuture(history, action.index)
        debug.log(`perform jumpToFuture to ${action.index}`, res)
        debug.end(res)
        return res

      case config.jumpType:
        res = jump(history, action.index)
        debug.log(`perform jump to ${action.index}`, res)
        debug.end(res)
        return res

      case config.clearHistoryType:
        res = createHistory(history.present)
        debug.log('perform clearHistory', res)
        debug.end(res)
        return res

      default:
        res = reducer(history.present, action)

        if (config.initTypes.some((actionType) => actionType === action.type)) {
          debug.log('reset history due to init action')
          debug.end(config.history)
          return config.history
        }

        if (history.present === res) {
          // Don't handle this action. Do not call debug.end here,
          // because this action should not produce side effects to the console
          return history
        }

        if (typeof config.filter === 'function' && !config.filter(action, res, history)) {
          const nextState = {
            ...history,
            present: res
          }
          debug.log('filter prevented action, not storing it')
          debug.end(nextState)
          return nextState
        }

        history = insert(history, res, config.limit)
        debug.log('inserted new state into history')
        debug.end(history)
        return history
    }
  }
}
// /redux-undo

// isHistory helper: check for a valid history object
export function isHistory (history) {
  return typeof history.present !== 'undefined' &&
    typeof history.future !== 'undefined' &&
    typeof history.past !== 'undefined' &&
    Array.isArray(history.future) &&
    Array.isArray(history.past)
}
// /isHistory

// includeAction helper
export function includeAction (rawActions) {
  const actions = parseActions(rawActions)
  return (action) => actions.indexOf(action.type) >= 0
}
// /includeAction

// excludeAction helper
export function excludeAction (rawActions = []) {
  const actions = parseActions(rawActions)
  return (action) => actions.indexOf(action.type) < 0
}
// /excludeAction
