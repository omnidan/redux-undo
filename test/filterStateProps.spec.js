import { expect } from 'chai'
import { createStore } from 'redux'
import undoable, { ActionTypes } from '../src/index'

describe('Undoable with filterStateProps', () => {
  let initialStoreState = {
    position: { // will be excluded from history
      x: 0,
      y: 0
    },
    counter: 0
  }

  const countReducer = (state = initialStoreState, action = {}) => {
    switch (action.type) {
      case 'UPDATE_COUNTER':
        return {
          ...state,
          counter: action.payload
        }
      case 'UPDATE_POSITION':
        return {
          ...state,
          position: action.payload
        }
      default:
        return state
    }
  }

  describe('save without filterStateProps', () => {
    it('check initial state', () => {
      let mockUndoableReducer = undoable(countReducer)
      let store = createStore(mockUndoableReducer, initialStoreState)
      let mockInitialState = mockUndoableReducer(undefined, {})

      expect(store.getState()).to.deep.equal(mockInitialState, 'mockInitialState should be the same as our store\'s state')
    })

    it('update counter and check result', () => {
      let mockUndoableReducer = undoable(countReducer)
      let store = createStore(mockUndoableReducer, initialStoreState)

      store.dispatch({ type: 'UPDATE_COUNTER', payload: 10 })

      let expectedResult = { ...initialStoreState, counter: 10 }
      expect(store.getState().present).to.deep.equal(expectedResult)
    })

    it('update position and check result', () => {
      let mockUndoableReducer = undoable(countReducer)
      let store = createStore(mockUndoableReducer, initialStoreState)

      store.dispatch({ type: 'UPDATE_POSITION', payload: { x: 5, y: 5 } })

      let expectedResult = { ...initialStoreState, position: { x: 5, y: 5 } }
      expect(store.getState().present).to.deep.equal(expectedResult)
    })

    it('UNDO counter update', () => {
      let mockUndoableReducer = undoable(countReducer)
      let store = createStore(mockUndoableReducer, initialStoreState)

      store.dispatch({ type: 'UPDATE_COUNTER', payload: 10 })
      store.dispatch({ type: 'UPDATE_COUNTER', payload: 15 })
      store.dispatch({ type: ActionTypes.UNDO })

      let expectedResult = { ...initialStoreState, counter: 10 }
      expect(store.getState().present).to.deep.equal(expectedResult)
    })

    it('REDO counter update', () => {
      let mockUndoableReducer = undoable(countReducer)
      let store = createStore(mockUndoableReducer, initialStoreState)

      store.dispatch({ type: 'UPDATE_COUNTER', payload: 10 })
      store.dispatch({ type: 'UPDATE_COUNTER', payload: 15 })
      store.dispatch({ type: ActionTypes.UNDO })
      store.dispatch({ type: ActionTypes.REDO })

      let expectedResult = { ...initialStoreState, counter: 15 }
      expect(store.getState().present).to.deep.equal(expectedResult)
    })

    it('UNDO position update', () => {
      let mockUndoableReducer = undoable(countReducer)
      let store = createStore(mockUndoableReducer, initialStoreState)

      store.dispatch({ type: 'UPDATE_POSITION', payload: { x: 5, y: 5 } })
      store.dispatch({ type: 'UPDATE_POSITION', payload: { x: 10, y: 10 } })
      store.dispatch({ type: ActionTypes.UNDO })

      let expectedResult = { ...initialStoreState, position: { x: 5, y: 5 } }
      expect(store.getState().present).to.deep.equal(expectedResult)
    })

    it('REDO position update', () => {
      let mockUndoableReducer = undoable(countReducer)
      let store = createStore(mockUndoableReducer, initialStoreState)

      store.dispatch({ type: 'UPDATE_POSITION', payload: { x: 5, y: 5 } })
      store.dispatch({ type: 'UPDATE_POSITION', payload: { x: 10, y: 10 } })
      store.dispatch({ type: ActionTypes.UNDO })
      store.dispatch({ type: ActionTypes.REDO })

      let expectedResult = { ...initialStoreState, position: { x: 10, y: 10 } }
      expect(store.getState().present).to.deep.equal(expectedResult)
    })
  })

  describe('save with filterStateProps', () => {
    it('check initial state', () => {
      let mockUndoableReducer = undoable(countReducer, {
        filterStateProps (state) {
          return {
            ...state,
            position: initialStoreState.position
          }
        }
      })
      let store = createStore(mockUndoableReducer, initialStoreState)
      let mockInitialState = mockUndoableReducer(undefined, {})

      expect(store.getState()).to.deep.equal(mockInitialState, 'mockInitialState should be the same as our store\'s state')
    })

    it('update counter and check result', () => {
      let mockUndoableReducer = undoable(countReducer, {
        filterStateProps (state) {
          return {
            ...state,
            position: initialStoreState.position
          }
        }
      })
      let store = createStore(mockUndoableReducer, initialStoreState)

      store.dispatch({ type: 'UPDATE_COUNTER', payload: 10 })

      let expectedResult = { ...initialStoreState, counter: 10 }
      expect(store.getState().present).to.deep.equal(expectedResult)
    })

    it('update position and check result', () => {
      let mockUndoableReducer = undoable(countReducer, {
        filterStateProps (state) {
          return {
            ...state,
            position: initialStoreState.position
          }
        }
      })
      let store = createStore(mockUndoableReducer, initialStoreState)

      store.dispatch({ type: 'UPDATE_POSITION', payload: { x: 5, y: 5 } })

      let expectedResult = { ...initialStoreState, position: { x: 5, y: 5 } }
      expect(store.getState().present).to.deep.equal(expectedResult)
    })

    it('UNDO counter update', () => {
      let mockUndoableReducer = undoable(countReducer, {
        filterStateProps (state) {
          return {
            ...state,
            position: initialStoreState.position
          }
        }
      })
      let store = createStore(mockUndoableReducer, initialStoreState)

      store.dispatch({ type: 'UPDATE_COUNTER', payload: 10 })
      store.dispatch({ type: 'UPDATE_COUNTER', payload: 15 })
      store.dispatch({ type: ActionTypes.UNDO })

      let expectedResult = { ...initialStoreState, counter: 10 }
      expect(store.getState().present).to.deep.equal(expectedResult)
    })

    it('REDO counter update', () => {
      let mockUndoableReducer = undoable(countReducer, {
        filterStateProps (state) {
          return {
            ...state,
            position: initialStoreState.position
          }
        }
      })
      let store = createStore(mockUndoableReducer, initialStoreState)

      store.dispatch({ type: 'UPDATE_COUNTER', payload: 10 })
      store.dispatch({ type: 'UPDATE_COUNTER', payload: 15 })
      store.dispatch({ type: ActionTypes.UNDO })
      store.dispatch({ type: ActionTypes.REDO })

      let expectedResult = { ...initialStoreState, counter: 15 }
      expect(store.getState().present).to.deep.equal(expectedResult)
    })

    it('UNDO position update', () => {
      let mockUndoableReducer = undoable(countReducer, {
        filterStateProps (state) {
          return {
            ...state,
            position: initialStoreState.position
          }
        }
      })
      let store = createStore(mockUndoableReducer, initialStoreState)

      store.dispatch({ type: 'UPDATE_POSITION', payload: { x: 5, y: 5 } })
      store.dispatch({ type: 'UPDATE_POSITION', payload: { x: 10, y: 10 } })
      store.dispatch({ type: ActionTypes.UNDO })

      let expectedResult = initialStoreState
      expect(store.getState().present).to.deep.equal(expectedResult)
    })

    it('REDO position update', () => {
      let mockUndoableReducer = undoable(countReducer, {
        filterStateProps (state) {
          return {
            ...state,
            position: initialStoreState.position
          }
        }
      })
      let store = createStore(mockUndoableReducer, initialStoreState)

      store.dispatch({ type: 'UPDATE_POSITION', payload: { x: 5, y: 5 } })
      store.dispatch({ type: 'UPDATE_POSITION', payload: { x: 10, y: 10 } })
      store.dispatch({ type: ActionTypes.UNDO })
      store.dispatch({ type: ActionTypes.REDO })

      let expectedResult = { ...initialStoreState, position: { x: 10, y: 10 } }
      expect(store.getState().present).to.deep.equal(expectedResult)
    })
  })
})
