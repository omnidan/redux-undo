// debug output
let __DEBUG__
function debug (...args) {
  if (__DEBUG__) {
    if (!console.group) {
      args.unshift('%credux-undo', 'font-style: italic')
    }
    console.log(...args)
  }
}
function debugStart (action, state) {
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

  if (present === undefined) {
    // init history
    return {
      past: [],
      present: state,
      future: []
    }
  }

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
    initialState: rawConfig.initialState,
    initTypes: parseActions(rawConfig.initTypes, ['@@redux/INIT', '@@INIT']),
    limit: rawConfig.limit,
    filter: rawConfig.filter || (() => true),
    undoType: rawConfig.undoType || ActionTypes.UNDO,
    redoType: rawConfig.redoType || ActionTypes.REDO,
    jumpToPastType: rawConfig.jumpToPastType || ActionTypes.JUMP_TO_PAST,
    jumpToFutureType: rawConfig.jumpToFutureType || ActionTypes.JUMP_TO_FUTURE,
    clearHistoryType: rawConfig.clearHistoryType || ActionTypes.CLEAR_HISTORY
  }
  config.history = rawConfig.initialHistory || createHistory(config.initialState)

  if (config.initTypes.length === 0) {
    console.warn('redux-undo: supply at least one action type in initTypes to ensure initial state')
  }

  return (state, action) => {
    debugStart(action, state)
    let res
    switch (action.type) {
      case config.undoType:
        res = undo(state)
        debug('after undo', res)
        debugEnd()
        return res

      case config.redoType:
        res = redo(state)
        debug('after redo', res)
        debugEnd()
        return res

      case config.jumpToPastType:
        res = jumpToPast(state, action.index)
        debug('after jumpToPast', res)
        debugEnd()
        return res

      case config.jumpToFutureType:
        res = jumpToFuture(state, action.index)
        debug('after jumpToFuture', res)
        debugEnd()
        return res

      case config.clearHistoryType:
        res = createHistory(state.present)
        debug('cleared history', res)
        debugEnd()
        return res

      default:
        res = reducer(state && state.present, action)

        if (config.initTypes.some((actionType) => actionType === action.type)) {
          debug('reset history due to init action')
          debugEnd()
          return createHistory(res)
        }

        if (config.filter && typeof config.filter === 'function') {
          if (!config.filter(action, res, state && state.present)) {
            debug('filter prevented action, not storing it')
            debugEnd()
            return {
              ...state,
              present: res
            }
          }
        }

        const history = (state && state.present !== undefined) ? state : config.history
        const updatedHistory = insert(history, res, config.limit)
        debug('after insert', {history: updatedHistory, free: config.limit - length(updatedHistory)})
        debugEnd()
        return updatedHistory
    }
  }
}
// /redux-undo

// distinctState helper
export function distinctState () {
  return (action, currentState, previousState) => currentState !== previousState
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
