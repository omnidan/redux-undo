import chai, { expect } from 'chai'
import spies from 'chai-spies'

import undoable, { flattenState, actionField, combineExtensions, ActionCreators } from '../src'

chai.use(spies)

describe('Field Extensions', () => {
  const consoleWarnSpy = chai.spy.sandbox()

  beforeEach(() => {
    consoleWarnSpy.on(console, 'warn', () => {})
  })

  afterEach(() => {
    consoleWarnSpy.restore(console, 'warn')
  })

  describe('undoable reducer integration', () => {
    it('should receive the same config from undoable wrapper', () => {
      const mockExtension = (config) => {
        expect(config.extension).to.equal(mockExtension)
        expect(config.undoType).to.equal('why not?')
      }
      undoable(() => {}, { extension: mockExtension, undoType: 'why not?' })
    })

    it('should not call extension when the state does not change', () => {
      const reducer = (state, action) => {
        switch (action.type) {
          case 'UPDATE_STATE':
            return { ...state }
          default:
            return state
        }
      }
      const spy = chai.spy((state) => state)
      const mockExtension = () => spy
      let state = {} // eslint-disable-line no-unused-vars

      const mockUndoable = undoable(reducer, { extension: mockExtension })
      state = mockUndoable(state, { type: undefined })

      state = mockUndoable(state, { type: 'UPDATE_STATE' })
      expect(spy).to.have.been.called.once

      state = mockUndoable(state, { type: 'DO_NOTHING' })
      expect(spy).to.have.been.called.once

      state = mockUndoable(state, { type: 'UPDATE_STATE' })
      expect(spy).to.have.been.called.twice
    })

    it('should call extension on regular action', () => {
      const spy = chai.spy((state) => state)
      const mockExtension = () => spy
      let state = {} // eslint-disable-line no-unused-vars

      const mockUndoable = undoable((x) => ({ ...x }), { extension: mockExtension })
      state = mockUndoable(state)
      expect(spy).to.not.have.been.called()

      state = mockUndoable(state, { type: 'regular action' })
      expect(spy).to.have.been.called()
    })

    it('should call extension on undo/redo action', () => {
      const spy = chai.spy((state) => state)
      const mockExtension = () => spy
      let state = {} // eslint-disable-line no-unused-vars

      const mockUndoable = undoable((x) => ({ ...x }), { extension: mockExtension })
      state = mockUndoable(state)
      expect(spy).to.not.have.been.called()

      state = mockUndoable(state, { type: 'regular action' })
      expect(spy).to.have.been.called.once
      state = mockUndoable(state, ActionCreators.undo())
      expect(spy).to.have.been.called.twice
    })

    it('should change state on dispatched action', () => {
      const spy = chai.spy((state, action) => {
        return { ...state, isRedo: action.type === 'redo' }
      })
      const mockExtension = () => spy
      let state = { dummyState: 'stuff' }
      const initialState = state

      const mockUndoable = undoable((x) => ({ ...x }), { extension: mockExtension, undoType: 'redo' })
      state = mockUndoable(state)
      expect(state.isRedo).to.not.exist

      state = mockUndoable(state, { type: 'regular action' })
      expect(state.past[0]).to.be.equal(initialState)
      expect(state.isRedo).to.be.false
      state = mockUndoable(state, { type: 'redo' })
      expect(state.isRedo).to.be.true
    })
  })

  describe('flattenState', () => {
    const reducer = (state, action) => {
      switch (action.type) {
        case 'PAYLOAD':
          return { ...state, ...action.payload }
        default:
          return state
      }
    }

    let flattenStateUndoable
    let mockInitialState

    beforeEach(() => {
      flattenStateUndoable = undoable(reducer, {
        extension: flattenState()
      })
      mockInitialState = flattenStateUndoable({})
    })

    it('should log a warning by default but allow disabling', () => {
      // reset it here because of the sibling beforeEach
      consoleWarnSpy.restore(console, 'warn')
      consoleWarnSpy.on(console, 'warn', () => {})

      undoable(() => {}, { extension: flattenState(), disableWarnings: 1 })
      expect(console.warn).to.not.be.called()

      undoable(() => {}, { extension: flattenState() })
      expect(console.warn).to.be.called()
    })

    it('should flatten present into the history state', () => {
      const payload = { data: 'stuff' }
      const state = flattenStateUndoable(mockInitialState, { type: 'PAYLOAD', payload })

      expect(state.data).to.equal('stuff')
      expect(state.present).to.deep.equal(payload)
    })

    it('should override user fields in favor of redux-undo fields', () => {
      const payload = { present: 'overridden', past: 'this too' }
      const state = flattenStateUndoable(mockInitialState, { type: 'PAYLOAD', payload })

      expect(state.present).to.deep.equal(payload)
      expect(state.present.present).to.equal('overridden')

      expect(state.past).to.deep.equal([mockInitialState.present])
    })
  })

  describe('actionField', () => {
    const reducer = (state, action) => {
      switch (action.type) {
        case 'PAYLOAD':
          return { ...state, ...action.payload }
        default:
          // We create copy here to trick undoable into thinking it's a new state
          return { ...state }
      }
    }

    it('should log a warning by default but allow disabling', () => {
      undoable(() => {}, { extension: actionField(), disableWarnings: true })
      expect(console.warn).to.not.be.called()

      undoable(() => {}, { extension: actionField() })
      expect(console.warn).to.be.called()
    })

    it('should log a warning by default but allow disabling (`inline` insert method)', () => {
      undoable(() => {}, { extension: actionField({ insertMethod: 'inline' }), disableWarnings: true })
      expect(console.warn).to.not.be.called()

      undoable(() => {}, { extension: actionField({ insertMethod: 'inline' }) })
      expect(console.warn).to.be.called()
    })

    it('should add the field with the "actionType" insert method', () => {
      const actionFieldUndoable = undoable(reducer, {
        extension: actionField({ insertMethod: 'actionType' })
      })
      const mockInitialState = actionFieldUndoable({})

      const state = actionFieldUndoable(mockInitialState, { type: 'should be the same' })

      expect(state.actionType).to.equal('should be the same')
      expect(state.present).to.deep.equal({})
    })

    it('should add the field with the "action" insert method', () => {
      const actionFieldUndoable = undoable(reducer, {
        extension: actionField({ insertMethod: 'action' })
      })
      const mockInitialState = actionFieldUndoable({})

      const action = { type: 'should be the same' }
      const state = actionFieldUndoable(mockInitialState, action)

      expect(state.action).to.equal(action)
      expect(state.present).to.deep.equal({})
    })

    it('should add the field with the "inline" insert method', () => {
      const actionFieldUndoable = undoable(reducer, {
        extension: actionField({ insertMethod: 'inline' })
      })
      const mockInitialState = actionFieldUndoable({})

      const action = { type: 'should be the same' }
      const state = actionFieldUndoable(mockInitialState, action)

      expect(state.present.action).to.equal(action)
      expect(state.present).to.deep.equal({ action })
    })

    it('should keep the old action on undo/redo with the inline insert method', () => {
      const actionFieldUndoable = undoable(reducer, {
        extension: actionField({ insertMethod: 'inline' })
      })
      const mockInitialState = actionFieldUndoable({})

      let state
      const action1 = { type: 'first' }
      state = actionFieldUndoable(mockInitialState, action1)
      expect(state.present).to.deep.equal({ action: action1 })
      expect(state.past).to.deep.equal([{ }])

      const action2 = { type: 'second' }
      state = actionFieldUndoable(state, action2)
      expect(state.present).to.deep.equal({ action: action2 })
      expect(state.past).to.deep.equal([{ }, { action: action1 }])

      state = actionFieldUndoable(state, ActionCreators.undo())
      expect(state.present.action).to.equal(action1)

      state = actionFieldUndoable(state, ActionCreators.redo())
      expect(state.present.action).to.equal(action2)
    })

    it('should keep the old action on other redux-undo actions for inline insert', () => {
      const initType = 'INIT_TYPE'
      const actionFieldUndoable = undoable(reducer, {
        initTypes: initType,
        extension: actionField({ insertMethod: 'inline' })
      })

      let state
      const action1 = { type: 'first' }
      const action2 = { type: 'second' }

      state = actionFieldUndoable({})

      state = actionFieldUndoable(state, action1)
      expect(state.present.action).to.equal(action1)

      state = actionFieldUndoable(state, action2)
      expect(state.present.action).to.equal(action2)

      state = actionFieldUndoable(state, ActionCreators.jumpToPast(1))
      expect(state.present.action).to.equal(action1)

      state = actionFieldUndoable(state, ActionCreators.jumpToFuture(0))
      expect(state.present.action).to.equal(action2)

      state = actionFieldUndoable(state, ActionCreators.jump(-1))
      expect(state.present.action).to.equal(action1)

      state = actionFieldUndoable(state, ActionCreators.jump(1))
      state = actionFieldUndoable(state, ActionCreators.clearHistory())
      expect(state.present.action).to.equal(action2)

      state = actionFieldUndoable(state, { type: initType })
      expect(state.present.action).to.be.undefined
    })

    it('should run without arguments', () => {
      const actionFieldUndoable = undoable(reducer, {
        extension: actionField()
      })
      const mockInitialState = actionFieldUndoable({})

      const state = actionFieldUndoable(mockInitialState, { type: 'should be the same' })

      expect(state.actionType).to.equal('should be the same')
      expect(state.present).to.deep.equal({})
    })

    it('should throw when provided an invalid insert method', () => {
      const invalid = () => undoable(reducer, {
        extension: actionField({ insertMethod: 'invalid' })
      })
      expect(invalid).to.throw()
    })

    it('should use the provided includeAction', () => {
      const actionFieldUndoable = undoable(reducer, {
        extension: actionField({ includeAction: (action) => action.type === 'only me' })
      })
      const mockInitialState = actionFieldUndoable({})

      let state
      state = actionFieldUndoable(mockInitialState, { type: 'ignored' })
      expect(state.actionType).to.be.undefined

      state = actionFieldUndoable(state, { type: 'only me' })
      expect(state.actionType).to.equal('only me')

      state = actionFieldUndoable(state, { type: 'still ignored' })
      expect(state.actionType).to.equal('only me')
    })
  })

  describe('combineExtensions', () => {
    const reducer = (state, action) => {
      switch (action.type) {
        case 'UPDATE_STATE':
          return { ...state }
        default:
          return state
      }
    }

    it('should initialize each extension with the provided undoableConfig', () => {
      const spy = chai.spy((receivedConfig) => {
        expect(receivedConfig.undoType).to.equal('should be the same')
        expect(receivedConfig.extension).to.equal(combined)
      })

      const combined = combineExtensions(spy)
      const config = {
        undoType: 'should be the same',
        extension: combined
      }

      const mockUndoable = undoable(reducer, config)
      mockUndoable({})
    })

    it('should call the extensions in order one after another', () => {
      let count = 0
      const mockExtensions = [
        () => {
          count++
          expect(count).to.equal(1)
        },
        () => {
          count++
          expect(count).to.equal(2)
        }
      ]

      undoable(reducer, {
        extension: combineExtensions(...mockExtensions)
      })
    })

    it('should integrate with undoable', () => {
      const extension1 = () => (state) => ({ ...state, a: 1 })
      const extension2 = () => (state) => ({ ...state, b: 2 })
      const mockUndoable = undoable(reducer, {
        extension: combineExtensions(extension1, extension2)
      })

      let state = mockUndoable({})
      state = mockUndoable(state, { type: 'UPDATE_STATE' })
      expect(state.a).to.equal(1)
      expect(state.b).to.equal(2)
    })
  })
})
