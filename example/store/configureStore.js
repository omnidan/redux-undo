import { createStore } from 'redux'
import rootReducer from '../reducers/index'

import undoable from 'redux-undo'

const undoableReducer = undoable(rootReducer);

export default function configureStore(initialState) {
  const store = createStore(undoableReducer, initialState)

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('../reducers/index', () => {
      const nextRootReducer = require('../reducers/index').default
      store.replaceReducer(nextRootReducer)
    })
  }

  return store
}
