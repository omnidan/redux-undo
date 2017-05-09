import * as debug from './debug'
import { ActionTypes } from './actions'
import { parseActions, isHistory } from './helpers'

// lengthWithoutFuture: get length of history
function lengthWithoutFuture (history) {
  return history.past.length + 1
}

// insert: insert `state` into history, which means adding the current state
//         into `past`, setting the new `state` as `present` and erasing
//         the `future`.
function insert (history, state, limit) {
  debug.log('inserting', state)
  debug.log('new free: ', limit - lengthWithoutFuture(history))

  const { past, _latestUnfiltered } = history
  const historyOverflow = limit && lengthWithoutFuture(history) >= limit

  const pastSliced = past.slice(historyOverflow ? 1 : 0)
  const newPast = _latestUnfiltered != null
    ? [
      ...pastSliced,
      _latestUnfiltered
    ] : pastSliced

  return {
    past: newPast,
    present: state,
    _latestUnfiltered: state,
    future: []
  }
}

// undo: go back to the previous point in history
function undo (history) {
  const { past, future, _latestUnfiltered } = history

  if (past.length <= 0) return history

  const newFuture = _latestUnfiltered != null
    ? [
      _latestUnfiltered,
      ...future
    ] : future

  const newPresent = past[past.length - 1]
  return {
    past: past.slice(0, past.length - 1), // remove last element from past
    present: newPresent, // set element as new present
    _latestUnfiltered: newPresent,
    future: newFuture
  }
}

// redo: go to the next point in history
function redo (history) {
  const { past, future, _latestUnfiltered } = history

  if (future.length <= 0) return history

  const newPast = _latestUnfiltered != null
    ? [
      ...past,
      _latestUnfiltered
    ] : past

  const newPresent = future[0]
  return {
    future: future.slice(1, future.length), // remove element from future
    present: newPresent, // set element as new present
    _latestUnfiltered: newPresent,
    past: newPast
  }
}

// jumpToFuture: jump to requested index in future history
function jumpToFuture (history, index) {
  if (index === 0) return redo(history)
  if (index < 0 || index >= history.future.length) return history

  const { past, future, _latestUnfiltered } = history

  const newPresent = future[index]

  return {
    future: future.slice(index + 1),
    present: newPresent,
    _latestUnfiltered: newPresent,
    past: past.concat([_latestUnfiltered])
      .concat(future.slice(0, index))
  }
}

// jumpToPast: jump to requested index in past history
function jumpToPast (history, index) {
  if (index === history.past.length - 1) return undo(history)
  if (index < 0 || index >= history.past.length) return history

  const { past, future, _latestUnfiltered } = history

  const newPresent = past[index]

  return {
    future: past.slice(index + 1)
      .concat([_latestUnfiltered])
      .concat(future),
    present: newPresent,
    _latestUnfiltered: newPresent,
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
function createHistory (state, ignoreInitialState) {
  // ignoreInitialState essentially prevents the user from undoing to the
  // beginning, in the case that the undoable reducer handles initialization
  // in a way that can't be redone simply
  return ignoreInitialState ? {
    past: [],
    present: state,
    future: []
  } : {
    past: [],
    present: state,
    _latestUnfiltered: state,
    future: []
  }
}

// helper to dynamically match in the reducer's switch-case
function actionTypeAmongClearHistoryType (actionType, clearHistoryType) {
  return clearHistoryType.indexOf(actionType) > -1 ? actionType : !actionType
}

function defaultReduce (history, action, res, config) {
  const isSquashed = typeof config.squash === 'function' && config.squash(action, res, history)

  if (typeof config.filter === 'function' && !config.filter(action, res, history)) {
    // if filtering an action, merely update the present
    const filteredState = {
      ...history,
      present: res,
      _latestUnfiltered: isSquashed ? res : history._latestUnfiltered
    }
    debug.log('filter prevented action, not storing it')
    debug.end(filteredState)
    return filteredState
  } else {
    // If the action wasn't filtered, insert normally
    const squashedState = isSquashed ? {
      ...history,
      _latestUnfiltered: history.present
    } : history
    const newState = insert(squashedState, res, config.limit)

    debug.log('inserted new state into history')
    debug.end(newState)
    return newState
  }
}

// redux-undo higher order reducer
export default function undoable (reducer, rawConfig = {}) {
  debug.set(rawConfig.debug)

  const config = {
    initTypes: parseActions(rawConfig.initTypes, ['@@redux-undo/INIT']),
    limit: rawConfig.limit,
    filter: rawConfig.filter || (() => true),
    squash: rawConfig.squash || null,
    undoType: rawConfig.undoType || ActionTypes.UNDO,
    redoType: rawConfig.redoType || ActionTypes.REDO,
    jumpToPastType: rawConfig.jumpToPastType || ActionTypes.JUMP_TO_PAST,
    jumpToFutureType: rawConfig.jumpToFutureType || ActionTypes.JUMP_TO_FUTURE,
    jumpType: rawConfig.jumpType || ActionTypes.JUMP,
    clearHistoryType:
      Array.isArray(rawConfig.clearHistoryType)
      ? rawConfig.clearHistoryType
      : [rawConfig.clearHistoryType || ActionTypes.CLEAR_HISTORY],
    neverSkipReducer: rawConfig.neverSkipReducer || false,
    ignoreInitialState: rawConfig.ignoreInitialState || false
  }

  return (state = config.history, action = {}, ...slices) => {
    debug.start(action, state)

    let history = state
    if (!config.history) {
      debug.log('history is uninitialized')

      if (state === undefined) {
        history = config.history = createHistory(reducer(
          state, { type: '@@redux-undo/CREATE_HISTORY' }),
          config.ignoreInitialState,
          ...slices
        )
        debug.log('do not initialize on probe actions')
      } else if (isHistory(state)) {
        history = config.history = config.ignoreInitialState
          ? state : {
            ...state,
            _latestUnfiltered: state.present
          }
        debug.log('initialHistory initialized: initialState is a history', config.history)
      } else {
        history = config.history = createHistory(state)
        debug.log('initialHistory initialized: initialState is not a history', config.history)
      }
    }

    const skipReducer = (res) => config.neverSkipReducer
      ? {
        ...res,
        present: reducer(res.present, action, ...slices)
      } : res

    let res
    switch (action.type) {
      case undefined:
        return history

      case config.undoType:
        res = undo(history)
        debug.log('perform undo')
        debug.end(res)
        return skipReducer(res)

      case config.redoType:
        res = redo(history)
        debug.log('perform redo')
        debug.end(res)
        return skipReducer(res)

      case config.jumpToPastType:
        res = jumpToPast(history, action.index)
        debug.log(`perform jumpToPast to ${action.index}`)
        debug.end(res)
        return skipReducer(res)

      case config.jumpToFutureType:
        res = jumpToFuture(history, action.index)
        debug.log(`perform jumpToFuture to ${action.index}`)
        debug.end(res)
        return skipReducer(res)

      case config.jumpType:
        res = jump(history, action.index)
        debug.log(`perform jump to ${action.index}`)
        debug.end(res)
        return skipReducer(res)

      case actionTypeAmongClearHistoryType(action.type, config.clearHistoryType):
        res = createHistory(history.present)
        debug.log('perform clearHistory')
        debug.end(res)
        return skipReducer(res)

      default:
        res = reducer(
          history.present,
          action,
          ...slices
        )

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

        return defaultReduce(history, action, res, config)
    }
  }
}
