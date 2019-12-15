/*
 * A Component wrapper around checkbox for use in WindowHeader and
 * TabItem. Wraps checkbox input in a div since the input component
 * doesn't obey proper css props like width and height, and swaps
 * input for an image when checked.
 */
import * as React from 'react';

import { cx, css } from 'emotion';
import * as styles from './cssStyles';
import { ThemeContext, Theme } from './themeContext';
import get from 'lodash/get';
import { useContext } from 'react';
import { HeaderButtonSVG } from './HeaderButtonSVG';
import * as svg from './svg';

const containerStyle = css({
    display: 'flex',
    alignItems: 'center',
    outline: 'none',
    border: '1px solid #0000ff', // 'none',
    height: 16,
    marginLeft: 4,
    marginRight: 4,
    flex: 'none'
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
            <HeaderButtonSVG
                svgElem={svg.check}
                title={title}
                onClick={onClick}
                visible={true}
                svgClassName={styles.checkStyle(theme)}
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
    return checkboxComponent;
};

export default HeaderCheckbox;
