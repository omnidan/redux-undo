# Converting a regular reducer to undoable reducer

This example shows how to convert a regular reducer to undoable reducer. 

We will create an application that implements github labels(the ones we add to the github issues).


./src/reducer.js

```javascript
const initialState = {
    labels: []
};

function reducer(state = initialState, action) {
    switch(action.type) {
        case 'ADD_LABEL':
            return {
                ...state,
                labels: [...state.labels, {
                    id: action.id,
                    name: action.name,
                    color: action.color,
                    description: action.description
                }]
            }
        case 'DELETE_LABEL':
            return {
                ...state,
                labels: state.labels.filter(label => label.id !== action.id)
            }
        default: 
            return state;
    }
}

export default reducer;
```

./src/actions.js

```javascript
    let labelId = 1;

    export const addLabel = (name, color, description) => ({
        type: 'ADD_LABEL',
        id: labelId++,
        name,
        description,
        color
    });

    export const deleteLabel = id => ({
        type: 'DELETE_LABEL',
        id
    });
```

./src/index.js

```javascript
import {createStore} from 'redux';
import reducer from './reducer';
import {addLabel, deleteLabel} from './actions';

const store = createStore(reducer);

// Log the initial state.
console.log(store.getState());

// Everytime the state changes, Log it.
store.subscribe(() => console.log(store.getState()));

// Add a new Label
store.dispatch(addLabel('bug', 'red', 'Something in this project needs to be fixed'));

// Add a new Label
store.dispatch(addLabel('docs', 'pink', 'Related to documentation'));

// Add a new Label
store.dispatch(addLabel('good first issue', 'pink', 'Great for aspiring open source contributors'));


```