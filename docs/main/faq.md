# FAQ

## Table of Contents

* [Where can I get help using `redux-undo`?](faq.md#where-can-i-get-help-using-redux-undo)
* [Where can I find examples of how to use `redux-undo`?](faq.md#where-can-i-find-examples-of-how-to-use-redux-undo)
* [How do I prevent cluttering up history with rapidly changing state?](faq.md#how-do-i-prevent-cluttering-up-history-with-rapidly-changing-state)
* [Can I have multiple, separate undoable functions?](faq.md#can-i-have-multiple-separate-undoable-functions)
* [Why are my actions not being filtered?](faq.md#why-are-my-actions-not-being-filtered)
* [What is `_latestUnfiltered`? Can I remove it?](faq.md#what-is-_latestunfiltered-can-i-remove-it)
* [Why am I getting `Cannot find module 'redux-undo'`?](faq.md#why-am-i-getting-cannot-find-module-redux-undo)
* [How do I set an initial state/history?](upgrading-to-1.0.md#initialstate)
* [How do I upgrade from 0.X to 1.0?](upgrading-to-1.0.md)
* [How can I Undo or Redo a batch of actions at the same time ?](examples/undo-redo-batch-actions.md)

## Where can I get help using `redux-undo`?

To get an understanding of the basics, read through the [README](https://github.com/omnidan/redux-undo/tree/9a05150d6bcd3f71e56c3d9cb5e8669ac3d5c1dd/README.md) and checkout some [examples](faq.md#where-can-i-find-examples-of-how-to-use-redux-undo).

To get help with a specific use case, see if there is already an example in these docs or the examples. If not, ask for help in the [gitter chat](https://gitter.im/omnidan/redux-undo)!

If it seems you have found a bug or you are itching for a new feature, go ahead and submit it as an issue following the template provided. Please reserve Github issues for bugs and features **only**. Ask any other questions on the gitter chat and someone will probably be able to help you with your problem.

_[back to top](#table-of-contents)_

## Where can I find examples of how to use `redux-undo`?

Look at the `examples/` directory of the project folder. The `todos-with-undo/` is a good project to start messing with.

```bash
$ git clone https://github.com/omnidan/redux-undo.git
$ cd redux-undo/examples/todos-with-undo
$ npm install
$ npm start
```

Just open [http://localhost:3000](http://localhost:3000) and you are good to go!

_[back to top](#table-of-contents)_

## How do I prevent cluttering up history with rapidly changing state?

The `throttled-drag/` project found the `examples/` directory gives a good demonstration of how to debounce undos \(the filter is in `util/undoFilter.js`\).

This general question has different solutions depending on your exact problem. Let's say you have one or more rapidly dispatched actions, for example `MOVE_CURSOR` and `UPDATE_OBJECT_POS`, that ends with a lone action `PLACE_OBJECT`, and you only want to record the end state after `PLACE_OBJECT`. Then you can simply use a filter `excludeAction(['MOVE_CURSOR', 'UPDATE_OBJECT_POS'])`

For more complex requirements, consider writing your own [custom filter](https://github.com/omnidan/redux-undo#custom-filters).

_[back to top](#table-of-contents)_

## Can I have multiple, separate undoable functions?

Yes you can! Simply wrap each reducer with its own `undoable()`.

```javascript
const rootReducer = combineReducers({
  someData: undoable(dataReducer),
  otherData: undoable(otherDataReducer)
});
```

Do not forget to setup different undo/redo types to undo/redo each slice separately.

```javascript
someData: undoable(dataReducer, {
  undoType: "DATA_UNDO",
  redoType: "DATA_REDO"
  // There is also jumpType, jumpToPastType, jumpToFutureType, clearHistoryType, and initTypes (which is an array of action types)
});
```

If you wish to have a single conglomerate history that a user can undo one action at a time, you can wrap the root reducer with `undoable()`.

```javascript
const rootReducer = undoable(
  combineReducers({
    someData: dataReducer,
    otherData: otherDataReducer
  }),
  {...options...}
);
```

You probably need to use [custom filters](https://github.com/omnidan/redux-undo#custom-filters) and/or [`groupBy`](https://github.com/omnidan/redux-undo#grouping-actions) to undo/redo in reasonable chunks.

_[back to top](#table-of-contents)_

## Why are my actions not being filtered?

If you are trying to prevent actions from changing state, **that is not what `filter` is for**. The `filter` option only prevents state changes from becoming part of the history, i.e. the new state being pushed into `state.past`. If you need this functionality, check out [redux-ignore](https://github.com/omnidan/redux-ignore).

On the other hand, here is how to use the helper functions:

```javascript
undoable(myReducer, {
  filter: combineFilters(
    // includeAction/excludeAction helpers take an array of action type strings
    includeAction(["MY_ACTION", "ANOTHER_ACTION"]),
    costumeFilter
  )
});
```

When writing a custom filter, return `true` for actions that you want to keep in history.

```javascript
function onlyEveryThird(action, newState, history) {
  // Access the whole history object
  let { past, present, future, limit } = history;

  return newState.count % 3 === 0; // Only update history every third count
}
```

_[back to top](#table-of-contents)_

## What is `_latestUnfiltered`? Can I remove it?

### What is it?

State wrapped by `undoable()` contains the field `_latestUnfiltered` alongside `past`, `present`, etc. This field is used to keep track of state that should be put in the history but cannot yet because the previous action\(s\) were filtered. It is basically a temporary variable between filtered actions.

```javascript
// This action is filtered, so present cannot be pushed into past right away
_latestUnfiltered = present;
present = newState;

// With the next unfiltered action...
past = [...past, _latestUnfiltered]; // Now we can add it
```

### Can I remove it?

Short answer, no. It is an integral part of filtering actions from history and cannot be removed from the library. You can ignore it completely, but overriding/removing it may have unwanted consequences.

While there is a tad more overhead handling actions in the reducer, it is necessary with the current setup. In the future, there might be optimization that makes this field less burdensome for users that do not use the filtering functionality.

_[back to top](#table-of-contents)_

## Why am I getting `Cannot find module 'redux-undo'`?

If you are using redux-undo in a CommonJS or UMD environment, you need to add `.default` to your imports.

```javascript
// CJS
var undoable = require("redux-undo").default;

// UMD
var undoable = window.ReduxUndo.default;
```

ES6 imports should work without a hitch.

```javascript
import undoable from "redux-undo";
```

If this fixed your issue, you might also want to checkout how to [upgrade from 0.6 to 1.0](upgrading-to-1.0.md).

_[back to top](#table-of-contents)_
