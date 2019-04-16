import * as React from 'react';
import { mkUrl } from '../utils';
import { cx, css } from 'emotion';
import { ThemeContext, Theme } from './themeContext';
import * as styles from './cssStyles';
import { useContext } from 'react';

const expandIcon = mkUrl('images/triangle-small-4-01.png');
const collapseIcon = mkUrl('images/triangle-small-1-01.png');

const baseStyle = (theme: Theme) => css`
    background-color: ${theme.headerButtonColor};
    &:hover {
        background-color: ${theme.headerButtonHover};
    }
`;
const expandedStyle = (theme: Theme) =>
    cx(styles.headerButton, css({ maskImage: collapseIcon }), baseStyle(theme));
const collapsedStyle = (theme: Theme) =>
    cx(styles.headerButton, css({ maskImage: expandIcon }), baseStyle(theme));

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
    const style = expanded ? expandedStyle : collapsedStyle;
    return <button className={style(theme)} onClick={handleClicked} />;
};

export default ExpanderButton;
