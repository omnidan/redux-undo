### Importing redux-undo in typescript

By default, you must use the `import = require` syntax when using typescript. You can read more in their [documentation](https://www.typescriptlang.org/docs/handbook/modules.html#export--and-import--require).

```typescript
import ReduxUndo = require('redux-undo')

const undoable = ReduxUndo.default
```

Alternatively, by changing your `tsconfig.json`, you can import using the ES style syntax. Both `esModuleInterop` and `allowSyntheticDefaultImports` need to be set to true.

```json
{
  "compilerOptions": {
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  }
}
```

```typescript
// myReducer.ts
import undoable, { ActionCreators } from 'redux-undo'
```

### Typing Initial State

While using typescript, you might run into issues when providing initial state for your undoable reducers. To get around this issue, you will need to cast types, a.k.a. blantly lie to the compiler.

When you are providing state as your reducer will receive them without a predefined history, you must type cast to `any` then `StateWithHistory`.

```typescript
import { StateWithHistory } from 'redux-undo'

createStore(rootReducer, {
  // Have to cast to any first
  undoableState: (initialState as any) as StateWithHistory<typeof initialState>
})
```

With a predefined history, you can lie "more directly."

```typescript
createStore(rootReducer, {
  undoableState: withHistory as StateWithHistory<typeof withHistory['present']>
})
```

Remember, you have to pass **all of and only** the fields `past`, `present`, and `future` in the history. Read more about [initialState with redux-undo](./upgrading-to-1.0.md#initialstate).
