import * as React from 'react'
import * as Util from './util'
import { cx, css } from 'emotion'
import { ThemeContext } from './themeContext'
import * as styles from './cssStyles'
const { mkUrl } = Util

const expandIcon = mkUrl('images/triangle-small-4-01.png')
const collapseIcon = mkUrl('images/triangle-small-1-01.png')

const baseStyle = (theme: Object) => css`
  background-color: ${theme.headerButtonColor};
  &:hover {
    background-color: ${theme.headerButtonHover};
  }  
`
const expandedStyle = (theme: Object) => cx(styles.headerButton, css({ maskImage: collapseIcon }), baseStyle(theme))
const collapsedStyle = (theme: Object) => cx(styles.headerButton, css({ maskImage: expandIcon }), baseStyle(theme))

// expand / contract button for a window
class ExpanderButton extends React.PureComponent {
  static contextType = ThemeContext

  handleClicked = (event) => {
    var nextState = !this.props.expanded
    this.props.onClick(nextState)
    event.stopPropagation()
  };

  render () {
    let theme = this.context
    const style = this.props.expanded ? expandedStyle : collapsedStyle
    return (
      <button className={style(theme)} onClick={this.handleClicked} />
    )
  }
}

export default ExpanderButton
