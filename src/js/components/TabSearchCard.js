
import * as React from 'react'
import Styles from './styles'
import * as Util from './util'

export default class TabSearchCard extends React.Component {
  render () {
    const tabItem = this.props.tabItem
    let tabCheckItem = null
    if (tabItem.saved) {
      tabCheckItem =
        <div className='tabSearchCard-spacer tabSearchCard-managed' />
    } else {
      tabCheckItem = <div className='tabSearchCard-spacer' />
    }

    var fiSrc
    if (!this.props.storybook) {
      fiSrc = 'chrome://favicon/size/32/' + tabItem.url
    } else {
      // fiSrc = 'http://www.google.com/s2/favicons?domain_url=' + encodeURIComponent(tabItem.url)
      fiSrc = 'https://api.statvoo.com/favicon?url=' + encodeURIComponent(tabItem.url)
    }
    // Skip the chrome FAVICONs; they just throw when accessed.
    if (fiSrc.indexOf('chrome://theme/') === 0) {
      fiSrc = ''
    }

    const emptyFavIcon = <div style={Util.merge(Styles.headerButton, Styles.emptyFavIcon)} />

    // TODO: also cards for saved, closed tabs...
    var tabFavIcon = (fiSrc.length > 0) ? <img className='tabSearchCard-favIcon' src={fiSrc} /> : emptyFavIcon

    const tabTitle = tabItem.title
    const tabURL = tabItem.url

    return (
      <div className='tabSearchCard-card'>
        {tabCheckItem}
        {tabFavIcon}
        <div className='tabSearchCard-text-info'>
          <span className='tabSearchCard-text-title'>{tabTitle}</span>
          <span className='tabSearchCard-text-url'>{tabURL}</span>
        </div>
      </div>
    )
  }
}
