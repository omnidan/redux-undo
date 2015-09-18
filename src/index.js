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

// seek: jump to a certain point in history (restores state)
function seek(state, rawIndex) {
  debug('seek', state, rawIndex);
  const history = state.history;
  if (history.length < 2) return false;

  let index = rawIndex;
  if (index < 0) {
    index = 0;
  }

  const maxIndex = history.length - 1;
  if (index > maxIndex) {
    index = maxIndex;
  }

  return {
    ...state,
    currentState: history[index],
    index,
    history,
  };
}
// /seek

// undo: go back to the previous point in history
function undo(state, steps) {
  return seek(state, state.index - (steps || 1));
}
// /undo

// redo: go to the next point in history
function redo(state, steps) {
  return seek(state, state.index + (steps || 1));
}
// /redo

// redux-undo higher order reducer
export default function undoable(reducer, rawConfig = {}) {
  __DEBUG__ = rawConfig.debug;

  const config = {
    history: rawConfig.initialHistory || [],
    index: rawConfig.initialIndex || -1,
    limit: rawConfig.limit,
    filter: rawConfig.filter || () => true,
    undoType: rawConfig.undoType || ActionTypes.UNDO,
    redoType: rawConfig.redoType || ActionTypes.REDO,
  };

  return (state, action) => {
    debug('enhanced reducer called:', state, action);
    let res;
    switch (action.type) {
    case config.undoType:
      res = undo(state, action.steps);
      return res ? res : state;

    case config.redoType:
      res = redo(state, action.steps);
      return res ? res : state;

    default:
      res = reducer(state && state.currentState, action);

      if (config.filter && typeof config.filter === 'function') {
        if (!config.filter(action)) {
          debug('filter prevented action, not storing it');
          return {
            ...state,
            currentState: res,
          };
        }
      }

      const currentIndex = (state && state.index !== undefined) ? state.index : config.index;
      const history = (state && state.history !== undefined) ? state.history : config.history;
      const historyOverflow = config.limit && history.length >= config.limit;

      return {
        ...state,
        currentState: res,
        index: currentIndex + 1, // update index
        history: [
          ...history.slice(historyOverflow ? 1 : 0, currentIndex + 1),
          res, // insert after current index
          ...history.slice(currentIndex + 1),
        ],
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
