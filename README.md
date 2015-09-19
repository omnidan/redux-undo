# redux undo/redo

[![NPM version (>=0.2)](https://img.shields.io/npm/v/redux-undo.svg?style=flat-square)](https://www.npmjs.com/package/redux-undo) [![Dependencies](https://img.shields.io/david/omnidan/redux-undo.svg?style=flat-square)](https://david-dm.org/omnidan/redux-undo)

_simple undo/redo functionality for [redux](https://github.com/rackt/redux) state containers_

**Protip:** You can use the [redux-undo-boilerplate](https://github.com/omnidan/redux-undo-boilerplate) to quickly get started with `redux-undo`.

[![https://i.imgur.com/9w8FHHI.gif](https://i.imgur.com/9w8FHHI.gif)](https://github.com/omnidan/redux-undo-boilerplate)


## Installation

```
npm install --save redux-undo
```

## Making your reducers undoable

`redux-undo` is a reducer enhancer, it provides the `undoable` function, which
takes an existing reducer and a configuration object and enhances your existing
reducer with undo functionality.

**Note:** If you were accessing `state.counter` before, you have to access
`state.counter.currentState` after wrapping your reducer with `undoable`. 
To access the history, simply use `state.counter.history`.

To install, firstly import `redux-undo`:

```js
// Redux utility functions
import { compose, createStore, applyMiddleware } from 'redux';
// Redux Undo store enhancer
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

A configuration object can be passed to `undoable()` like this (values shown
are default values):

```js
undoable({
  initialHistory: [], // initial history (e.g. for loading history)
  initialIndex: [], // initial index (e.g. for loading history)
  limit: false, // set to a number to turn on a limit for the history
  debug: false, // set to `true` to turn on debugging
  filter: () => true, // see `Filtering Actions` section
  undoType: ActionTypes.UNDO, // define a custom action type for this undo action
  redoType: ActionTypes.REDO, // define a custom action type for this redo action
})
```

### Filtering Actions

If you don't want to include every action in the undo/redo history, you can
pass a function to `undoable` like this:

```js
undoable(function filterActions(action) {
  return action.type !== SOME_ACTION; // only undo/redo on SOME_ACTION
})
```

Or you can use the `ifAction` and `excludeAction` helpers, which should be
imported like this:

```js
import undoable, { ifAction, excludeAction } from 'redux-undo';
```

Now you can use the helper, which is pretty simple:

```js
undoable({ filter: ifAction(SOME_ACTION) })
undoable({ filter: excludeAction(SOME_ACTION) })
```

... they even support Arrays:

```js
undoable({ filter: ifAction([SOME_ACTION, SOME_OTHER_ACTION]) })
undoable({ filter: excludeAction([SOME_ACTION, SOME_OTHER_ACTION]) })
```

Note that the helpers always accept `@@INIT` and `@@redux/INIT` too in 
order to store your initial state. If you don't want this, define your 
own filter function.


## License

MIT, see `LICENSE.md` for more information.
