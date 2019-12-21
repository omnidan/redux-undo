# Undoing/redoing batches of actions at a time

This is an example of how to use custom groupBy to undo-redo a batch of actions at the same time.

This method remains the ability to group by action types but also enables us to group a batch of actions.

* [x] Group by action types by default
* [x] Group batch actions on demand, with `start()` and `end()`

For example, an `onClick` event handler may dispatch a batch of actions. My way is to surround the batch of actions with `start()` and `end()`.

```javascript
import { batchGroupBy } from './batchGroupBy'

const mapDispatchToProps = (dispatch, ownProps) => ({
  onClick: (evt) => {
    batchGroupBy.start()

    dispatch(action1)
    dispatch(action2)
    dispatch(action3)

    batchGroupBy.end()
  }
});
```

The basic idea is that once `batch.start()`, all the subsequent actions will return the same group value until meet `batch.end()`. Then `redux-undo` will automatically save them in one group, without inserting a new state in the `past` array.

```javascript
// batchGroupBy.js

import { groupByActionTypes } from 'redux-undo'

export const batchGroupBy = {
  _group: null,
  start(group = cuid()) {
    this._group = group
  },
  end() {
    this._group = null
  },
  init(rawActions) {
    const defaultGroupBy = groupByActionTypes(rawActions)
    return (action) => this._group || defaultGroupBy(action)
  }
};
```

Note that we create a unique id whenever we call `batch.start()`. In such case, if two batches are called back-to-back, they have different group values so that they will be stored in two states, rather than one state.

Then we can config the reducer like below:

```javascript
import { batchGroupBy } from './batchGroupBy'

const rootReducer = combineReducers({
  ui: uiReducer,
  document: undoable(documentReducer, {
    groupBy: batchGroupBy.init([SOME_ACTION])
  }),
});
```

An array of action types can be passed into `init()`, which keeps the ability of grouping by action types if they are not within the scope of `start()` and `end()`.

