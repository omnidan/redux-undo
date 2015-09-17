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

// addState: add a new state to the history
function addState(store, state) {
  debug('before', store);
  store._history.splice(store._index + 1, 0, state); // insert after current index
  store._index++; // update index
  if (store._limit && store._history.length > store._limit) {
    debug('store full, slicing');
    store._history = store._history.slice(1, store._limit + 1);
    store._index--;
  }
  debug('after', store);
}
// /addState

// seek: jump to a certain point in history (restores state)
function seek(store, rawIndex) {
  debug('seek', store, rawIndex);
  const history = store._history;
  if (history.length < 2) return false;

  let index = rawIndex;
  if (index < 0) {
    index = 0;
  }

  const maxIndex = history.length - 1;
  if (index > maxIndex) {
    index = maxIndex;
  }

  store._index = index;
  return history[index];
}
// /seek

// undo: go back to the previous point in history
function undo(store, steps) {
  return seek(store, store._index - (steps || 1));
}
// /undo

// redo: go to the next point in history
function redo(store, steps) {
  return seek(store, store._index + (steps || 1));
}
// /redo

// liftReducer: lift app state reducer into reduxUndo state reducer
function liftReducer(store, reducer, initialState) {
  // liftedReducer: manages how the reduxUndo actions modify the reduxUndo state
  return function liftedReducer(liftedState = initialState, liftedAction) {
    if (liftedAction._recomputed) {
      debug('action recomputed (probably by devtools), not storing it');
      return reducer(liftedState, liftedAction);
    }

    debug('lift', liftedState, liftedAction);
    let res;
    switch (liftedAction.type) {
    case ActionTypes.UNDO:
      res = undo(store, liftedAction.steps);
      return res ? res : liftedState;

    case ActionTypes.REDO:
      res = redo(store, liftedAction.steps);
      return res ? res : liftedState;

    default:
      res = reducer(liftedState, liftedAction);
      if (store._filter && typeof store._filter === 'function') {
        if (!store._filter(liftedAction)) {
          debug('filter prevented action, not storing it');
          return res;
        }
      }
      addState(store, res); // add previous state to history
      return res;
    }
  };
  // /liftedReducer
}
// /liftReducer

// redux-undo store enhancer
export default function reduxUndo(config = {}, store) {
  __DEBUG__ = config.debug;

  const liftedStore = {
    _history: config.initialHistory || [],
    _index: config.initialIndex || -1,
    _limit: config.limit,
    _filter: config.filter || () => true,
    ...store,
  };

  return next => (reducer, initialState) => {
    const liftedReducer = liftReducer(liftedStore, reducer, initialState);
    return next(liftedReducer);
  };
}
// /redux-undo

// parseActions
export function parseActions(rawActions = []) {
  return typeof rawActions === 'string' ? [rawActions] : rawActions;
}
// /parseActions

// ifAction helper
export function ifAction(rawActions) {
  const actions = parseActions(rawActions);
  return (action) => action.type === '@@redux/INIT' || actions.indexOf(action.type) > -1;
}
// /ifAction

// excludeAction helper
export function excludeAction(rawActions = []) {
  const actions = parseActions(rawActions);
  return (action) => action.type === '@@redux/INIT' || !(actions.indexOf(action.type) > -1);
}
// /excludeAction
