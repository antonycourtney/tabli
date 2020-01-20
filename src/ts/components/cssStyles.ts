import * as Constants from './constants';
import { mkUrl } from '../utils';
import { Theme } from './themeContext';
/**
 * Wrappers around styles with explicit calls to css()
 * for easier use and re-use with emotion and cx().
 *
 * Eventually want to migrate all shared style defs
 * to here
 */

import { css, cx } from 'emotion';
import { Layout } from './LayoutContext';
export const rowItemsFixedWidth = css`
    display: inline-flex;
    align-items: center;
    flex: 0 0 auto;
`;
export const activeSpan = css({
    fontWeight: 'bold'
});
export const tabTitle = css({
    minWidth: Constants.TAB_TITLE_MIN_WIDTH,
    color: 'inherit',
    textDecoration: 'none',
    flexGrow: 1,
    '&:hover': {
        color: 'inherit',
        textDecoration: 'none'
    },
    cursor: 'default'
});
export const simpleTabTitle = css({
    width: Constants.SIMPLE_TAB_TITLE_WIDTH
});
export const audibleIcon = css({
    WebkitMaskImage: mkUrl('images/Multimedia-64.png'),
    backgroundColor: '#505050'
});
export const tabItem = (theme: Theme, layout: Layout) =>
    css({
        borderRadius: 3,
        height: Constants.TAB_ITEM_HEIGHT,
        maxHeight: Constants.TAB_ITEM_HEIGHT,
        paddingLeft: 3,
        paddingRight: 3,
        paddingTop: layout.tabPaddingTop,
        paddingBottom: layout.tabPaddingBottom,
        marginLeft: 6,
        marginRight: 6,
        marginTop: layout.tabMarginTop,
        marginBottom: layout.tabMarginBottom,
        display: 'flex',
        alignItems: 'center',
        border:
            '1px solid #cacaca00' /* transparent to avoid jitter on hover */,
        '&:hover': {
            backgroundColor: theme.tabItemHover
        }
    });
export const tabItemSelected = (theme: Theme) =>
    css({
        border: '1px solid ' + theme.windowSelectedBorder // #cacaca
    });

// Styling to denote the active tab in each window:
export const tabItemActive = (theme: Theme) =>
    css({
        border: '1px solid ' + theme.tabItemHover,
        boxShadow: '0px 0px 3px 1px ' + theme.tabItemHover
    });

export const tabItemDragging = (theme: Theme) =>
    css({
        border: '1px solid #cacaca',
        backgroundColor: theme.tabItemHover
    });

export const tabItemDropOver = css({
    borderBottom: '2px solid #333333'
});
export const headerButton = css({
    outline: 'none',
    border: 'none',
    backgroundRepeat: 'no-repeat',
    width: 16,
    height: 16,
    marginLeft: 3,
    marginRight: 3,
    flex: 'none'
});
export const headerCheckBoxInput = css({
    width: 10,
    height: 10
});
export const headerCheckboxContainer = cx(
    headerButton,
    css({
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    })
);

export const noWrap = css({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
});
export const windowHeader = (theme: Theme, layout: Layout) =>
    css({
        backgroundColor: theme.headerBackground,
        borderBottom: '1px solid #bababa',
        height: layout.windowHeaderHeight,
        maxHeight: layout.windowHeaderHeight,
        paddingLeft: 3,
        paddingRight: 3,
        // marginBottom: 3,
        display: 'inline-flex',
        // justifyContent: 'space-between',
        alignItems: 'center',
        flexGrow: 1
    });
export const windowManagedButton = css({
    WebkitMaskImage: mkUrl('images/Status-9.png'),
    backgroundColor: '#7472ff'
});
export const open = css({});
export const closed = (theme: Theme) =>
    css({
        color: theme.closedGray
    });
export const text = css({
    fontSize: 12,
    marginTop: 'auto',
    marginBottom: 'auto',
    marginLeft: 3
});
export const windowTitle = css({
    fontWeight: 'bold',
    minWidth: Constants.WINDOW_TITLE_MIN_WIDTH,

    /* NOPE -- let flexbox do it: maxWidth: Constants.WINDOW_TITLE_MAX_WIDTH, */
    flexGrow: 1
});
export const windowTitleInput = css({
    fontWeight: 'bold',
    minWidth: Constants.WINDOW_TITLE_MIN_WIDTH,
    flexGrow: 1
});
export const spacer = css({
    // backgroundColor: 'red', // for debugging
    // height: 8, // for debugging
    flex: 1
});
export const favIcon = css({
    width: 16,
    height: 16,
    marginRight: 4,
    marginLeft: 2,
    flex: 'none'
});
export const emptyFavIcon = css({
    width: 18,
    marginRight: 3,
    WebkitMaskImage: mkUrl('images/Files-26.png'),
    backgroundColor: '#969696'
});
export const favIconClosed = css({
    WebkitFilter: 'grayscale(1) opacity(50%)'
});
export const imageButtonClosed = (theme: Theme) =>
    css({
        backgroundColor: theme.closedGray
    });
