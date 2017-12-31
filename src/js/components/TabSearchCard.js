// @flow

import * as React from 'react'
import * as Util from './util'

type Props = {
  saved: boolean,
  url: string,
  title: string,
  providerName: string,
  storybook: ?boolean
}

export default class TabSearchCard extends React.Component<Props> {
  render () {
    let tabCheckItem = null
    if (this.props.saved) {
      tabCheckItem =
        <div className='tabSearchCard-spacer tabSearchCard-managed' />
    } else {
      tabCheckItem = <div className='tabSearchCard-spacer' />
    }

    var fiSrc
    if (!this.props.storybook) {
      fiSrc = 'chrome://favicon/size/32/' + this.props.url
    } else {
      // fiSrc = 'http://www.google.com/s2/favicons?domain_url=' + encodeURIComponent(this.props.url)
      fiSrc = 'https://api.statvoo.com/favicon?url=' + encodeURIComponent(this.props.url)
    }
    // Skip the chrome FAVICONs; they just throw when accessed.
    if (fiSrc.indexOf('chrome://theme/') === 0) {
      fiSrc = ''
    }

    let fiClasses = ['tabSearchCard-favIcon']

    if (!this.props.open) {
      fiClasses.push('tabSearchCard-closed')
    }
    const tabOpenStyle = this.props.open ? 'tabSearchCard-open' : 'tabSearchCard-closed'

    let tabFavIcon
    if ((this.props.url.length > 0) && (fiSrc.length > 0)) {
      tabFavIcon = <img className={fiClasses.join(' ')} src={fiSrc} />
    } else {
      fiClasses.push('tabSearchCard-favIcon-empty')
      tabFavIcon = <div className={fiClasses.join(' ')} />
    }
    const tabTitle = this.props.title
    const tabURL = this.props.url

    const tabSelectedStyle = this.props.selected ? 'tabSearchCard-selected' : ''

    return (
      <div className={Util.mergeCSS('tabSearchCard-card', tabOpenStyle, tabSelectedStyle)}>
        {tabCheckItem}
        {tabFavIcon}
        <div className='tabSearchCard-text-info'>
          <span className='tabSearchCard-text-title'>{tabTitle}</span>
          <span className='tabSearchCard-text-url'>{tabURL}</span>
        </div>
        <div className='tabSearchCard-provider-info'>
          <span className='tabSearchCard-provider-name'>{this.props.providerName}</span>
        </div>
      </div>
    )
  }
}
