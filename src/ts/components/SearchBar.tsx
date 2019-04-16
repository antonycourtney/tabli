import * as log from 'loglevel'; // eslint-disable-line no-unused-vars
import * as React from 'react';
import * as Constants from './constants';
import * as actions from '../actions';
import * as styles from './cssStyles';
import { ThemeContext } from './themeContext';
import { css, cx } from 'emotion';
import MenuButton from './menuButton';
import { StateRef } from 'oneref';
import TabManagerState from '../tabManagerState';
import { useRef, useContext, Ref, MutableRefObject } from 'react';
import { mkUrl } from '../utils';

const toolbarOuterContainerStyle = css`
    display: flex;
    align-items: center;
    margin-top: 8px;
    margin-bottom: 8px;
    min-width: 340px;
    justify: center;
`;
const toolbarInnerContainerStyle = css`
    display: flex;
    justify-content: space-around;
    width: 340px;
`;
const searchInputStyle = css`
    border: 1px solid #ccc;
    border-radius: 3px;
    width: 200px;
    max-width: 200px;
    margin-left: 8px;
    margin-right: 12px;
    flex: 0 0 auto;
    height: 22px;
    line-height: 1.42;
    padding: 1px;
    font-size: 12px;
`;

export const expandAllIconStyle = css({
    WebkitMaskImage: mkUrl('images/triangle-small-1-01.png')
});

interface SearchBarProps {
    onSearchInput: (s: string) => void;
    onSearchUp: (byPage: boolean) => void;
    onSearchDown: (byPage: boolean) => void;
    onSearchEnter: (ref: MutableRefObject<HTMLInputElement | null>) => void;
    onSearchExit: () => void;
    onSearchExpandToggle: () => void;
    onShowPreferences: () => void;
    isPopout: boolean;
    searchInputRef: MutableRefObject<HTMLInputElement | null>;
    stateRef: StateRef<TabManagerState>;
}

