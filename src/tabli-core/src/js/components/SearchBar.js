import * as React from 'react';
import Styles from './styles';

import * as Constants from './constants';
import * as actions from '../actions';
import * as _ from 'lodash';
import * as Util from './util';
import HeaderButton from './HeaderButton';

// The dreaded routine copied from SO
// http://stackoverflow.com/a/18455088/3272482
function copyTextToClipboard(text) {
  var copyFrom = document.createElement("textarea");
  copyFrom.textContent = text;
  var body = document.getElementsByTagName('body')[0];
  body.appendChild(copyFrom);
  copyFrom.select();
  document.execCommand('copy');
  body.removeChild(copyFrom);
}

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
    e.preventDefault();
    actions.showHelp();
  },

  handleAboutClick(e) {
    e.preventDefault();
    actions.showAbout();
  },

  handlePopoutClick(e) {
    if (this.props.isPopout) {
      actions.hidePopout(this.props.winStore,this.props.storeUpdateHandler);
    } else {
      actions.showPopout(this.props.winStore,this.props.storeUpdateHandler);
    }
  },

  handleReviewClick(e) {
    e.preventDefault();
    actions.showReview(this.props.winStore,this.props.storeUpdateHandler);
  },

  handleFeedbackClick(e) {
    e.preventDefault();
    actions.sendFeedback(this.props.winStore,this.props.storeUpdateHandler);
  },

  handleRelNotesClick(e) {
    e.preventDefault();
    actions.showRelNotes(this.props.winStore,this.props.storeUpdateHandler);
  },

  handleExpandToggleClick() {
    actions.toggleExpandAll(this.props.winStore,this.props.storeUpdateHandler);
  },

  handleCopyClick() {
    const openWindows = this.props.winStore.getTabWindowsByType('normal');

    var cmpFn = Util.windowCmp(this.props.winStore.currentWindowId);
    var sortedWindows = openWindows.sort(cmpFn);

    const s = sortedWindows.reduce((rs,tw) => rs + "\n\n" + tw.exportStr(),"");

    copyTextToClipboard(s);
  },

  setInputRef(ref) {
    this.searchInputRef = ref;
    if (this.props.setInputRef) {
      this.props.setInputRef(ref);
    }
  },

  render() {
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

    // We'll rotate 270 degrees to point upper left for popout,
    // 90 degrees to point lower right for pop-in:
    const popImgName = this.props.isPopout ? "popin" : "popout";
    const popImgPath = "../images/" + popImgName + ".png";

    const popVerb = this.props.isPopout ? "Hide" : "Show";
    const popDesc = popVerb + " Tabli Popout Window";

    const popoutButton = (
        <button type="button"
          className="btn btn-default btn-xs"
          title={popDesc}
          onClick={this.handlePopoutClick}>
          <img className="popout-img" src={popImgPath} />
        </button>
      );

    const expandAllButton = (
      <button type="button" className="btn btn-default btn-xs"
        title="Expand/Collapse All Window Summaries"
        onClick={this.handleExpandToggleClick}>
        <span className="glyphicon glyphicon-collapse-down" aria-hidden="true"></span>
      </button>
    );

    const copyButton = (
      <button id="copyButton" type="button" className="btn btn-default btn-xs"
        title="Copied!"
        onClick={this.handleCopyClick}>
        <i className="fa fa-clipboard" aria-hidden="true"></i>
      </button>
    );

    const dropdownMenu = (
      <ul className="dropdown-menu">
        <li><a className="help-button" href="#" onClick={this.handleHelpClick}>Help (Manual)</a></li>
        <li role="separator" className="divider"></li>
        <li><a href="#" onClick={this.handleAboutClick}>About Tabli</a></li>
        <li><a href="#" onClick={this.handleRelNotesClick}>Release Notes</a></li>
        <li role="separator" className="divider"></li>
        <li><a href="#" onClick={this.handleReviewClick}>Review Tabli</a></li>
        <li><a href="#" onClick={this.handleFeedbackClick}>Send Feedback</a></li>
      </ul>
    )

    return (
      <div className="header-container">
        <div className="header-toolbar">
            {menuButton}
            {popoutButton}
            {dropdownMenu}
          <input className="search-input" type="search" ref={this.setInputRef} id="searchBox" placeholder="Search..."
            onChange={this.handleChange} onKeyDown={this.handleKeyDown}
            title="Search Page Titles and URLs"
          />
          {expandAllButton}
          {copyButton}
        </div>
      </div>
    );
  },
});

export default SearchBar;
