const { expect } = require('chai')
const { default: undoable, ActionCreators, excludeAction } = require('../src/index')
const Redux = require('redux')

const excludedActionsOne = ['DECREMENT']
const testConfigOne = {
  limit: 100,
  initTypes: 'RE-INITIALIZE',
  initialHistory: {
    past: [0, 1, 2, 3],
    present: 4,
    future: [5, 6, 7]
  },
  FOR_TEST_ONLY_excludedActions: excludedActionsOne,
  filter: excludeAction(excludedActionsOne)
}

const testConfigTwo = {
  limit: 200,
  initialState: 100
}

const testConfigThree = {
  limit: 1024,
  initTypes: 'RE-INITIALIZE',
  initialState: -1,
  initialHistory: {
    past: [123],
    present: 5,
    future: [-1, -2, -3]
  }
}
const testConfigFour = {
  limit: -1,
  initTypes: [],
  initialState: null,
  initialHistory: {
    past: [5, {}, 3, null, 1],
    present: Math.pow(2, 32),
    future: []
  }
}

runTestWithConfig({}, 'Default config')
runTestWithConfig(testConfigOne, 'Initial History and Filter (Exclude Actions)')
runTestWithConfig(testConfigTwo, 'Initial State equals 100')
runTestWithConfig(testConfigThree, 'Initial State and Initial History')
runTestWithConfig(testConfigFour, 'Erroneous configuration')

