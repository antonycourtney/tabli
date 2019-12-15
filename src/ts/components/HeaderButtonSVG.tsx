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

type HeaderButtonSVGProps = {
    className?: string;
    title?: string;
    onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
    svgElem: JSX.Element;
    svgClassName?: string;
} & typeof headerButtonSVGDefaultProps;

const headerButtonSVGDefaultProps = {
    visible: true
};

const svgContainerStyle = (theme: Theme) => css`
    width: ${HEADER_BUTTON_SIZE + 'px'};
    height: ${HEADER_BUTTON_SIZE + 'px'};
    display: flex;
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

export const HeaderButtonSVG = ({
    svgElem,
    className,
    title,
    visible,
    onClick,
    svgClassName
}: HeaderButtonSVGProps) => {
    const theme = useContext(ThemeContext);

    const handleClick = onClick
        ? (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
              if (visible) {
                  onClick(event);
                  event.stopPropagation();
              }
          }
        : null;
    /* We render a LOT of these, and React profiler indicates we're spending a lot of time here
     * and mostly visible will be false so let's try to fast path the non-visible case with
     * a simple spacer
     */
    if (!visible) {
        return headerButtonSpacer;
    }

    const clickProps = handleClick ? { onClick: handleClick } : {};

    return (
        <div
            role="button"
            className={buttonStyle(theme, className)}
            title={title}
            {...clickProps}
        >
            <div className={cx(svgContainerStyle(theme), svgClassName)}>
                {svgElem}
            </div>
        </div>
    );
};

HeaderButtonSVG.defaultProps = headerButtonSVGDefaultProps;
