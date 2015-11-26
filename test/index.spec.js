let { expect } = require('chai');
let { default: undoable, ActionCreators } = require('../src/index');

describe('Undoable', () => {
  let mockUndoableReducer;
  let mockInitialState;
  let incrementedState;

  before('setup mock reducers and states', () => {
      let countInitialState = 0;
      let countReducer = (state = countInitialState, action = {}) => {
        switch (action.type) {
          case 'INCREMENT':
            return state + 1;
          case 'DECREMENT':
            return state - 1;
          default:
            return state;
        }
      };
      let undoConfig = {
        limit: 100,
        initTypes: 'RE-INITIALIZE',
        filter: function(action) {
          switch (action.type) {
            case 'DECREMENT':
              return false;
            default:
              return true;
          }
        }
      }
      mockUndoableReducer = undoable(countReducer, undoConfig);
      mockInitialState = mockUndoableReducer(void 0, {});
      incrementedState = mockUndoableReducer(mockInitialState, { type: 'INCREMENT' }); 
  });

  it('should wrap its old history', () => {
    let doubleIncrementedState = mockUndoableReducer(incrementedState, { type: 'INCREMENT' }); 

    expect(incrementedState.history.history).to.deep.equal(mockInitialState.history);
    expect(doubleIncrementedState.history.history).to.deep.equal(incrementedState.history);
  });

  it('should not record unwanted actions', () => {
    let decrementedState = mockUndoableReducer(mockInitialState, { type: 'DECREMENT' }); 

    expect(decrementedState.history.past).to.deep.equal(mockInitialState.history.past);
    expect(decrementedState.history.future).to.deep.equal(mockInitialState.history.future);
  });
  it('should reset upon init actions', () => {
    let doubleIncrementedState = mockUndoableReducer(incrementedState, { type: 'INCREMENT' }); 
    let reInitializedState = mockUndoableReducer(doubleIncrementedState, { type: 'RE-INITIALIZE' }); 

    expect(reInitializedState.past.length).to.equal(0);
    expect(reInitializedState.future.length).to.equal(0);
  });
  
  describe('Undo', () => {
    let undoState;
    before('perform an undo action', () => {
      undoState = mockUndoableReducer(incrementedState, ActionCreators.undo());
    });
    it('should change present state back by one action', () => {
      expect(undoState.present).to.equal(mockInitialState.present);
    });
    it('should change present state to first element of \'past\'', () => {
      expect(undoState.present).to.equal(incrementedState.past[0]);
    });
    it('should add a new element to \'future\' from last state', () => {
      expect(undoState.future[0]).to.equal(incrementedState.present);
    });
    it('should decrease length of \'past\' by one', () => {
      expect(undoState.past.length).to.equal(incrementedState.past.length - 1);
    });
    it('should increase length of \'future\' by one', () => {
      expect(undoState.future.length).to.equal(incrementedState.future.length + 1);
    });
    it('should do nothing if \'past\' is empty', () => {
      let undoInitialState = mockUndoableReducer(mockInitialState, ActionCreators.undo());

      expect(mockInitialState.past.length).to.equal(0);
      expect(undoInitialState.history).to.deep.equal(mockInitialState);
      expect(undoInitialState.present).to.deep.equal(mockInitialState.present);
    });

  });
  describe('Redo', () => {
    let undoState;
    let redoState;
    before('perform an undo action then a redo action', () => {
      undoState = mockUndoableReducer(incrementedState, ActionCreators.undo());
      redoState = mockUndoableReducer(undoState, ActionCreators.redo());
    });

    it('should change present state to equal state before undo', () => {
      expect(redoState.present).to.equal(incrementedState.present);
    });
    it('should change present state to first element of \'future\'', () => {
      expect(redoState.present).to.equal(undoState.future[0]);
    });
    it('should add a new element to \'past\' from last state', () => {
      expect(redoState.past[0]).to.equal(undoState.present);
    });
    it('should decrease length of \'future\' by one', () => {
      expect(redoState.future.length).to.equal(undoState.future.length - 1);
    });
    it('should increase length of \'past\' by one', () => {
      expect(redoState.past.length).to.equal(undoState.past.length + 1);
    });
    it('should do nothing if \'future\' is empty', () => {
      let secondRedoState = mockUndoableReducer(redoState, ActionCreators.redo());

      expect(redoState.future.length).to.equal(0);
      expect(secondRedoState.history).to.deep.equal(redoState);
      expect(secondRedoState.present).to.deep.equal(redoState.present);
    });
  });
});
