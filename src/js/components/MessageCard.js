import * as React from 'react'
import OldStyles from './oldStyles'
import * as Util from './util'
import FlatButton from './FlatButton'

/*
 * Layout / design based on Card from Material UI:
 *
 * http://www.material-ui.com/#/components/card
 */
class MessageCard extends React.Component {
  render () {
    const cardStyle = Util.merge(OldStyles.tabWindow, OldStyles.tabWindowFocused, OldStyles.messageCard)
    const rawMarkup = { __html: this.props.content }

    return (
      <div style={cardStyle}>
        <div className='cardContent' dangerouslySetInnerHTML={rawMarkup} />
        <div style={OldStyles.cardActions}>
          <FlatButton label='GOT IT' onClick={this.props.onClick} />
        </div>
      </div>
    )
  }
}

export default MessageCard
