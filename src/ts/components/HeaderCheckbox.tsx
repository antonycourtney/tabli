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

    // Determine colors based on checked state and theme
    const iconColor = checked ? theme.revertColor : theme.foreground;
    const fill = checked ? iconColor : 'none';
    const strokeWidth = checked ? 0 : 1;

    return (
        <button
            className={cx(bookmarkButtonStyle, !checked && extraUncheckedStyle)}
            title={title}
            onClick={onClick}
            type="button"
        >
            <Bookmark
                size={14}
                color={iconColor}
                fill={fill}
                strokeWidth={strokeWidth}
            />
        </button>
    );
};

export default HeaderCheckbox;
