import * as log from 'loglevel' // eslint-disable-line no-unused-vars
import * as React from 'react'
import { css } from 'emotion'

const flatButtonStyle = css({
  border: '0px',
  display: 'inline-block',
  backgroundColor: 'rgba(0,0,0,0)',
  fontFamily: 'Roboto, sans-serif',
  fontSize: 14,
  color: '#4285f4',
  '&:hover': {
    textDecoration: 'none'
  }
})

class FlatButton extends React.Component {
  handleClick = (event) => {
    log.log('FlatButton.handleClick: ', this.props)
    event.stopPropagation()
    event.preventDefault()
    if (this.props.onClick) {
      this.props.onClick(event)
    }
    log.log('FlatButton.handleClick: returning false')
    return false
  };

  render () {
    return (
      <a
        className={flatButtonStyle}
        onClick={this.handleClick} href='javascript:;'>
        {this.props.label}
      </a>
    )
  }
}

export default FlatButton
