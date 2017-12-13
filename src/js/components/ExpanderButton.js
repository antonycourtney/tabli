import * as React from 'react'
import Styles from './styles'
import * as Util from './util'

// expand / contract button for a window
class ExpanderButton extends React.PureComponent {
  handleClicked = (event) => {
    var nextState = !this.props.expanded
    this.props.onClick(nextState)
    event.stopPropagation()
  };

  render () {
    var expandStyle = this.props.expanded ? Styles.windowCollapse : Styles.windowExpand
    var buttonStyle = Util.merge(Styles.headerButton, expandStyle)
    return (
      <button style={buttonStyle} onClick={this.handleClicked} />
    )
  }
}

export default ExpanderButton
