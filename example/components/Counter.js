import React, { Component, PropTypes } from 'react'

class Counter extends Component {
  render() {
    const { value, increment, decrement, undo, redo } = this.props
    return (
      <p>
        Clicked: {value} times
        {' '}
        <button onClick={increment}>
          +
        </button>
        {' '}
        <button onClick={decrement}>
          -
        </button>
        {' '}
        <button onClick={undo}>
          Undo
        </button>
        {' '}
        <button onClick={redo}>
          Redo
        </button>
      </p>
    )
  }
}

Counter.propTypes = {
  value: PropTypes.number.isRequired,
  increment: PropTypes.func.isRequired,
  decrement: PropTypes.func.isRequired,
  undo: PropTypes.func.isRequired,
  redo: PropTypes.func.isRequired,
}

export default Counter
