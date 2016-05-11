import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Immutable from 'immutable';
import Styles from './styles';
import * as Util from './util';

import * as actions from '../actions';

import FlatButton from './FlatButton';

/*
 * Layout / design based on Card from Material UI:
 *
 * http://www.material-ui.com/#/components/card
 */
const MessagePanel = React.createClass({
  render() {

    const panelStyle = Util.merge(Styles.tabWindow, Styles.tabWindowFocused, Styles.messagePanel );

    return (
      <div style={panelStyle}>
        <div style={Styles.panelHeader}>
          <h3>Tabli 0.X (7May2016)</h3>
        </div>
        <div style={Styles.panelBody}>
          <p>
          New in this release:
          </p>
          <ul>
            <li>Tabli popout window</li>
            <li>Drag and Drop</li>
          </ul>
        </div>
        <div style={Styles.cardActions}>
          <FlatButton label="GOT IT" />
        </div>
      </div>
    );        
  }
});

export default MessagePanel;