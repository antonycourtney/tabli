import * as React from 'react';
import { useContext } from 'react';
import {
    HeaderButtonProps,
    HeaderButton,
    headerButtonSpacer,
} from './HeaderButton';
import { HEADER_BUTTON_SIZE } from './constants';
import { ThemeContext, Theme } from './themeContext';
import { css, cx } from '@emotion/css';
import * as styles from './cssStyles';
import { TooltipWrapper } from './ui/TooltipWrapper';

export interface HeaderButtonSVGProps {
    className?: string;
    title?: string;
    onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
    svgElem: JSX.Element;
    svgClassName?: string;
    visible?: boolean;
}

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
    cursor: pointer;
    padding: 0;
    display: flex;
    &:focus {
        outline: 0;
    }
`;

const buttonStyle = (theme: Theme, className: string | undefined) =>
    cx(styles.headerButton, baseStyle(theme), className);

interface SVGIconProps {
    svgElem: JSX.Element;
    svgClassName?: string;
    theme: Theme;
}

const SVGIcon = ({ svgElem, svgClassName, theme }: SVGIconProps) => {
    return (
        <div className={cx(svgContainerStyle(theme), svgClassName)}>
            {svgElem}
        </div>
    );
};

export const HeaderButtonSVG = ({
    svgElem,
    className,
    title,
    visible: maybeVisible,
    onClick,
    svgClassName,
}: HeaderButtonSVGProps) => {
    const theme = useContext(ThemeContext);
    const visible = maybeVisible ?? true;

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

    const button = (
        <div
            role="button"
            className={buttonStyle(theme, className)}
            {...clickProps}
        >
            <SVGIcon
                svgElem={svgElem}
                svgClassName={svgClassName}
                theme={theme}
            />
        </div>
    );

    // Only wrap with tooltip if title is provided
    if (title) {
        return <TooltipWrapper tip={title}>{button}</TooltipWrapper>;
    }

    return button;
};
