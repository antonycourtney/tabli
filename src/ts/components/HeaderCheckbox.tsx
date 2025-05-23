/*
 * A Component wrapper around bookmark icon for use in WindowHeader and
 * TabItem. Shows filled bookmark when saved/checked, outline bookmark when unsaved/unchecked.
 */
import * as React from 'react';

import { cx, css } from '@emotion/css';
import * as styles from './cssStyles';
import { ThemeContext, Theme } from './themeContext';
import { useContext } from 'react';
import { Bookmark } from 'lucide-react';
import { TooltipWrapper } from './ui/TooltipWrapper';

// Configurable scale factor for bookmark icon height - increase to make taller
const BOOKMARK_HEIGHT_SCALE = 1.2; // 20% taller than square

const bookmarkButtonStyle = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    outline: 'none',
    border: 'none',
    background: 'transparent',
    height: 16,
    width: 16,
    marginLeft: 4,
    marginRight: 4,
    flex: 'none',
    cursor: 'pointer',
    padding: 0,
});

const bookmarkIconStyle = css({
    transform: `scaleY(${BOOKMARK_HEIGHT_SCALE})`,
});

const bookmarkButtonWithHoverStyle = (theme: any, checked: boolean) =>
    css({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        outline: 'none',
        border: 'none',
        background: 'transparent',
        height: 16,
        width: 16,
        marginLeft: 4,
        marginRight: 4,
        flex: 'none',
        cursor: 'pointer',
        padding: 0,
        '& svg': {
            transform: `scaleY(${BOOKMARK_HEIGHT_SCALE})`,
            color: checked ? theme.revertColor : theme.foreground,
            fill: checked ? theme.revertColor : 'none',
            stroke: checked ? 'none' : 'currentColor',
            strokeWidth: checked ? 0 : 1,
        },
        ...(checked
            ? {
                  '&:hover svg': {
                      color: theme.revertHover,
                      fill: theme.revertHover,
                      stroke: theme.revertHover,
                  },
              }
            : {
                  '&:hover svg': {
                      color: theme.headerButtonHover,
                      fill: theme.headerButtonHover,
                      stroke: theme.headerButtonHover,
                  },
              }),
    });

interface HeaderCheckboxProps {
    title: string;
    value: boolean;
    open?: boolean;
    extraUncheckedStyle?: string;
    onClick: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}

const HeaderCheckbox: React.FunctionComponent<HeaderCheckboxProps> = ({
    title,
    value,
    open,
    onClick,
    extraUncheckedStyle,
}: HeaderCheckboxProps) => {
    const theme = useContext(ThemeContext);
    const checked = !!value;

    // defaults to rendering in open state:
    const isOpen = open === undefined ? true : open;

    return (
        <TooltipWrapper tip={title}>
            <button
                className={cx(
                    bookmarkButtonWithHoverStyle(theme, checked),
                    !checked && extraUncheckedStyle,
                )}
                onClick={onClick}
                type="button"
            >
                <Bookmark size={14} />
            </button>
        </TooltipWrapper>
    );
};

export default HeaderCheckbox;
