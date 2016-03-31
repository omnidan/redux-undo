// debug output
let __DEBUG__
function debug (...args) {
  /* istanbul ignore if */
  if (__DEBUG__) {
    if (!console.group) {
      args.unshift('%credux-undo', 'font-style: italic')
    }
    console.log(...args)
  }
}
function debugStart (action, state) {
  /* istanbul ignore if */
  if (__DEBUG__) {
    const args = ['action', action.type]
    if (console.group) {
      args.unshift('%credux-undo', 'font-style: italic')
      console.groupCollapsed(...args)
      console.log('received', {state, action})
    } else {
      debug(...args)
    }
  }
}
function debugEnd () {
  /* istanbul ignore if */
  if (__DEBUG__) {
    return console.groupEnd && console.groupEnd()
  }
}
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
  debug('insert', {state, history, free: limit - length(history)})

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
  debug('undo', {history})

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
  debug('redo', {history})

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
    debugStart(action, state)

    let history = state
    if (!config.history) {
      debug('history is uninitialized')

      if (state === undefined) {
        history = createHistory(reducer(state, {}))
        debug('do not initialize on probe actions')
      } else if (isHistory(state)) {
        history = config.history = state
        debug('initialHistory initialized: initialState is a history', config.history)
      } else {
        history = config.history = createHistory(state)
        debug('initialHistory initialized: initialState is not a history', config.history)
      }
    }

    let res
    switch (action.type) {
      case undefined:
        return history

      case config.undoType:
        res = undo(history)
        debug('after undo', res)
        debugEnd()
        return res

      case config.redoType:
        res = redo(history)
        debug('after redo', res)
        debugEnd()
        return res

      case config.jumpToPastType:
        res = jumpToPast(history, action.index)
        debug('after jumpToPast', res)
        debugEnd()
        return res

      case config.jumpToFutureType:
        res = jumpToFuture(history, action.index)
        debug('after jumpToFuture', res)
        debugEnd()
        return res

      case config.jumpType:
        res = jump(history, action.index)
        debug('after jump', res)
        debugEnd()
        return res

      case config.clearHistoryType:
        res = createHistory(history.present)
        debug('cleared history', res)
        debugEnd()
        return res

      default:
        res = reducer(history.present, action)

        if (config.initTypes.some((actionType) => actionType === action.type)) {
          debug('reset history due to init action')
          debugEnd()
          return config.history
        }

        if (typeof config.filter === 'function' && !config.filter(action, res, history)) {
          debug('filter prevented action, not storing it')
          debugEnd()
          return {
            ...history,
            present: res
          }
        }

        if (history.present !== res) {
          history = insert(history, res, config.limit)
          debug('inserted new state into history')
        } else {
          debug('not inserted, history is unchanged')
        }

        debug('history: ', history, ' free: ', config.limit - length(history))
        debugEnd()
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

// distinctState helper
export function distinctState () {
  console.warning('distinctState is deprecated in beta4 and newer. The distinctState behavior is now default, which means only actions resulting in a new state are recorded. See https://github.com/omnidan/redux-undo#filtering-actions for more details.')
  return () => true
}
// /distinctState

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
