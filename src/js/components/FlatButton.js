import * as React from 'react'
import * as PureRenderMixin from 'react-addons-pure-render-mixin'
import Styles from './styles'

var FlatButton = React.createClass({
  mixins: [PureRenderMixin],
  handleClick (event) {
    console.log('FlatButton.handleClick: ', this.props)
    event.stopPropagation()
    event.preventDefault()
    if (this.props.onClick) {
      this.props.onClick(event)
    }
    console.log('FlatButton.handleClick: returning false')
    return false
  },

  render () {
    return (
      <a onClick={this.handleClick} href='javascript:;' style={Styles.flatButton}>
        {this.props.label}
      </a>
    )
  }
})

export default FlatButton
