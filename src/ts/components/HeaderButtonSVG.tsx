import * as React from 'react';
import { useContext } from 'react';
import {
    HeaderButtonProps,
    HeaderButton,
    headerButtonSpacer
} from './HeaderButton';
import { HEADER_BUTTON_SIZE } from './constants';
import { ThemeContext, Theme } from './themeContext';
import { css, cx } from 'emotion';
import * as styles from './cssStyles';

interface HeaderButtonSVGProps extends HeaderButtonProps {
    svgElem: JSX.Element;
    svgClassName?: string;
}

const svgContainerStyle = (theme: Theme) => css`
    width: ${HEADER_BUTTON_SIZE + 'px'};
    height: ${HEADER_BUTTON_SIZE + 'px'};
    overflow: hidden;
    fill: ${theme.headerButtonColor};
    &:hover {
        fill: ${theme.headerButtonHover};
    }
`;

const baseStyle = (theme: Theme) => css`
    cursor: default;
    padding: 0;
    display: flex;
    &:focus {
        outline: 0;
    }
`;

const buttonStyle = (theme: Theme, className: string | undefined) =>
    cx(styles.headerButton, baseStyle(theme), className);

export const HeaderButtonSVG: React.FunctionComponent<HeaderButtonSVGProps> = ({
    svgElem,
    className,
    title,
    visible,
    onClick,
    svgClassName
}: HeaderButtonSVGProps) => {
    const theme = useContext(ThemeContext);

    const handleClick = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        if (visible) {
            onClick(event);
            event.stopPropagation();
        }
    };
    /* We render a LOT of these, and React profiler indicates we're spending a lot of time here
     * and mostly visible will be false so let's try to fast path the non-visible case with
     * a simple spacer
     */
    if (!visible) {
        return headerButtonSpacer;
    }

    return (
        <div
            role="button"
            className={buttonStyle(theme, className)}
            title={title}
            onClick={handleClick}
        >
            <div className={cx(svgContainerStyle(theme), svgClassName)}>
                {svgElem}
            </div>
        </div>
    );
};
