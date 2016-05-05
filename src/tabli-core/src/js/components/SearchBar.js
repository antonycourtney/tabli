import * as React from 'react';
import Styles from './styles';

import * as Constants from './constants';
import * as actions from '../actions';
import * as _ from 'lodash';
import * as Util from './util';
import HeaderButton from './HeaderButton';

const SearchBar = React.createClass({
  handleChange() {
    const searchStr = this.searchInputRef.value;
    this.props.onSearchInput(searchStr);
  },

  handleKeyDown(e) {
    // console.log('handleKeyDown: ', _.omit(e, _.isObject));
    if ((e.keyCode === Constants.KEY_F1) ||
        (e.keyCode === Constants.KEY_QUESTION && e.ctrlKey && e.shiftKey)) {
      e.preventDefault();
      actions.showHelp();
    }

    const searchUp = (byPage) => {
      if (this.props.onSearchUp) {
        e.preventDefault();
        this.props.onSearchUp(byPage);
      }      
    };

    const searchDown = (byPage) => {
      if (this.props.onSearchDown) { 
        e.preventDefault();
        this.props.onSearchDown(byPage);
      }
    };

    if ((!e.ctrlKey && e.keyCode === Constants.KEY_UP) || 
        (e.ctrlKey && !e.shiftKey && e.keyCode === Constants.KEY_P)) {
      searchUp(false);
    }
    if ((e.ctrlKey && e.keyCode === Constants.KEY_UP) || 
        (e.ctrlKey && e.shiftKey && e.keyCode === Constants.KEY_P)) {
      searchUp(true);
    }

    if ((!e.ctrlKey && e.keyCode === Constants.KEY_DOWN) ||
        (e.ctrlKey && !e.shiftKey && e.keyCode === Constants.KEY_N)) {
      searchDown(false);
    }

    if ((e.ctrlKey && e.keyCode === Constants.KEY_DOWN) ||
        (e.ctrlKey && e.shiftKey && e.keyCode === Constants.KEY_N)) {
      searchDown(true);
    }

    if (e.keyCode === Constants.KEY_TAB) {
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

    if (e.keyCode === Constants.KEY_ENTER) {
      if (this.props.onSearchEnter) {
        e.preventDefault();
        this.props.onSearchEnter(this.searchInputRef);
      }
    }

    if (e.keyCode === Constants.KEY_ESC) {
      if (this.props.onSearchExit) {
        const searchStr = this.searchInputRef.value;
        if (!searchStr || searchStr.length === 0) {
          e.preventDefault();
          this.props.onSearchExit();
        }
      }
    }
  },

  handleHelpClick(e) {
    console.log('Help button clicked!');
    e.preventDefault();
    actions.showHelp();
  },

  handlePopoutClick(e) {
    console.log('Popout button clicked!');
    actions.showPopout(this.props.winStore);
  },

  setInputRef(ref) {
    this.searchInputRef = ref;
    if (this.props.setInputRef) {
      this.props.setInputRef(ref);
    }
  },

  render() {
    const popoutButton = (
      <HeaderButton className="popoutButton" baseStyle={Styles.headerButton}
        visible={true}
        title="Tabli Popout Window"
        onClick={this.handlePopoutClick}
      />);

    const helpButton = (
      <span className="fa fa-question-circle fa-lg" style={Styles.helpButton}
        title="Open Tabli Usage Manual" onClick={this.handleHelpClick}
      ></span>);
    return (
      <div style={Styles.headerContainer}>
        {popoutButton}
        <input style={Styles.searchInput} type="search" ref={this.setInputRef} id="searchBox" placeholder="Search..."
          onChange={this.handleChange} onKeyDown={this.handleKeyDown}
          title="Search Page Titles and URLs"
        />
        {helpButton}
      </div>
    );
  },
});

export default SearchBar;
