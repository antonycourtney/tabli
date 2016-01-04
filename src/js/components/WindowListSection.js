'use strict';

import * as React from 'react';
import * as Immutable from 'immutable';
import {addons} from 'react/addons';
import Styles from './styles';
import * as Util from './util';
const {PureRenderMixin, Perf} = addons;

import * as actions from '../actions';

const WindowListSection = React.createClass({
  render() {
    var header = null;
    if (this.props.title) {
      header = (
        <div style={Styles.windowListSectionHeader}>
          <span>{this.props.title}</span>
        </div>
      );
    }

    return (
      <div style={Styles.windowListSection}>
        {header}
        <div>
          {this.props.children}
        </div>
      </div>
    );
  },
});

export default WindowListSection;
