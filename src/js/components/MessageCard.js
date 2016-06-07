import * as React from 'react'
import Styles from './styles'
import * as Util from './util'
import FlatButton from './FlatButton'

/*
 * Layout / design based on Card from Material UI:
 *
 * http://www.material-ui.com/#/components/card
 */
const MessageCard = React.createClass({
  render () {
    const cardStyle = Util.merge(Styles.tabWindow, Styles.tabWindowFocused, Styles.messageCard)
    const rawMarkup = { __html: this.props.content }

    return (
      <div style={cardStyle}>
        <div className='cardContent' dangerouslySetInnerHTML={rawMarkup} />
        <div style={Styles.cardActions}>
          <FlatButton label='GOT IT' onClick={this.props.onClick} />
        </div>
      </div>
    )
  }
})

export default MessageCard