// Test undoable reducers as a function of a configuration object
// `label` describes the nature of the configuration object used to run a test
function runTestWithConfig (testConfig, label) {
  describe('Undoable: ' + label, () => {
    testConfig.initTypes = (Array.isArray(testConfig.initTypes) || testConfig.initTypes === undefined) ? testConfig.initTypes : [testConfig.initTypes]
    let mockUndoableReducer
    let mockInitialState
    let incrementedState
    let doubleIncrementedState
    let countReducer

    before('setup mock reducers and states', () => {
      let countInitialState = 0
      countReducer = (state = countInitialState, action = {}) => {
        switch (action.type) {
          case 'INCREMENT':
            return state + 1
          case 'DECREMENT':
            return state - 1
          default:
            return state
        }
      }
      mockUndoableReducer = undoable(countReducer, testConfig)
      mockInitialState = mockUndoableReducer(undefined, {})
      incrementedState = mockUndoableReducer(mockInitialState, { type: 'INCREMENT' })
      doubleIncrementedState = mockUndoableReducer(incrementedState, { type: 'INCREMENT' })
      console.info('  Beginning Test! Good luck!')
      console.info('    mockInitialState:', mockInitialState)
      console.info('    incrementedState:', incrementedState)
      console.info('    doubleIncrementedState:', doubleIncrementedState)
      console.info('')
    })

    it('should be initialized with the value of `initialHistory`', () => {
      if (testConfig.initialHistory) {
        expect(mockInitialState).to.deep.equal(testConfig.initialHistory)
      }
    })
    it('should be initialized with the value of `initialState` if there is no `initialHistory', () => {
      if (!testConfig.initialHistory && testConfig.initialState !== undefined) {
        expect(mockInitialState.present).to.equal(testConfig.initialState)
      }
    })
    it('should be initialized with the value of the default `initialState` of the reducer if there is no `initialState` or `initialHistory', () => {
      if (!testConfig.initialHistory && testConfig.initialState === undefined) {
        expect(mockInitialState.present).to.equal(countReducer())
      }
    })
    it('should not record unwanted actions', () => {
      if (testConfig.FOR_TEST_ONLY_excludedActions && testConfig.FOR_TEST_ONLY_excludedActions[0]) {
        let decrementedState = mockUndoableReducer(mockInitialState, { type: testConfig.FOR_TEST_ONLY_excludedActions[0] })

        expect(decrementedState.past).to.deep.equal(mockInitialState.past)
        expect(decrementedState.future).to.deep.equal(mockInitialState.future)
      }
    })
    it('should reset upon init actions', () => {
      let reInitializedState
      if (testConfig.initTypes) {
        if (testConfig.initTypes.length) {
          reInitializedState = mockUndoableReducer(incrementedState, { type: testConfig.initTypes[0] })
        } else {
          // No init actions exist
          return
        }
      } else {
        reInitializedState = mockUndoableReducer(incrementedState, { type: '@@redux-undo/INIT' })
      }

      if (testConfig.initialHistory) {
        expect(reInitializedState.past.length).to.equal(testConfig.initialHistory.past.length)
        expect(reInitializedState.future.length).to.equal(testConfig.initialHistory.future.length)
      } else {
        expect(reInitializedState.past.length).to.equal(0)
        expect(reInitializedState.future.length).to.equal(0)
      }
    })

    describe('Undo', () => {
      let undoState
      before('perform an undo action', () => {
        undoState = mockUndoableReducer(incrementedState, ActionCreators.undo())
      })
      it('should change present state back by one action', () => {
        if (testConfig.limit >= 0) {
          expect(undoState.present).to.equal(mockInitialState.present)
        }
      })
      it('should change present state to last element of \'past\'', () => {
        if (testConfig.limit >= 0) {
          expect(undoState.present).to.equal(incrementedState.past[incrementedState.past.length - 1])
        }
      })
      it('should add a new element to \'future\' from last state', () => {
        if (testConfig.limit >= 0) {
          expect(undoState.future[0]).to.equal(incrementedState.present)
        }
      })
      it('should decrease length of \'past\' by one', () => {
        if (testConfig.limit >= 0) {
          expect(undoState.past.length).to.equal(incrementedState.past.length - 1)
        }
      })
      it('should increase length of \'future\' by one', () => {
        if (testConfig.limit >= 0) {
          expect(undoState.future.length).to.equal(incrementedState.future.length + 1)
        }
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
        if (testConfig.limit >= 0) {
          expect(redoState.present).to.equal(undoState.future[0])
        }
      })
      it('should add a new element to \'past\' from last state', () => {
        if (testConfig.limit >= 0) {
          expect(redoState.past[redoState.past.length - 1]).to.equal(undoState.present)
        }
      })
      it('should decrease length of \'future\' by one', () => {
        if (testConfig.limit >= 0) {
          expect(redoState.future.length).to.equal(undoState.future.length - 1)
        }
      })
      it('should increase length of \'past\' by one', () => {
        if (testConfig.limit >= 0) {
          expect(redoState.past.length).to.equal(undoState.past.length + 1)
        }
      })
      it('should do nothing if \'future\' is empty', () => {
        let secondRedoState = mockUndoableReducer(redoState, ActionCreators.redo())
        if (!redoState.future.length) {
          expect(secondRedoState.present).to.deep.equal(redoState.present)
        }
      })
    })
    describe('JumpToPast', () => {
      const jumpToPastIndex = 0
      let jumpToPastState
      before('perform a jumpToPast action', () => {
        jumpToPastState = mockUndoableReducer(incrementedState, ActionCreators.jumpToPast(jumpToPastIndex))
      })
      it('should change present to a given value from past', () => {
        const pastState = incrementedState.past[jumpToPastIndex]
        if (pastState !== undefined) {
          expect(jumpToPastState.present).to.equal(pastState)
        }
      })
      it('should do nothing if past index is out of bounds', () => {
        let jumpToOutOfBounds = mockUndoableReducer(incrementedState, ActionCreators.jumpToPast(-1))
        expect(jumpToOutOfBounds).to.deep.equal(incrementedState)
      })
      it('should increase the length of future if successful', () => {
        if (incrementedState.past.length > jumpToPastIndex) {
          expect(jumpToPastState.future.length).to.be.above(incrementedState.future.length)
        }
      })
      it('should decrease the length of past if successful', () => {
        if (incrementedState.past.length > jumpToPastIndex) {
          expect(jumpToPastState.past.length).to.be.below(incrementedState.past.length)
        }
      })
    })
    describe('JumpToFuture', () => {
      const jumpToFutureIndex = 2
      let jumpToFutureState
      before('perform a jumpToFuture action', () => {
        jumpToFutureState = mockUndoableReducer(mockInitialState, ActionCreators.jumpToFuture(jumpToFutureIndex))
      })
      it('should change present to a given value from future', () => {
        const futureState = mockInitialState.future[jumpToFutureIndex]
        if (futureState !== undefined) {
          expect(jumpToFutureState.present).to.equal(futureState)
        }
      })
      it('should do nothing if future index is out of bounds', () => {
        let jumpToOutOfBounds = mockUndoableReducer(mockInitialState, ActionCreators.jumpToFuture(-1))
        expect(jumpToOutOfBounds).to.deep.equal(mockInitialState)
      })
      it('should increase the length of past if successful', () => {
        if (mockInitialState.future.length > jumpToFutureIndex) {
          expect(jumpToFutureState.past.length).to.be.above(mockInitialState.past.length)
        }
      })
      it('should decrease the length of future if successful', () => {
        if (mockInitialState.future.length > jumpToFutureIndex) {
          expect(jumpToFutureState.future.length).to.be.below(mockInitialState.future.length)
        }
      })
    })
    describe('Jump', () => {
      const jumpStepsToPast = -2
      const jumpStepsToFuture = 2
      let jumpToPastState
      let jumpToFutureState
      let doubleUndoState
      let doubleRedoState
      before('perform a jump action', () => {
        jumpToPastState = mockUndoableReducer(doubleIncrementedState, ActionCreators.jump(jumpStepsToPast))
        jumpToFutureState = mockUndoableReducer(mockInitialState, ActionCreators.jump(jumpStepsToFuture))
        doubleUndoState = mockUndoableReducer(doubleIncrementedState, ActionCreators.undo())
        doubleUndoState = mockUndoableReducer(doubleUndoState, ActionCreators.undo())
        doubleRedoState = mockUndoableReducer(mockInitialState, ActionCreators.redo())
        doubleRedoState = mockUndoableReducer(doubleRedoState, ActionCreators.redo())
      })
      it('-2 steps should result in same state as two times undo', () => {
        expect(doubleUndoState).to.deep.equal(jumpToPastState)
      })
      it('+2 steps should result in same state as two times redo', () => {
        expect(doubleRedoState).to.deep.equal(jumpToFutureState)
      })
      it('should do nothing if steps is 0', () => {
        let jumpToCurrentState = mockUndoableReducer(mockInitialState, ActionCreators.jump(0))
        expect(jumpToCurrentState).to.deep.equal(mockInitialState)
      })
      it('should do nothing if steps is out of bounds', () => {
        let jumpToOutOfBounds = mockUndoableReducer(mockInitialState, ActionCreators.jump(10))
        expect(jumpToOutOfBounds).to.deep.equal(mockInitialState)
        jumpToOutOfBounds = mockUndoableReducer(mockInitialState, ActionCreators.jump(-10))
        expect(jumpToOutOfBounds).to.deep.equal(mockInitialState)
      })
    })
    describe('Clear History', () => {
      let clearedState

      before('perform a clearHistory action', () => {
        clearedState = mockUndoableReducer(incrementedState, ActionCreators.clearHistory())
      })
      it('should clear future and past', () => {
        expect(clearedState.past.length).to.equal(0)
        expect(clearedState.future.length).to.equal(0)
      })
      it('should preserve the present value', () => {
        expect(clearedState.present).to.equal(incrementedState.present)
      })
    })
    describe('Relation to Redux', () => {
      it('should be able to create a store', () => {
        const store = Redux.createStore(mockUndoableReducer)
        if (testConfig.initialHistory) {
          expect(store.getState()).to.deep.equal(testConfig.initialHistory)
        } else if (testConfig.initialState !== undefined) {
          expect(store.getState().present).to.deep.equal(testConfig.initialState)
        } else {
          expect(store.getState()).to.deep.equal(mockUndoableReducer(undefined, {}))
        }
      })
      it('should accept the initialState from `createStore`', () => {
        const rehydratingState = {
          past: ['a', 'b', 'c'],
          present: 'd',
          future: ['e', 'f']
        }
        const store = Redux.createStore(mockUndoableReducer, rehydratingState)
        expect(store.getState()).to.deep.equal(rehydratingState)
      })
    })
  })
}
