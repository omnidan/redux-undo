import { INCREMENT, DECREMENT } from './ActionTypes'
import { ActionCreators } from 'redux-undo';

export function increment () {
  return {
    type: INCREMENT
  }
}

export function decrement () {
  return {
    type: DECREMENT
  }
}

// Add undo / redo actions
export const undo = ActionCreators.undo
export const redo = ActionCreators.redo
