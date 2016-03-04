# redux undo/redo

[![Join the chat at https://gitter.im/omnidan/redux-undo](https://badges.gitter.im/omnidan/redux-undo.svg)](https://gitter.im/omnidan/redux-undo?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[![NPM version (>=0.4)](https://img.shields.io/npm/v/redux-undo.svg?style=flat-square)](https://www.npmjs.com/package/redux-undo) [![NPM Downloads](https://img.shields.io/npm/dm/redux-undo.svg?style=flat-square)](https://www.npmjs.com/package/redux-undo) [![Build Status](https://img.shields.io/travis/omnidan/redux-undo/master.svg?style=flat-square)](https://travis-ci.org/omnidan/redux-undo) [![Dependencies](https://img.shields.io/david/omnidan/redux-undo.svg?style=flat-square)](https://david-dm.org/omnidan/redux-undo) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](http://standardjs.com/) [![https://paypal.me/DanielBugl/10](https://img.shields.io/badge/donate-paypal-yellow.svg?style=flat-square)](https://paypal.me/DanielBugl/10) [![https://gratipay.com/~omnidan/](https://img.shields.io/badge/donate-gratipay/bitcoin-yellow.svg?style=flat-square)](https://gratipay.com/~omnidan/)

_simple undo/redo functionality for redux state containers_

[![https://i.imgur.com/M2KR4uo.gif](https://i.imgur.com/M2KR4uo.gif)](https://github.com/omnidan/redux-undo-boilerplate)

**Protip:** You can use the [redux-undo-boilerplate](https://github.com/omnidan/redux-undo-boilerplate) to quickly get started with `redux-undo`.

**Switching from 0.x to 1.0 (beta):** Make sure to update your programs to the [latest History API](#history-api).


## Installation

```
npm install --save redux-undo
```

Or you can install the beta:

```
npm install --save redux-undo@beta
```


## API

```js
import undoable from 'redux-undo';
undoable(reducer)
undoable(reducer, config)
```


## Making your reducers undoable

`redux-undo` is a reducer enhancer, it provides the `undoable` function, which
takes an existing reducer and a configuration object and enhances your existing
reducer with undo functionality.

**Note:** If you were accessing `state.counter` before, you have to access
`state.counter.present` after wrapping your reducer with `undoable`.

To install, firstly import `redux-undo`:

```js
// Redux utility functions
import { combineReducers } from 'redux';
// redux-undo higher-order reducer
import undoable from 'redux-undo';
```

Then, add `undoable` to your reducer(s) like this:

```js
combineReducers({
  counter: undoable(counter)
})
```

A [configuration](#configuration) can be passed like this:

```js
combineReducers({
  counter: undoable(counter, {
    limit: 10 // set a limit for the history
  })
})
```


## History API

Wrapping your reducer with `undoable` makes the state look like this:

```js
{
  past: [...pastStatesHere...],
  present: {...currentStateHere...},
  future: [...futureStatesHere...]
}
```

Now you can get your current state like this: `state.present`

And you can access all past states (e.g. to show a history) like this: `state.past`


## Undo/Redo Actions

Firstly, import the undo/redo action creators:

```js
import { ActionCreators } from 'redux-undo';
```

Then, you can use `store.dispatch()` and the undo/redo action creators to
perform undo/redo operations on your state:

```js
store.dispatch(ActionCreators.undo()) // undo the last action
store.dispatch(ActionCreators.redo()) // redo the last action

store.dispatch(ActionCreators.jumpToPast(index)) // jump to requested index in the past[] array
store.dispatch(ActionCreators.jumpToFuture(index)) // jump to requested index in the future[] array

store.dispatch(ActionCreators.clearHistory()) // Remove all items from past[] and future[] arrays
```


## Configuration

A configuration object can be passed to `undoable()` like this (values shown
are default values):

```js
undoable(reducer, {
  limit: false, // set to a number to turn on a limit for the history

  filter: () => true, // see `Filtering Actions` section

  undoType: ActionTypes.UNDO, // define a custom action type for this undo action
  redoType: ActionTypes.REDO, // define a custom action type for this redo action

  jumpToPastType: ActionTypes.JUMP_TO_PAST, // define custom action type for this jumpToPast action
  jumpToFutureType: ActionTypes.JUMP_TO_FUTURE, // define custom action type for this jumpToFuture action

  clearHistoryType: ActionTypes.CLEAR_HISTORY, // define custom action type for this clearHistory action

  initialState: undefined, // initial state (e.g. for loading)
  initTypes: ['@@redux/INIT', '@@INIT'] // history will be (re)set upon init action type
  initialHistory: { // initial history (e.g. for loading)
    past: [],
    present: config.initialState,
    future: []
  },

  debug: false, // set to `true` to turn on debugging
})
```

**Note:** If you want to use just the `initTypes` functionality, but not import
the whole redux-undo library, use [redux-recycle](https://github.com/omnidan/redux-recycle)!

### Filtering Actions

If you don't want to include every action in the undo/redo history, you can
pass a function to `undoable` like this:

```js
undoable(reducer, {
  filter: function filterActions(action, currentState, previousState) {
    return action.type === SOME_ACTION; // only add to history if action is SOME_ACTION
  }
})

// or you could do...

undoable(reducer, {
  filter: function filterState(action, currentState, previousState) {
    return currentState !== previousState; // only add to history if state changed
  }
})
```

Or you can use the `distinctState`, `includeAction` and `excludeAction` helpers,
which should be imported like this:

```js
import undoable, { distinctState, includeAction, excludeAction } from 'redux-undo';
```

Now you can use the helper, which is pretty simple:

```js
undoable(reducer, { filter: includeAction(SOME_ACTION) })
undoable(reducer, { filter: excludeAction(SOME_ACTION) })

// or you could do...

undoable(reducer, { filter: distinctState() })
```

... they even support Arrays:

```js
undoable(reducer, { filter: includeAction([SOME_ACTION, SOME_OTHER_ACTION]) })
undoable(reducer, { filter: excludeAction([SOME_ACTION, SOME_OTHER_ACTION]) })
```

### Ignoring Actions

When implementing a filter function, it only prevents the old state from being
stored in the history. **`filter` does not prevent the present state from being
updated.**

If you want to ignore an action completely, as in, not even update the present
state, you can make use of [redux-ignore](https://github.com/omnidan/redux-ignore).

It can be used like this:

```js
import { ignoreActions } from 'redux-ignore'

ignoreActions(
  undoable(reducer),
  [IGNORED_ACTION, ANOTHER_IGNORED_ACTION]
)

// or define your own function:

ignoreActions(
  undoable(reducer),
  (action) => action.type === SOME_ACTION // only add to history if action is SOME_ACTION
)
```


## What is this magic? How does it work?

Have a read of the [Implementing Undo History recipe](http://redux.js.org/docs/recipes/ImplementingUndoHistory.html) in the Redux documents, which explains in detail how redux-undo works.


## License

MIT, see `LICENSE.md` for more information.
