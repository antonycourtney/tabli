/*
 * A Component wrapper around checkbox for use in WindowHeader and
 * TabItem. Wraps checkbox input in a div since the input component
 * doesn't obey proper css props like width and height, and swaps
 * input for an image when checked.
 */
import * as React from 'react'

import { cx, css } from 'emotion'
import * as styles from './cssStyles'
import get from 'lodash/get'

const containerBaseStyle = css({
  display: 'flex',
  alignItems: 'center'
})
const containerStyle = cx(styles.headerButton, containerBaseStyle)

class HeaderCheckbox extends React.PureComponent {
  render () {
    const checked = !!(this.props.value)

    // defaults to rendering in open state:
    const isOpen = get(this.props, 'open', true)

    let checkboxComponent

    if (checked) {
      const openStateStyle = isOpen ? null : styles.imageButtonClosed
      checkboxComponent = (
        <button className={cx(styles.headerButton, styles.windowManagedButton, openStateStyle)} title='Stop managing this window' onClick={this.props.onClick} />)
    } else {
      const extraUncheckedStyle = get(this.props, 'extraUncheckedStyle', null)
      checkboxComponent = (
        <input
          className={cx(styles.headerCheckBoxInput, extraUncheckedStyle)}
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
