/*
 * A Component wrapper around checkbox for use in WindowHeader and
 * TabItem. Wraps checkbox input in a div since the input component
 * doesn't obey proper css props like width and height, and swaps
 * input for an image when checked.
 */
import * as React from 'react';

import { cx, css } from 'emotion';
import * as styles from './cssStyles';
import { ThemeContext } from './themeContext';
import get from 'lodash/get';
import { useContext } from 'react';

const containerBaseStyle = css({
    display: 'flex',
    alignItems: 'center'
});
const containerStyle = cx(styles.headerButton, containerBaseStyle);

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
    extraUncheckedStyle
}: HeaderCheckboxProps) => {
    const theme = useContext(ThemeContext);
    const checked = !!value;

    // defaults to rendering in open state:
    const isOpen = open === undefined ? true : open;

    let checkboxComponent;

    if (checked) {
        const openStateStyle = isOpen ? null : styles.imageButtonClosed(theme);
        checkboxComponent = (
            <button
                className={cx(
                    styles.headerButton,
                    styles.windowManagedButton,
                    openStateStyle
                )}
                title={title}
                onClick={onClick}
            />
        );
    } else {
        checkboxComponent = (
            <div className={styles.headerCheckboxContainer}>
                <input
                    className={cx(
                        styles.headerCheckBoxInput,
                        extraUncheckedStyle
                    )}
                    type="checkbox"
                    title={title}
                    onClick={onClick}
                    value={0}
                />
            </div>
        );
    }
    return <div className={containerStyle}>{checkboxComponent}</div>;
};

export default HeaderCheckbox;
