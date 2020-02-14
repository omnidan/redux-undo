import * as debug from './debug'
import { ActionTypes } from './actions'
import { parseActions, isHistory, newHistory } from './helpers'

// createHistory
function createHistory (state, ignoreInitialState) {
  // ignoreInitialState essentially prevents the user from undoing to the
  // beginning, in the case that the undoable reducer handles initialization
  // in a way that can't be redone simply
  const history = newHistory([], state, [])
  if (ignoreInitialState) {
    history._latestUnfiltered = null
  }
  return history
}

// insert: insert `state` into history, which means adding the current state
//         into `past`, setting the new `state` as `present` and erasing
//         the `future`.
function insert (history, state, limit, group) {
  const lengthWithoutFuture = history.past.length + 1

  debug.log('inserting', state)
  debug.log('new free: ', limit - lengthWithoutFuture)

  const { past, _latestUnfiltered } = history
  const isHistoryOverflow = limit && limit <= lengthWithoutFuture

  const pastSliced = past.slice(isHistoryOverflow ? 1 : 0)
  const newPast = _latestUnfiltered != null
    ? [
      ...pastSliced,
      _latestUnfiltered
    ] : pastSliced

  return newHistory(newPast, state, [], group)
}

// jumpToFuture: jump to requested index in future history
function jumpToFuture (history, index) {
  if (index < 0 || index >= history.future.length) return history

  const { past, future, _latestUnfiltered } = history

  const newPast = [...past, _latestUnfiltered, ...future.slice(0, index)]
  const newPresent = future[index]
  const newFuture = future.slice(index + 1)

  return newHistory(newPast, newPresent, newFuture)
}

// jumpToPast: jump to requested index in past history
function jumpToPast (history, index) {
  if (index < 0 || index >= history.past.length) return history

  const { past, future, _latestUnfiltered } = history

  const newPast = past.slice(0, index)
  const newFuture = [...past.slice(index + 1), _latestUnfiltered, ...future]
  const newPresent = past[index]

  return newHistory(newPast, newPresent, newFuture)
}

// jump: jump n steps in the past or forward
function jump (history, n) {
  if (n > 0) return jumpToFuture(history, n - 1)
  if (n < 0) return jumpToPast(history, history.past.length + n)
  return history
}

// helper to dynamically match in the reducer's switch-case
function actionTypeAmongClearHistoryType (actionType, clearHistoryType) {
  return clearHistoryType.indexOf(actionType) > -1 ? actionType : !actionType
}

// redux-undo higher order reducer
export default function undoable (reducer, rawConfig = {}) {
  debug.set(rawConfig.debug)

  const config = {
    limit: undefined,
    filter: () => true,
    groupBy: () => null,
    undoType: ActionTypes.UNDO,
    redoType: ActionTypes.REDO,
    jumpToPastType: ActionTypes.JUMP_TO_PAST,
    jumpToFutureType: ActionTypes.JUMP_TO_FUTURE,
    jumpType: ActionTypes.JUMP,
    neverSkipReducer: false,
    ignoreInitialState: false,
    syncFilter: false,
    extension: (state) => state,
    disableWarnings: false,

    ...rawConfig,

    initTypes: parseActions(rawConfig.initTypes, ['@@redux-undo/INIT']),
    clearHistoryType: parseActions(
      rawConfig.clearHistoryType,
      [ActionTypes.CLEAR_HISTORY]
    )
  }

  const withExtensions = config.extension

  // By default, the user's reducer is skipped on redux-undo actions
  let skipReducer
  if (config.neverSkipReducer) {
    skipReducer = (history, action, ...slices) => {
      const present = reducer(history.present, action, ...slices)
      return withExtensions({ ...history, present }, action)
    }
  } else {
    skipReducer = (history, action) => withExtensions(history, action)
  }

  let initialState
  return (state = initialState, action = {}, ...slices) => {
    debug.start(action, state)

    let history = state
    if (!initialState) {
      debug.log('history is uninitialized')

      if (state === undefined) {
        const createHistoryAction = { type: '@@redux-undo/CREATE_HISTORY' }
        const start = reducer(state, createHistoryAction, ...slices)

        history = createHistory(
          start,
          config.ignoreInitialState
        )

        debug.log('do not set initialState on probe actions')
        debug.end(history)
        return history
      } else if (isHistory(state)) {
        history = initialState = config.ignoreInitialState
          ? state : newHistory(
            state.past,
            state.present,
            state.future
          )
        debug.log(
          'initialHistory initialized: initialState is a history',
          initialState
        )
      } else {
        history = initialState = createHistory(
          state,
          config.ignoreInitialState
        )
        debug.log(
          'initialHistory initialized: initialState is not a history',
          initialState
        )
      }
    }

    let res
    switch (action.type) {
      case undefined:
        return history

      case config.undoType:
        res = jump(history, -1)
        debug.log('perform undo')
        debug.end(res)
        return skipReducer(res, action, ...slices)

      case config.redoType:
        res = jump(history, 1)
        debug.log('perform redo')
        debug.end(res)
        return skipReducer(res, action, ...slices)

      case config.jumpToPastType:
        res = jumpToPast(history, action.index)
        debug.log(`perform jumpToPast to ${action.index}`)
        debug.end(res)
        return skipReducer(res, action, ...slices)

      case config.jumpToFutureType:
        res = jumpToFuture(history, action.index)
        debug.log(`perform jumpToFuture to ${action.index}`)
        debug.end(res)
        return skipReducer(res, action, ...slices)

      case config.jumpType:
        res = jump(history, action.index)
        debug.log(`perform jump to ${action.index}`)
        debug.end(res)
        return skipReducer(res, action, ...slices)

      case actionTypeAmongClearHistoryType(action.type, config.clearHistoryType):
        res = createHistory(history.present, config.ignoreInitialState)
        debug.log('perform clearHistory')
        debug.end(res)
        return skipReducer(res, action, ...slices)

      default:
        res = reducer(
          history.present,
          action,
          ...slices
        )

        if (config.initTypes.some((actionType) => actionType === action.type)) {
          debug.log('reset history due to init action')
          debug.end(initialState)
          return initialState
        }

        if (history._latestUnfiltered === res) {
          // Don't handle this action. Do not call debug.end here,
          // because this action should not produce side effects to the console
          // Do not wrap with withExtensions()
          return history
        }

        /* eslint-disable-next-line no-case-declarations */
        const filtered = typeof config.filter === 'function' && !config.filter(
          action,
          res,
          history
        )

        if (filtered) {
          // if filtering an action, merely update the present
          const filteredState = newHistory(
            history.past,
            res,
            history.future,
            history.group
          )
          if (!config.syncFilter) {
            filteredState._latestUnfiltered = history._latestUnfiltered
          }
          debug.log('filter ignored action, not storing it in past')
          debug.end(filteredState)
          return withExtensions(filteredState, action)
        }

        /* eslint-disable-next-line no-case-declarations */
        const group = config.groupBy(action, res, history)
        if (group != null && group === history.group) {
          // if grouping with the previous action, only update the present
          const groupedState = newHistory(
            history.past,
            res,
            history.future,
            history.group
          )
          debug.log('groupBy grouped the action with the previous action')
          debug.end(groupedState)
          return withExtensions(groupedState, action)
        }

        // If the action wasn't filtered or grouped, insert normally
        history = insert(history, res, config.limit, group)

        debug.log('inserted new state into history')
        debug.end(history)
        return withExtensions(history, action)
    }
  }
}
