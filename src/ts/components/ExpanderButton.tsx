import * as React from 'react';
import { mkUrl } from '../utils';
import { cx, css } from 'emotion';
import { ThemeContext, Theme } from './themeContext';
import * as styles from './cssStyles';
import * as svg from './svg';
import { useContext } from 'react';

const expandIcon = mkUrl('images/triangle-small-4-01.png');
const collapseIcon = mkUrl('images/triangle-small-1-01.png');

const baseStyle = (theme: Theme) => css`
    padding: 0;
    display: flex;
    &:focus {
        outline: 0;
    }
`;

const expanderButtonStyle = (theme: Theme) =>
    cx(styles.headerButton, baseStyle(theme));

const headerButtonSize = 16;
const expanderSVGContainerStyle = (theme: Theme) => css`
    width: ${headerButtonSize + 'px'};
    height: ${headerButtonSize + 'px'};
    overflow: hidden;
    fill: ${theme.headerButtonColor};
    &:hover {
        fill: ${theme.headerButtonHover};
    }
`;

interface ExpanderButtonProps {
    expanded: boolean;
    onClick: (expanded: boolean) => void;
}

// expand / contract button for a window
const ExpanderButton: React.FunctionComponent<ExpanderButtonProps> = ({
    expanded,
    onClick
}: ExpanderButtonProps) => {
    const theme = useContext(ThemeContext);
    const handleClicked = (
        event: React.MouseEvent<HTMLElement, MouseEvent>
    ) => {
        var nextState = !expanded;
        onClick(nextState);
        event.stopPropagation();
    };
    const iconSVG = expanded ? svg.expandLess : svg.expandMore;

    const testStyle = css({
        backgroundColor: 'yellow',
        width: 14,
        height: 14,
        overflow: 'hidden'
    });
    return (
        <button className={expanderButtonStyle(theme)} onClick={handleClicked}>
            <div className={expanderSVGContainerStyle(theme)}>{iconSVG}</div>
        </button>
    );
};

export default ExpanderButton;
