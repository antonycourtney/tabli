
import * as React from 'react'
import Styles from './styles'
import * as Util from './util'

export default class TabSearchCard extends React.Component {
  render () {
    const tabItem = this.props.tabItem
    let tabCheckItem = null
    if (tabItem.saved) {
      tabCheckItem = (
        <button style={Util.merge(Styles.headerButton, Styles.tabManagedButton)} />)
    }

    let fiSrc = 'chrome://favicon/size/32/' + tabItem.url

    // Skip the chrome FAVICONs; they just throw when accessed.
    if (fiSrc.indexOf('chrome://theme/') === 0) {
      fiSrc = ''
    }

    const emptyFavIcon = <div style={Util.merge(Styles.headerButton, Styles.emptyFavIcon)} />

    const favIconOpenStyle = null // for now ....
    const favIconStyle = Util.merge(Styles.favIcon, favIconOpenStyle)

    var tabFavIcon = (fiSrc.length > 0) ? <img style={favIconStyle} src={fiSrc} /> : emptyFavIcon

    const tabTitle = tabItem.title
    const tabURL = tabItem.url

    return (
      <div className='tabSearchCard-card'>
        {tabCheckItem}
        {tabFavIcon}
        <div className='tabSearchCard-text-info'>
          <span className='tabSearchCard-text-title'>{tabTitle}</span>
          <span className='tabsearchCard-text-url'>{tabURL}</span>
        </div>
      </div>
    )
  }
}
