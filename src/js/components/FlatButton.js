import * as React from 'react'
import Styles from './oldStyles'

class FlatButton extends React.Component {
  handleClick = (event) => {
    console.log('FlatButton.handleClick: ', this.props)
    event.stopPropagation()
    event.preventDefault()
    if (this.props.onClick) {
      this.props.onClick(event)
    }
    console.log('FlatButton.handleClick: returning false')
    return false
  };

  render () {
    return (
      <a onClick={this.handleClick} href='javascript:;' style={Styles.flatButton}>
        {this.props.label}
      </a>
    )
  }
}

export default FlatButton
