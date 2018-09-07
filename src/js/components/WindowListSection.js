import * as React from 'react'
import * as Constants from './constants'
import {css} from 'emotion'
const windowListSectionStyle = css({
  borderBottom: '1px solid #bababa',
  paddingLeft: 12,
  paddingRight: 24,
  paddingTop: 10,
  paddingBottom: 4,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch'
})

const windowListSectionHeaderStyle = css({
  minWidth: Constants.WINDOW_MIN_WIDTH,
  maxWidth: Constants.WINDOW_MAX_WIDTH,
  fontWeight: 'bold',
  marginBottom: 5
})

class WindowListSection extends React.Component {
  render () {
    var header = null
    if (this.props.title) {
      header = (
        <div className={windowListSectionHeaderStyle}>
          <span>{this.props.title}</span>
        </div>
      )
    }
    var sectionDivProps = {
      className: windowListSectionStyle
    }
    if (this.props.focusedRef) {
      sectionDivProps.ref = this.props.focusedRef
    }
    return (
      <div {...sectionDivProps}>
        {header}
        <div>
          {this.props.children}
        </div>
      </div>
    )
  }
}

export default WindowListSection