export const tabList = css({
    marginLeft: 0,
    marginTop: 4,
    marginBottom: 4
});
export const simpleTabContainer = css({
    width: 250,
    marginLeft: 8,
    marginRight: 8,
    paddingLeft: 4,
    paddingRight: 4,
    paddingTop: 4,
    paddingBottom: 4,
    border: '1px solid #bababa',
    borderRadius: 3
});
export const tabWindowFocused = (theme: Theme) =>
    css({
        boxShadow: '0px 0px 5px 2px ' + theme.windowBorder
    });

export const tabWindow = (theme: Theme) =>
    css({
        border: '2px solid ' + theme.windowBorder,
        borderRadius: 5,
        marginBottom: 8,
        minWidth: Constants.WINDOW_MIN_WIDTH,
        maxWidth: Constants.WINDOW_MAX_WIDTH,
        display: 'flex',
        flexDirection: 'column'
    });
export const expandablePanel = (layout: Layout) =>
    css({
        width: '100%',
        position: 'relative',
        minHeight: layout.windowHeaderHeight,
        overflow: 'hidden'
    });
export const dialogInfoContents = css({
    marginLeft: 10,
    marginTop: 4,
    marginBottom: 0
});
export const dialogButtonRow = css({
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexShrink: 0,
    marginRight: 22
});
export const centerContents = css({
    margin: 'auto'
}); // Note explicit global css class name windowHeaderHoverContainer there
// Due to limitation of nested class selectors with composition;
// see https://emotion.sh/docs/nested for more info.

export const headerHoverVisible = css`
    visibility: hidden;
    .windowHeaderHoverContainer:hover & {
        visibility: visible;
    }
`;
export const hidden = css`
    visibility: hidden;
`;
export const visible = css`
    visibility: visible;
`;
export const checkStyle = (theme: Theme) => css`
    fill: ${theme.revertColor};
    &:hover {
        fill: ${theme.revertHover};
    }
`;
export const closeButtonBaseStyle = (theme: Theme) => css`
    -webkit-mask-image: url('../images/Interface-77.png');
    background-color: ${theme.headerButtonColor};
    &:hover {
        -webkit-mask-image: url('../images/Interface-74.png');
        background-color: ${theme.headerButtonHover};
        border-radius: 50%;
        box-shadow: 0 0 0 5px ${theme.tabCloseHoverBackground} inset,
            0 0 0 2px ${theme.tabCloseHoverBackground};
    }
`;
export const headerCloseButton = (theme: Theme) =>
    cx(headerButton, closeButtonBaseStyle(theme), headerHoverVisible);
export const modalCloseButton = (theme: Theme) =>
    cx(headerButton, closeButtonBaseStyle(theme));
const titleBaseStyle = cx(text, noWrap, windowTitle);
export const titleOpen = cx(titleBaseStyle, open);
export const titleClosed = (theme: Theme) => cx(titleBaseStyle, closed(theme));
export const toolbarButtonSize = 26;
export const toolbarButton = (theme: Theme) => css`
    width: ${toolbarButtonSize + 'px'};
    width: ${toolbarButtonSize + 'px'};
    padding: 0px;
    font-size: 12px;
    line-height: 1.5;
    border-radius: 3px;
    border: 1px solid #ccc;
    &:hover {
        background-color: ${theme.buttonHover};
    }
    background-color: ${theme.buttonBackground};
`;
export const toolbarIconSize = 16;
export const toolbarButtonIconContainer = (theme: Theme) =>
    css({
        width: toolbarIconSize,
        height: toolbarIconSize
    });
export const toolbarSVGIconSize = toolbarButtonSize - 2;
export const toolbarButtonSVGIconContainer = (theme: Theme) =>
    css({
        width: toolbarSVGIconSize,
        height: toolbarSVGIconSize,
        fill: theme.foreground
    });

export const toolbarButtonIconMaskBG = (theme: Theme) =>
    css({
        backgroundColor: theme.foreground
    });

export const toolbarButtonIconMaskImage = (theme: Theme, path: string) =>
    cx(
        toolbarButtonIconContainer(theme),
        toolbarButtonIconMaskBG(theme),
        css({
            margin: '1px 5px',
            WebkitMaskImage: mkUrl(path)
        })
    );

export const expandAllIconStyle = (theme: Theme) =>
    toolbarButtonIconMaskImage(theme, 'images/triangle-small-1-01.png');