const SearchBar: React.FunctionComponent<SearchBarProps> = ({
    stateRef,
    onSearchInput,
    onSearchUp,
    onSearchDown,
    onSearchEnter,
    onSearchExit,
    onSearchExpandToggle,
    isPopout,
    searchInputRef
}: SearchBarProps) => {
    const theme = useContext(ThemeContext);

    const handleChange = () => {
        if (searchInputRef.current) {
            const searchStr = searchInputRef.current.value;
            onSearchInput(searchStr);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (
            e.keyCode === Constants.KEY_F1 ||
            (e.keyCode === Constants.KEY_QUESTION && e.ctrlKey && e.shiftKey)
        ) {
            e.preventDefault();
            actions.showHelp();
        }

        const searchUp = (byPage: boolean) => {
            if (onSearchUp) {
                e.preventDefault();
                onSearchUp(byPage);
            }
        };

        const searchDown = (byPage: boolean) => {
            if (onSearchDown) {
                e.preventDefault();
                onSearchDown(byPage);
            }
        };

        if (
            (!e.ctrlKey && e.keyCode === Constants.KEY_UP) ||
            (e.ctrlKey && !e.shiftKey && e.keyCode === Constants.KEY_P)
        ) {
            searchUp(false);
        }
        if (
            (e.ctrlKey && e.keyCode === Constants.KEY_UP) ||
            (e.ctrlKey && e.shiftKey && e.keyCode === Constants.KEY_P)
        ) {
            searchUp(true);
        }

        if (
            (!e.ctrlKey && e.keyCode === Constants.KEY_DOWN) ||
            (e.ctrlKey && !e.shiftKey && e.keyCode === Constants.KEY_N)
        ) {
            searchDown(false);
        }

        if (
            (e.ctrlKey && e.keyCode === Constants.KEY_DOWN) ||
            (e.ctrlKey && e.shiftKey && e.keyCode === Constants.KEY_N)
        ) {
            searchDown(true);
        }

        if (e.keyCode === Constants.KEY_TAB) {
            // We need to determine if it was forward or backwards tab:
            // N.B. we still try and use e.ctrlKey to determine paged
            // nav, but that key combo consumed by Chrome before we see it...
            if (onSearchUp && onSearchDown) {
                e.preventDefault();
                if (e.shiftKey) {
                    onSearchUp(e.ctrlKey);
                } else {
                    onSearchDown(e.ctrlKey);
                }
            }
        }

        if (e.keyCode === Constants.KEY_ENTER) {
            if (onSearchEnter) {
                e.preventDefault();
                onSearchEnter(searchInputRef);
            }
        }

        // For some odd reason, semicolon gives a keyCode of 186 (?)
        // but key seems to work so use it
        if (e.key === ';') {
            if (onSearchExpandToggle) {
                e.preventDefault();
                onSearchExpandToggle();
            }
        }

        if (e.keyCode === Constants.KEY_ESC) {
            if (onSearchExit && searchInputRef.current) {
                const searchStr = searchInputRef.current.value;
                if (!searchStr || searchStr.length === 0) {
                    e.preventDefault();
                    onSearchExit();
                }
            }
        }
    };

    const handlePopoutClick = (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
        if (isPopout) {
            actions.hidePopout(stateRef);
        } else {
            actions.showPopout(stateRef);
        }
    };

    const handleExpandToggleClick = () => {
        actions.toggleExpandAll(stateRef);
    };

    const handleCopyClick = () => {
        actions.copyWindowsToClipboard(stateRef);
    };

    // We'll rotate 270 degrees to point upper left for popout,
    // 90 degrees to point lower right for pop-in:
    const popImgName = isPopout ? 'popin' : 'popout';
    const popImgPath = 'images/' + popImgName + '.png';
    const popIconStyle = css({
        WebkitMaskImage: mkUrl(popImgPath)
    });

    const popVerb = isPopout ? 'Hide' : 'Show';
    const popDesc = popVerb + ' Tabli Popout Window';

    const popoutButton = (
        <button
            className={styles.toolbarButton(theme)}
            title={popDesc}
            onClick={handlePopoutClick}
        >
            <div
                className={cx(styles.toolbarButtonIcon(theme), popIconStyle)}
            />
        </button>
    );

    const expandAllButton = (
        <button
            className={styles.toolbarButton(theme)}
            title="Expand/Collapse All Window Summaries"
            onClick={handleExpandToggleClick}
        >
            <div
                className={cx(
                    styles.toolbarButtonIcon(theme),
                    expandAllIconStyle
                )}
            />
        </button>
    );

    const copyButton = (
        <button
            className={styles.toolbarButton(theme)}
            title="Copy All to Clipboard"
            onClick={handleCopyClick}
        >
            <i className="fa fa-clipboard" aria-hidden="true" />
        </button>
    );

    return (
        <div className={toolbarOuterContainerStyle}>
            <div className={toolbarInnerContainerStyle}>
                <MenuButton stateRef={stateRef} />
                {popoutButton}
                <input
                    className={searchInputStyle}
                    type="search"
                    tabIndex={1}
                    ref={searchInputRef}
                    id="searchBox"
                    placeholder="Search..."
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    title="Search Page Titles and URLs"
                />
                {expandAllButton}
                {copyButton}
            </div>
        </div>
    );
};

/*
class SearchBar extends React.Component {
  static contextType = ThemeContext

  handleChange = () => {
    const searchStr = this.searchInputRef.value
    this.props.onSearchInput(searchStr)
  };

  handleKeyDown = (e) => {
    if ((e.keyCode === Constants.KEY_F1) ||
      (e.keyCode === Constants.KEY_QUESTION && e.ctrlKey && e.shiftKey)) {
      e.preventDefault()
      actions.showHelp()
    }

    const searchUp = (byPage) => {
      if (this.props.onSearchUp) {
        e.preventDefault()
        this.props.onSearchUp(byPage)
      }
    }

    const searchDown = (byPage) => {
      if (this.props.onSearchDown) {
        e.preventDefault()
        this.props.onSearchDown(byPage)
      }
    }

    if ((!e.ctrlKey && e.keyCode === Constants.KEY_UP) ||
      (e.ctrlKey && !e.shiftKey && e.keyCode === Constants.KEY_P)) {
      searchUp(false)
    }
    if ((e.ctrlKey && e.keyCode === Constants.KEY_UP) ||
      (e.ctrlKey && e.shiftKey && e.keyCode === Constants.KEY_P)) {
      searchUp(true)
    }

    if ((!e.ctrlKey && e.keyCode === Constants.KEY_DOWN) ||
      (e.ctrlKey && !e.shiftKey && e.keyCode === Constants.KEY_N)) {
      searchDown(false)
    }

    if ((e.ctrlKey && e.keyCode === Constants.KEY_DOWN) ||
      (e.ctrlKey && e.shiftKey && e.keyCode === Constants.KEY_N)) {
      searchDown(true)
    }

    if (e.keyCode === Constants.KEY_TAB) {
      // We need to determine if it was forward or backwards tab:
      // N.B. we still try and use e.ctrlKey to determine paged
      // nav, but that key combo consumed by Chrome before we see it...
      if (this.props.onSearchUp && this.props.onSearchDown) {
        e.preventDefault()
        if (e.shiftKey) {
          this.props.onSearchUp(e.ctrlKey)
        } else {
          this.props.onSearchDown(e.ctrlKey)
        }
      }
    }

    if (e.keyCode === Constants.KEY_ENTER) {
      if (this.props.onSearchEnter) {
        e.preventDefault()
        this.props.onSearchEnter(this.searchInputRef)
      }
    }

    // For some odd reason, semicolon gives a keyCode of 186 (?)
    // but key seems to work so use it
    if (e.key === ';') {
      if (this.props.onSearchExpandToggle) {
        e.preventDefault()
        this.props.onSearchExpandToggle()
      }
    }

    if (e.keyCode === Constants.KEY_ESC) {
      if (this.props.onSearchExit) {
        const searchStr = this.searchInputRef.value
        if (!searchStr || searchStr.length === 0) {
          e.preventDefault()
          this.props.onSearchExit()
        }
      }
    }
  };

  handlePopoutClick = (e) => {
    if (this.props.isPopout) {
      actions.hidePopout(this.props.winStore, this.props.storeRef)
    } else {
      actions.showPopout(this.props.winStore, this.props.storeRef)
    }
  };

  handleExpandToggleClick = () => {
    actions.toggleExpandAll(this.props.winStore, this.props.storeRef)
  };

  handleCopyClick = () => {
    const openWindows = this.props.winStore.getTabWindowsByType('normal')

    var cmpFn = utilswindowCmp(this.props.winStore.currentWindowId)
    var sortedWindows = openWindows.sort(cmpFn)

    const s = sortedWindows.reduce((rs, tw) => rs + '\n\n' + tw.exportStr(), '')

    copyTextToClipboard(s)
  };

  setInputRef = (ref) => {
    this.searchInputRef = ref
    if (this.props.setInputRef) {
      this.props.setInputRef(ref)
    }
  };

  render () {
    let theme = this.context

    // We'll rotate 270 degrees to point upper left for popout,
    // 90 degrees to point lower right for pop-in:
    const popImgName = this.props.isPopout ? 'popin' : 'popout'
    const popImgPath = 'images/' + popImgName + '.png'
    const popIconStyle = css({
      WebkitMaskImage: mkUrl(popImgPath)
    })

    const popVerb = this.props.isPopout ? 'Hide' : 'Show'
    const popDesc = popVerb + ' Tabli Popout Window'

    const popoutButton = (
      <button
        className={styles.toolbarButton(theme)}
        title={popDesc}
        onClick={this.handlePopoutClick}>
        <div className={cx(styles.toolbarButtonIcon(theme), popIconStyle)}/>
      </button>
    )

    const expandAllButton = (
      <button
        className={styles.toolbarButton(theme)}
        title='Expand/Collapse All Window Summaries'
        onClick={this.handleExpandToggleClick}>
        <div className={cx(styles.toolbarButtonIcon(theme), expandAllIconStyle)}/>
      </button>
    )

    const copyButton = (
      <button
        className={styles.toolbarButton(theme)}
        title='Copy All to Clipboard'
        onClick={this.handleCopyClick}>
        <i className='fa fa-clipboard' aria-hidden='true' />
      </button>
    )

    return (
      <div className={toolbarOuterContainerStyle}>
        <div className={toolbarInnerContainerStyle}>
          <MenuButton winStore={this.props.winStore} storeRef={this.props.storeRef} />
          {popoutButton}
          <input
            className={searchInputStyle}
            type='search'
            tabIndex={1}
            ref={this.setInputRef}
            id='searchBox'
            placeholder='Search...'
            onChange={this.handleChange}
            onKeyDown={this.handleKeyDown}
            title='Search Page Titles and URLs' />
          {expandAllButton}
          {copyButton}
        </div>
      </div>
    )
  }
}
SearchBar.contextType = ThemeContext
*/

export default SearchBar;
