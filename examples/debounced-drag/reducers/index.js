import { combineReducers } from 'redux'
import draggable from './draggable.js'
import undoable from 'redux-undo'
import undoFilter from '../util/undoFilter.js'
//

// export default combineReducers({
//   draggable
// })

// export default combineReducers({
//   draggable: undoable(draggable)
// })

export default combineReducers({
  draggable: undoable(draggable, {
    filter: undoFilter
  })
})
