import * as React from 'react'
import Styles from './styles'

const buttonSpacer = <div style={Styles.headerButton} />

class HeaderButton extends React.PureComponent {
  handleClick = (event) => {
    if (this.props.visible) {
      this.props.onClick(event)
      event.stopPropagation()
    }
  };

  render () {
    /* We render a LOT of these, and React profiler indicates we're spending a lot of time here
     * and mostly visible will be false so let's try to fast path the non-visible case with
     * a simple spacer
     */
    if (!this.props.visible) {
      return buttonSpacer
    }

    // const visibilityStyle = this.props.visible ? Styles.visible : Styles.hidden
    var buttonStyle = this.props.baseStyle
    return (
      <button
        style={buttonStyle}
        className={this.props.className}
        title={this.props.title}
        onClick={this.handleClick} />
    )
  }
}

export default HeaderButton
