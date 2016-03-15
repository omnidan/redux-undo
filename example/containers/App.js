import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import * as Actions from '../actions/Actions'
import Counter from '../components/Counter'

class App extends Component {
  
  render() {

    const { value, increment, decrement, undo, redo } = this.props
    
    return (
      <Counter
        value={value}
        increment={increment}
        decrement={decrement}
        undo={undo}
        redo={redo}
      />
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

function mapStateToProps(state) {
  return {
    value: state.present
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(Actions, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
