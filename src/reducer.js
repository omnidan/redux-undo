import * as debug from './debug'
import { ActionTypes } from './actions'
import { parseActions, isHistory } from './helpers'

// length: get length of history
function length (history) {
  const { past, future } = history
  return past.length + 1 + future.length
}

// insert: insert `state` into history, which means adding the current state
//         into `past`, setting the new `state` as `present` and erasing
//         the `future`.
function insert (history, state, limit) {
  debug.log('inserting', state)
  debug.log('new free: ', limit - length(history))

  const { past, present } = history
  const historyOverflow = limit && length(history) >= limit

  const newPast = history.wasFiltered
    ? past // if the last `present` was filtered, don't store it in the history
    : [
      ...past.slice(historyOverflow ? 1 : 0),
      present
    ]

  return {
    past: newPast,
    present: state,
    future: []
  }
}

// undo: go back to the previous point in history
function undo (history) {
  const { past, present, future } = history

  if (past.length <= 0) return history

  const newFuture = history.wasFiltered
    ? future // if the last `present` was filtered, don't store it in the future
    : [
      present, // old present state is in the future now
      ...future
    ]

  return {
    past: past.slice(0, past.length - 1), // remove last element from past
    present: past[past.length - 1], // set element as new present
    future: newFuture
  }
}

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

// jump: jump n steps in the past or forward
function jump (history, n) {
  if (n > 0) return jumpToFuture(history, n - 1)
  if (n < 0) return jumpToPast(history, history.past.length + n)
  return history
}

// createHistory
function createHistory (state) {
  return {
    past: [],
    present: state,
    future: []
  }
}

// helper to dynamically match in the reducer's switch-case
function actionTypeAmongClearHistoryType (actionType, clearHistoryType) {
  return clearHistoryType.indexOf(actionType) > -1 ? actionType : !actionType
}

// redux-undo higher order reducer
export default function undoable (reducer, rawConfig = {}) {
  debug.set(rawConfig.debug)

  const config = {
    initTypes: parseActions(rawConfig.initTypes, ['@@redux-undo/INIT']),
    limit: rawConfig.limit,
    filter: rawConfig.filter || (() => true),
    undoType: rawConfig.undoType || ActionTypes.UNDO,
    redoType: rawConfig.redoType || ActionTypes.REDO,
    jumpToPastType: rawConfig.jumpToPastType || ActionTypes.JUMP_TO_PAST,
    jumpToFutureType: rawConfig.jumpToFutureType || ActionTypes.JUMP_TO_FUTURE,
    jumpType: rawConfig.jumpType || ActionTypes.JUMP,
    clearHistoryType: Array.isArray(rawConfig.clearHistoryType) ?
      rawConfig.clearHistoryType :
      [rawConfig.clearHistoryType || ActionTypes.CLEAR_HISTORY]
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
        debug.log('perform undo')
        debug.end(res)
        return res

      case config.redoType:
        res = redo(history)
        debug.log('perform redo')
        debug.end(res)
        return res

      case config.jumpToPastType:
        res = jumpToPast(history, action.index)
        debug.log(`perform jumpToPast to ${action.index}`)
        debug.end(res)
        return res

      case config.jumpToFutureType:
        res = jumpToFuture(history, action.index)
        debug.log(`perform jumpToFuture to ${action.index}`)
        debug.end(res)
        return res

      case config.jumpType:
        res = jump(history, action.index)
        debug.log(`perform jump to ${action.index}`)
        debug.end(res)
        return res

      case actionTypeAmongClearHistoryType(action.type, config.clearHistoryType):
        res = createHistory(history.present)
        debug.log('perform clearHistory')
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

        // insert before filtering because the previous action might not have
        // been filtered and `insert` checks for `wasFiltered` anyway
        history = insert(history, res, config.limit)

        if (typeof config.filter === 'function' && !config.filter(action, res, history)) {
          const nextState = {
            ...history,
            wasFiltered: true,
            present: res
          }
          debug.log('filter prevented action, not storing it')
          debug.end(nextState)
          return nextState
        }

        debug.log('inserted new state into history')
        debug.end(history)
        return history
    }
  }
}
