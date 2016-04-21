// parseActions helper
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

// distinctState helper
/* istanbul ignore next */
export function distinctState () {
  console.warn('distinctState is deprecated in beta4 and newer. The distinctState behavior is now default, which means only actions resulting in a new state are recorded. See https://github.com/omnidan/redux-undo#filtering-actions for more details.')
  return () => true
}

// includeAction helper
export function includeAction (rawActions) {
  const actions = parseActions(rawActions)
  return (action) => actions.indexOf(action.type) >= 0
}

// excludeAction helper
export function excludeAction (rawActions = []) {
  const actions = parseActions(rawActions)
  return (action) => actions.indexOf(action.type) < 0
}

// combineFilters helper
export function combineFilters (...filters) {
  return filters.reduce((prev, curr) =>
    (action, currentState, previousHistory) =>
      prev(action, currentState, previousHistory) &&
      curr(action, currentState, previousHistory)
  , () => true)
}
