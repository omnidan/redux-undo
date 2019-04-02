import { expect } from 'chai'
import { combineFilters } from '../src/index'

runTestCombineFilters()

function runTestCombineFilters () {
  describe('Combine Filters', () => {
    const sample = {
      action: { type: 'TEST' },
      currentState: 1,
      previousHistory: [0, -1]
    }

    function checkArguments (action, currentState, previousHistory) {
      return (
        action === sample.action &&
        currentState === sample.currentState &&
        previousHistory === sample.previousHistory
      )
    }

    function checkArgumentsNot (action, currentState, previousHistory) {
      return (
        action !== sample.action ||
        currentState !== sample.currentState ||
        previousHistory !== sample.previousHistory
      )
    }

    function checkStateNot1 (action, state) { return state !== 1 }
    function checkStateNot2 (action, state) { return state !== 2 }

    function checkIfCalled (action) {
      action.hasBeenCalled = true
      return true
    }

    it('should pass its arguments while calling a filter', () => {
      expect(combineFilters(checkArguments, checkArguments)(sample.action, sample.currentState, sample.previousHistory))
        .to.equal(true)
      expect(combineFilters(checkArgumentsNot, checkArguments)(sample.action, sample.currentState, sample.previousHistory))
        .to.equal(false)
    })

    it('should return false if any filter does', () => {
      expect(combineFilters(checkStateNot1, checkStateNot2)(null, 1)).to.equal(false)
      expect(combineFilters(checkStateNot1, checkStateNot2)(null, 2)).to.equal(false)
    })

    it('should return true if every filter does', () => {
      expect(combineFilters(checkStateNot1, checkStateNot2)(null, 3)).to.equal(true)
    })

    it('should not call remaining filters if one already returned false', () => {
      let act = { hasBeenCalled: false }
      const combined = combineFilters(checkStateNot1, checkStateNot2, checkIfCalled)

      combined(act, 2)
      expect(act.hasBeenCalled).to.equal(false)
      combined(act, 3)
      expect(act.hasBeenCalled).to.equal(true)
    })
  })
}
