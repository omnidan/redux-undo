let { expect } = require('chai')
let { default: undoable, ActionCreators } = require('../src/index')

describe('Undoable', () => {
  let mockUndoableReducer
  let mockInitialState
  let incrementedState

  before('setup mock reducers and states', () => {
    let countInitialState = 0
    let countReducer = (state = countInitialState, action = {}) => {
      switch (action.type) {
        case 'INCREMENT':
          return state + 1
        case 'DECREMENT':
          return state - 1
        default:
          return state
      }
    }
    let undoConfig = {
      limit: 100,
      initTypes: 'RE-INITIALIZE',
      initialHistory: {
        past: [0, 1, 2, 3],
        present: 4,
        future: [5, 6, 7]
      },
      filter: function (action) {
        switch (action.type) {
          case 'DECREMENT':
            return false
          default:
            return true
        }
      }
    }
    mockUndoableReducer = undoable(countReducer, undoConfig)
    mockInitialState = mockUndoableReducer(void 0, {})
    incrementedState = mockUndoableReducer(mockInitialState, { type: 'INCREMENT' })
  })

  it('should not record unwanted actions', () => {
    let decrementedState = mockUndoableReducer(mockInitialState, { type: 'DECREMENT' })

    expect(decrementedState.past).to.deep.equal(mockInitialState.past)
    expect(decrementedState.future).to.deep.equal(mockInitialState.future)
  })
  it('should reset upon init actions', () => {
    let doubleIncrementedState = mockUndoableReducer(incrementedState, { type: 'INCREMENT' })
    let reInitializedState = mockUndoableReducer(doubleIncrementedState, { type: 'RE-INITIALIZE' })

    expect(reInitializedState.past.length).to.equal(0)
    expect(reInitializedState.future.length).to.equal(0)
  })

  describe('Undo', () => {
    let undoState
    before('perform an undo action', () => {
      undoState = mockUndoableReducer(incrementedState, ActionCreators.undo())
    })
    it('should change present state back by one action', () => {
      expect(undoState.present).to.equal(mockInitialState.present)
    })
    it('should change present state to last element of \'past\'', () => {
      expect(undoState.present).to.equal(incrementedState.past[incrementedState.past.length - 1])
    })
    it('should add a new element to \'future\' from last state', () => {
      expect(undoState.future[0]).to.equal(incrementedState.present)
    })
    it('should decrease length of \'past\' by one', () => {
      expect(undoState.past.length).to.equal(incrementedState.past.length - 1)
    })
    it('should increase length of \'future\' by one', () => {
      expect(undoState.future.length).to.equal(incrementedState.future.length + 1)
    })
    it('should do nothing if \'past\' is empty', () => {
      let undoInitialState = mockUndoableReducer(mockInitialState, ActionCreators.undo())
      if (!mockInitialState.past.length) {
        expect(undoInitialState.present).to.deep.equal(mockInitialState.present)
      }
    })
  })
  describe('Redo', () => {
    let undoState
    let redoState
    before('perform an undo action then a redo action', () => {
      undoState = mockUndoableReducer(incrementedState, ActionCreators.undo())
      redoState = mockUndoableReducer(undoState, ActionCreators.redo())
    })
    it('should change present state to equal state before undo', () => {
      expect(redoState.present).to.equal(incrementedState.present)
    })
    it('should change present state to first element of \'future\'', () => {
      expect(redoState.present).to.equal(undoState.future[0])
    })
    it('should add a new element to \'past\' from last state', () => {
      expect(redoState.past[redoState.past.length - 1]).to.equal(undoState.present)
    })
    it('should decrease length of \'future\' by one', () => {
      expect(redoState.future.length).to.equal(undoState.future.length - 1)
    })
    it('should increase length of \'past\' by one', () => {
      expect(redoState.past.length).to.equal(undoState.past.length + 1)
    })
    it('should do nothing if \'future\' is empty', () => {
      let secondRedoState = mockUndoableReducer(redoState, ActionCreators.redo())
      if (!redoState.future.length) {
        expect(secondRedoState.present).to.deep.equal(redoState.present)
      }
    })
  })
})
