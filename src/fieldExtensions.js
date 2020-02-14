/**
 * The flattenState() field extension allows the user to access fields normally like
 * `state.field` instead of `state.present.field`.
 *
 * Warning: if your state has fields that conflict with redux-undo's like .past or .index
 * they will be overridden. You must access them as `state.present.past` or `state.present.index`
 */

export const flattenState = () => {
  return (undoableConfig) => {
    if (!undoableConfig.disableWarnings) {
      console.warn(
        'Warning: the flattenState() extension prioritizes redux-undo fields when flattening state.',
        'If your state has the fields `limit` and `present`, you must access them',
        'with `state.present.limit` and `state.present.present` respectively.\n',
        'Disable this warning by passing `disableWarnings: true` into the undoable config'
      )
    }

    return (state) => {
      // state.present MUST be spread first so that redux-undo fields have priority
      return { ...state.present, ...state }
    }
  }
}

/**
 * @callback actionFieldIncludeAction
 * @param {Action} action - The current action.
 * @returns {boolean}
 */

/**
 * The actionField() field extension allows users to insert the last occuring action
 * into their state.
 *
 * @param {Object} config - Configure actionField()
 *
 * @param {string} config.insertMethod - How the last action will be inserted. Possible options are:
 *   - actionType: { ...state, actionType: 'LAST_ACTION' }
 *   - action: { ...state, action: { type: 'LAST_ACTION', ...actionPayload } }
 *   - inline: { ...state, present: { action: { type: 'LAST', ...payload }, ...otherFields } }
 *
 * @param {actionFieldIncludeAction} config.includeAction - A filter function that decides if
 * the action is inserted into history.
 */
export const actionField = ({ insertMethod, includeAction }) => {
  let extend
  if (insertMethod === 'action') {
    extend = (state, action) => ({ ...state, action })
  } else if (insertMethod === 'inline') {
    // Here, action must be inserted into present first so that
    // it is overidden when the action is an undo or redo
    extend = (state, action) => ({ ...state, present: { action, ...state.present } })
  } else if (!insertMethod || insertMethod === 'actionType') {
    extend = (state, action) => ({ ...state, actionType: action.type })
  } else {
    throw new Error(
      `Unrecognized \`insertMethod\` option for actionField() extension: ${insertMethod}.\n` +
      'Options are "action", "inline", or "actionType"'
    )
  }

  return (undoableConfig) => {
    const ignored = includeAction || (() => true)

    if (!undoableConfig.disableWarnings) {
      console.warn(
        'Warning: the actionField() extension might override other state fields',
        'such as "action", "inline", or "actionType".\n',
        'Disable this warning by passing `disableWarnings: true` into the undoable config'
      )
    }

    // actionField must have its own version of latestUnfiltered because when syncFilter = true
    let lastPresent

    return (state, action) => {
      if (lastPresent !== state.present && !ignored(action)) {
        lastPresent = state.present
        return extend(state, action)
      }

      return state
    }
  }
}

// This will be put on hold for now...
// eslint-disable-next-line no-unused-vars
const nullifyFields = (fields = [], nullValue = null) => {
  const removeFields = (state) => {
    if (!state) return state

    for (const toNullify of fields) {
      state[toNullify] = nullValue
    }
  }

  return (undoableConfig) => {
    const { redoType } = undoableConfig

    return (state, action) => {
      const newState = { ...state }

      if (action.type === redoType) {
        removeFields(newState.future[0])
      } else {
        removeFields(state.past[state.length - 1])
      }

      return newState
    }
  }
}

// This will be put on hold for now...
// eslint-disable-next-line no-unused-vars
const sideEffects = (onUndo = {}, onRedo = {}) => {
  return (undoableConfig) => {
    const { undoType, redoType } = undoableConfig

    const watchedTypes = Object.keys({ ...onUndo, ...onRedo })

    // sideEffects() must have its own latestUnfiltered because when syncFilter = true
    let lastPresent = {}

    return (state, action) => {
      const newState = { ...state }
      if (lastPresent !== newState.present) {
        let actions = [...newState.present.actions]

        if (watchedTypes.indexOf(action.type) > -1) {
          if (newState._latestUnfiltered !== newState.present) {
            actions = [action]
          } else {
            actions.push(action)
          }
        }

        lastPresent = newState.present = { ...newState.present, actions }
      }

      if (action.type === undoType) {
        const oldActions = [...newState.future[0].actions].reverse()
        for (const undone of oldActions) {
          onUndo[undone.type](newState, undone)
        }
      } else if (action.type === redoType) {
        const oldActions = newState.past[newState.past.length - 1].actions
        for (const redone of oldActions) {
          onUndo[redone.type](newState, redone)
        }
      }

      return newState
    }
  }
}
