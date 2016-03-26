const IGNORE_TIME = 250

let filter = true
export default function undoFilter (action, currState, prevState) {
  // other filters
  filter = debounceActionsFilter(action)
  return filter
}

// ignore rapid action types that are the same type
let ignoreRapid = false
let prevActionType
function debounceActionsFilter (action) {
  if (action.type !== prevActionType) {
    ignoreRapid = false
    prevActionType = action.type
    return true
  }
  if (ignoreRapid) {
    return false
  }
  ignoreRapid = true
  setTimeout(() => {
    ignoreRapid = false
  }, IGNORE_TIME)
  return true
}
