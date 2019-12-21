# Upgrading to 1.0

## Imports

CommonJS and UMD bundles now need a `.default` added to your imports.

```javascript
// CJS
var undoable = require("redux-undo").default;

// UMD
var undoable = window.ReduxUndo.default;
```

ES6 imports should work as expected.

```javascript
import undoable from "redux-undo";
```

## `distinctState()` filter applied by default

In 1.0 and greater, state is only added to history if it is different than the previous state \(checked by object reference equality `===`\). The `distinctState()` filter is now deprecated and removed as there is no need for it.

## History API change in versions `< 0.4`

In versions 0.3 and earlier, the history state was stored in the form.

```javascript
{
  currentState: {...currentStateHere...},
  history: {
    past: [...pastStatesHere...],
    present: {...currentStateHere...},
    future: [...futureStatesHere...]
  }
}
```

In versions `0.4` and greater, the full history is exposed directly.

```javascript
{
  past: [...pastStatesHere...],
  present: {...currentStateHere...},
  future: [...futureStatesHere...]
}
```

## InitialState

Before `1.0`, you would pass an `initialState` or `initialHistory` as a config option.

```javascript
undoable(myReducer, {
  initialState: {
    myState: "initial",
    otherField: true
  }
  // or initialHistory with past, present, and future
});
```

Now, these options are removed in favor of Redux's `preloadedState` parameter.

```javascript
const rootReducer = combineReducers({
  myReducer: undoable(myReducer)
});

const store = createStore(rootReducer, {
  myReducer: {
    myState: "initial",
    otherField: true
  }
});
```

When providing initial state, redux-undo will automatically detect whether or not it is a complete history \(with `past`, `present`, `future`\) or not. If it is not, it will automatically convert it to one.

If you wish to provide an initial history, e.g. you want to prefill `past` to recover a previous session, you **must** provide the three fields for redux-undo to recognize it as a history object.

```javascript
const store = createStore(rootReducer, {
  myReducer: {
    past: ["from", "previous", "session"],
    present: "now"
    // `future` not provided!! Redux-undo will not recognize this as a history
    // and will instead set present = {past: [...], present: 'now'}

    // To fix, pass `future: []`
  }
});
```

