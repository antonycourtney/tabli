import * as React from 'react'
import * as styles from './cssStyles'

const buttonSpacer = <div className={styles.headerButton} />

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

    return (
      <button
        className={this.props.className}
        title={this.props.title}
        onClick={this.handleClick} />
    )
  }
}

export default HeaderButton
