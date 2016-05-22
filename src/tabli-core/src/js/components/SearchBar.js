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

  handleLogoClick(e) {
    console.log("Logo was clicked!");
  },

  setInputRef(ref) {
    this.searchInputRef = ref;
    if (this.props.setInputRef) {
      this.props.setInputRef(ref);
    }
  },

  render() {
    /* <span className="caret"></span> */
/*
    const menuButton = (
      <button type="button"
        className="btn btn-default btn-sm dropdown-toggle"
        data-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false"
        title="Open Tabli Menu"
        onClick={this.handleLogoClick}>
        <div className="inline-block tabli-logo-icon"></div>
        <span className="caret"></span>
      </button>
    );
*/

    const menuButton = (
      <button type="button"
        className="btn btn-default btn-xs dropdown-toggle"
        data-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false"
        title="Open Tabli Menu"
        onClick={this.handleLogoClick}>
        <span className="glyphicon glyphicon-menu-hamburger" aria-hidden="true"></span>
      </button>
    );

/*           <div className="popout-icon"></div> */

    const popoutButton = (
        <button type="button" className="btn btn-default btn-xs"
          title="Open Tabli Popout Window"
          onClick={this.handlePopoutClick}>
          <i className="fa fa-external-link fa-rotate-270" aria-hidden="true"></i>
        </button>
      );

    if (!this.props.isPopout) {
      // TODO...choose popout or pop-back button here
    }

/*       <img src="../images/triangle-small-4-01.png" /> */
    const expandAllButton = (
      <button type="button" className="btn btn-default btn-xs"
        title="Expand/Collapse All Window Summaries"
        onClick={this.handleExpandToggleClick}>
        <span className="glyphicon glyphicon-collapse-down" aria-hidden="true"></span>
      </button>
    );

/* <span className="glyphicon glyphicon-copy" aria-hidden="true"></span> */

    const copyButton = (
      <button type="button" className="btn btn-default btn-xs"
        title="Copy all windows to clipboard"
        onClick={this.handleCopyClick}>
        <i className="fa fa-clipboard" aria-hidden="true"></i>
      </button>
    );


/*
 TODO: replace with menu / dropdown item
    const helpButton = (
      <span className="fa fa-question-circle fa-lg" style={Styles.helpButton}
        title="Open Tabli Usage Manual" onClick={this.handleHelpClick}
      ></span>);
*/
    const dropdownMenu = (
      <ul className="dropdown-menu">
        <li><a href="#">About Tabli</a></li>
        <li><a href="#">Help</a></li>
        <li><a href="#">Leave Feedback</a></li>
      </ul>
    )


    return (
      <div className="header-container">
        {menuButton}
        <div className="header-toolbar">
          <div className="btn-group" role="group">
            {popoutButton}
          </div>
          <input className="search-input" type="search" ref={this.setInputRef} id="searchBox" placeholder="Search..."
            onChange={this.handleChange} onKeyDown={this.handleKeyDown}
            title="Search Page Titles and URLs"
          />
          <div className="btn-group" role="group">
            {expandAllButton}
            {copyButton}
          </div>
        </div>
        {dropdownMenu}
      </div>
    );
  },
});

export default SearchBar;
