import * as React from 'react'
import * as Util from './util'
import { cx, css } from 'emotion'
import { headerButton } from './cssStyles'
const { mkUrl } = Util

const expandIcon = mkUrl('images/triangle-small-4-01.png')
const collapseIcon = mkUrl('images/triangle-small-1-01.png')

const baseStyle = css`
  background-color: #606060;
`
const expandedStyle = cx(headerButton, css({ maskImage: collapseIcon }), baseStyle)
const collapsedStyle = cx(headerButton, css({ maskImage: expandIcon }), baseStyle)

// expand / contract button for a window
class ExpanderButton extends React.PureComponent {
  handleClicked = (event) => {
    var nextState = !this.props.expanded
    this.props.onClick(nextState)
    event.stopPropagation()
  };

  render () {
    const style = this.props.expanded ? expandedStyle : collapsedStyle
    return (
      <button className={style} onClick={this.handleClicked} />
    )
  }
}

export default ExpanderButton
