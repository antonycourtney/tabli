import * as React from 'react'
import OldStyles from './oldStyles'

class WindowListSection extends React.Component {
  render () {
    var header = null
    if (this.props.title) {
      header = (
        <div style={OldStyles.windowListSectionHeader}>
          <span>{this.props.title}</span>
        </div>
      )
    }
    var sectionDivProps = {
      style: OldStyles.windowListSection
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
