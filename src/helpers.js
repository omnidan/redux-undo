// parseActions helper: takes a string (or array)
//                      and makes it an array if it isn't yet
export function parseActions (rawActions, defaultValue = []) {
  if (Array.isArray(rawActions)) {
    return rawActions
  } else if (typeof rawActions === 'string') {
    return [rawActions]
  }
  return defaultValue
}

// isHistory helper: check for a valid history object
export function isHistory (history) {
  return typeof history.present !== 'undefined' &&
    typeof history.future !== 'undefined' &&
    typeof history.past !== 'undefined' &&
    Array.isArray(history.future) &&
    Array.isArray(history.past)
}

// includeAction helper: whitelist actions to be added to the history
export function includeAction (rawActions) {
  const actions = parseActions(rawActions)
  return (action) => actions.indexOf(action.type) >= 0
}

// excludeAction helper: blacklist actions from being added to the history
export function excludeAction (rawActions) {
  const actions = parseActions(rawActions)
  return (action) => actions.indexOf(action.type) < 0
}

// combineFilters helper: combine multiple filters to one
export function combineFilters (...filters) {
  return filters.reduce((prev, curr) =>
    (action, currentState, previousHistory) =>
      prev(action, currentState, previousHistory) &&
      curr(action, currentState, previousHistory)
  , () => true)
}

// combineExtensions helper: include multiple field extensions at once
export function combineExtensions (...extensions) {
  return (config) => {
    const instantiated = extensions.map((ext) => ext(config))
    return (state, action) => {
      for (const extension of instantiated) {
        state = extension(state, action)
      }
      return state
    }
  }
}

export function groupByActionTypes (rawActions) {
  const actions = parseActions(rawActions)
  return (action) => actions.indexOf(action.type) >= 0 ? action.type : null
}

export function newHistory (past, present, future, group = null) {
  return {
    past,
    present,
    future,
    group,
    _latestUnfiltered: present,
    index: past.length,
    limit: past.length + future.length + 1
  }
}
