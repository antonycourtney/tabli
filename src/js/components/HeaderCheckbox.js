/*
 * A Component wrapper around checkbox for use in WindowHeader and
 * TabItem. Wraps checkbox input in a div since the input component
 * doesn't obey proper css props like width and height, and swaps
 * input for an image when checked.
 */
import * as React from 'react'

import { cx, css } from 'emotion'
import * as styles from './cssStyles'

const containerBaseStyle = css({
  display: 'flex',
  alignItems: 'center'
})
const containerStyle = cx(styles.headerButton, containerBaseStyle)

class HeaderCheckbox extends React.PureComponent {
  render () {
    const checked = !!(this.props.value)

    let checkboxComponent

    if (checked) {
      checkboxComponent = (
        <button className={cx(styles.headerButton, styles.windowManagedButton)} title='Stop managing this window' onClick={this.props.onClick} />)
    } else {
      checkboxComponent = (
        <input
          className={styles.headerCheckBoxInput}
          type='checkbox'
          title='Save all tabs in this window'
          onClick={this.props.onClick}
          value={false} />)
    }
    return (
      <div className={containerStyle}>
        {checkboxComponent}
      </div>
    )
  }
}

export default HeaderCheckbox
