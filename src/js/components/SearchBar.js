'use strict';

import * as React from 'react';
import * as Immutable from 'immutable';
import {addons} from 'react/addons'; 
import Styles from './styles';
import * as Util from './util';
const {PureRenderMixin, Perf} = addons;

import * as Constants from './constants';
import * as actions from '../actions';
import * as _ from 'lodash';
import Hoverable from './Hoverable';
import WindowHeader from './WindowHeader';
import TabItem from './TabItem';

const SearchBar = React.createClass({
  handleChange() {
    const searchStr=this.refs.searchInput.getDOMNode().value;
    this.props.onSearchInput(searchStr);
  },

  handleKeyDown(e) {
    console.log("handleKeyDown: ", _.omit(e,_.isObject));
    if ((e.keyCode===Constants.KEY_F1) ||
        (e.keyCode===Constants.KEY_QUESTION && e.ctrlKey && e.shiftKey)) {
      e.preventDefault();
      actions.showHelp();
    }
    if (e.keyCode===Constants.KEY_UP) {
      if (this.props.onSearchUp) {
        e.preventDefault();
        this.props.onSearchUp(e.ctrlKey);
      }
    }
    if (e.keyCode===Constants.KEY_DOWN) {
      if (this.props.onSearchDown) {
        e.preventDefault();
        this.props.onSearchDown(e.ctrlKey);
      }
    }
    if (e.keyCode===Constants.KEY_TAB) {
      // We need to determine if it was forward or backwards tab:
      // N.B. we still try and use e.ctrlKey to determine paged
      // nav, but that key combo consumed by Chrome before we see it...
      if (this.props.onSearchUp && this.props.onSearchDown) {
        e.preventDefault();
        if (e.shiftKey) {
          this.props.onSearchUp(e.ctrlKey);
        } else {
          this.props.onSearchDown(e.ctrlKey);
        }
      }
    }
    if (e.keyCode==Constants.KEY_ENTER) {
      if (this.props.onSearchEnter) {
        e.preventDefault();
        this.props.onSearchEnter();
      }
    }
  },

  handleHelpClick(e) {
    console.log("Help button clicked!");
    e.preventDefault();
    actions.showHelp();
  },

  render() {
    const helpButton = 
      <i className="fa fa-question-circle fa-lg" style={Styles.helpButton} 
          title="Open Tabli Usage Manual" onClick={this.handleHelpClick}></i>;
    return (
      <div style={Styles.headerContainer}>
        <input style={Styles.searchInput} type="text" ref="searchInput" id="searchBox" placeholder="Search..." 
          onChange={this.handleChange} onKeyDown={this.handleKeyDown} 
          title="Search Page Titles and URLs"
          />
        {helpButton}
      </div>
    );  
  }
});

export default SearchBar;