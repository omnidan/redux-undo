// debug output
let __DEBUG__;
function debug(...args) {
  if (__DEBUG__) console.log('%credux-undo', 'font-style: italic', ...args);
}
// /debug output

// action types
export const ActionTypes = {
  UNDO: '@@redux-undo/UNDO',
  REDO: '@@redux-undo/REDO',
};
// /action types

// action creators to change the state
export const ActionCreators = {
  undo(steps) {
    return { type: ActionTypes.UNDO, steps };
  },
  redo(steps) {
    return { type: ActionTypes.REDO, steps };
  },
};
// /action creators

// length: get length of history
function length(history) {
  const { past, future } = history;
  return past.length + 1 + future.length;
}
// /length

// insert: insert `state` into history, which means adding the current state
//         into `past`, setting the new `state` as `present` and erasing
//         the `future`.
function insert(history, state, limit) {
  debug('insert(', history, state, limit, ')');

  const { past, present } = history;
  const historyOverflow = limit && length(history) >= limit;

  if (present === undefined) {
    // init history
    return {
      past: [],
      present: state,
      future: [],
    };
  }

  return {
    past: [
      ...past.slice(historyOverflow ? 1 : 0),
      present,
    ],
    present: state,
    future: [],
  };
}
// /insert

// undo: go back to the previous point in history
function undo(history) {
  debug('undo(', history, ')');

  const { past, present, future } = history;

  if (past.length <= 0) return history;

  return {
    past: past.slice(0, past.length - 1), // remove last element from past
    present: past[past.length - 1], // set element as new present
    future: [
      present, // old present state is in the future now
      ...future,
    ],
  };
}
// /undo

// redo: go to the next point in history
function redo(history) {
  debug('redo(', history, ')');

  const { past, present, future } = history;

  if (future.length <= 0) return history;

  return {
    future: future.slice(1, future.length), // remove element from future
    present: future[0], // set element as new present
    past: [
      ...past,
      present, // old present state is in the past now
    ],
  };
}
// /redo

// updateState
function updateState(state, history) {
  return {
    ...state,
    history,
    present: history.present,
  };
}
// /updateState

// arrayToString
function arrayToString(array) {
  if (!array || array.length <= 0) return '_';
  return array.join(',');
}

// historyToString
function historyToString(history) {
  return arrayToString(history.past) +
    ' | ' + history.present +
    ' | ' + arrayToString(history.future);
}
// /historyToString

// redux-undo higher order reducer
export default function undoable(reducer, rawConfig = {}) {
  __DEBUG__ = rawConfig.debug;

  const config = {
    initialState: rawConfig.initialState,
    limit: rawConfig.limit,
    filter: rawConfig.filter || () => true,
    undoType: rawConfig.undoType || ActionTypes.UNDO,
    redoType: rawConfig.redoType || ActionTypes.REDO,
  };
  config.history = rawConfig.initialHistory || {
    past: [],
    present: config.initialState,
    future: [],
  };

  return (state, action) => {
    debug('enhanced reducer called:', state, action);
    let res;
    switch (action.type) {
    case config.undoType:
      res = undo(state.history, action.steps);
      debug('history (undo):', historyToString(state.history), '->', historyToString(res));
      return res ? updateState(state, res) : state;

    case config.redoType:
      res = redo(state.history, action.steps);
      debug('history (redo):', historyToString(state.history), '->', historyToString(res));
      return res ? updateState(state, res) : state;

    default:
      res = reducer(state && state.present, action);

      if (config.filter && typeof config.filter === 'function') {
        if (!config.filter(action, res, state && state.present)) {
          debug('filter prevented action, not storing it');
          return {
            ...state,
            present: res,
          };
        }
      }

      const history = (state && state.history !== undefined) ? state.history : config.history;
      const updatedHistory = insert(history, res, config.limit);
      debug('history (insert):', historyToString(history), '->', historyToString(updatedHistory));

      return {
        ...state,
        present: res,
        history: updatedHistory,
      };
    }
  };
}
// /redux-undo

// parseActions
export function parseActions(rawActions = []) {
  return typeof rawActions === 'string' ? [rawActions] : rawActions;
}
// /parseActions

// distinctState helper
export function distinctState() {
  return (action, currentState, previousState) => currentState === previousState;
}
// /distinctState

// ifAction helper
export function ifAction(rawActions) {
  const actions = parseActions(rawActions);
  return (action) => action.type === '@@redux/INIT' || action.type === '@@INIT'
    || actions.indexOf(action.type) > -1;
}
// /ifAction

// excludeAction helper
export function excludeAction(rawActions = []) {
  const actions = parseActions(rawActions);
  return (action) => action.type === '@@redux/INIT' || action.type === '@@INIT'
    || !(actions.indexOf(action.type) > -1);
}
// /excludeAction
