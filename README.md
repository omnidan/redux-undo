# redux undo/redo

_simple undo/redo functionality for redux state containers_

**Note: Until https://github.com/gaearon/redux-devtools/pull/116 gets merged, this won't work correctly with `redux-devtools`**


## Installation

```
npm install --save redux-undo
```

`redux-undo` is a [store enhancer](http://rackt.github.io/redux/docs/Glossary.html#store-enhancer), which should be added to your middleware stack *after* [`applyMiddleware`](http://rackt.github.io/redux/docs/api/applyMiddleware.html) as `applyMiddleware` is potentially asynchronous. Otherwise, `redux-undo` won’t see the raw actions emitted by asynchronous middleware such as [redux-promise](https://github.com/acdlite/redux-promise) or [redux-thunk](https://github.com/gaearon/redux-thunk).

To install, firstly import `redux-undo`:

```js
// Redux utility functions
import { compose, createStore, applyMiddleware } from 'redux';
// Redux Undo store enhancer
import reduxUndo from 'redux-undo';
```

Then, add `reduxUndo` to your store enhancers, and create your store:

```js
const finalCreateStore = compose(
  // Enables your middleware:
  applyMiddleware(m1, m2, m3), // any Redux middleware, e.g. redux-thunk
  // Provides support for redux-undo:
  reduxUndo(),
  // Lets you write ?debug_session=<name> in address bar to persist debug sessions
  persistState(window.location.href.match(/[?&]debug_session=([^&]+)\b/))
)(createStore);

const store = finalCreateStore(reducer);
```


## Usage

Firstly, import the undo/redo action creators:

```js
import { ActionCreators } from 'redux-undo';
```

Then, you can use `store.dispatch()` and the undo/redo action creators to
perform undo/redo operations on your state:

```js
store.dispatch(ActionCreators.undo()) // undo the last action
store.dispatch(ActionCreators.redo()) // redo the last action
```

You can also specify a number of steps to go back/forth:

```js
store.dispatch(ActionCreators.undo(3)) // undo 3 actions
store.dispatch(ActionCreators.redo(2)) // redo 2 actions
```


## Configuration

A configuration object can be passed to `reduxUndo()` like this (values shown
are default values):

```js
reduxUndo({
  initialHistory: [], // initial history (e.g. for loading history)
  initialIndex: [], // initial index (e.g. for loading history)
  limit: false, // set to a number to turn on a limit for the history
  debug: false, // set to `true` to turn on debugging
  filter: () => true, // see `Filtering Actions` section
})
```

### Filtering Actions

If you don't want to include every action in the undo/redo history, you can
pass a function to `reduxUndo` like this:

```js
reduxUndo(function filterActions(action) {
  return action.type !== SOME_ACTION; // only undo/redo on SOME_ACTION
})
```

Or you can use the `ifAction` and `excludeAction` helpers, which should be
imported like this:

```js
import reduxUndo, { ifAction, excludeAction } from 'redux-undo';
```

Now you can use the helper, which is pretty simple:

```js
reduxUndo({ filter: ifAction(SOME_ACTION) })
reduxUndo({ filter: excludeAction(SOME_ACTION) })
```

... they even support Arrays:

```js
reduxUndo({ filter: ifAction([SOME_ACTION, SOME_OTHER_ACTION]) })
reduxUndo({ filter: excludeAction([SOME_ACTION, SOME_OTHER_ACTION]) })
```

Note that the helpers always accept `@@redux/INIT` too in order to store your
initial state. If you don't want this, define your own filter function.


## License

MIT, see `LICENSE.md` for more information.
