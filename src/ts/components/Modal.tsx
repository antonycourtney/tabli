import * as Constants from './constants';
import * as React from 'react';
import * as styles from './cssStyles';
import { css, cx } from 'emotion';
import { ThemeContext, Theme } from './themeContext';
import { HeaderButton } from './HeaderButton';
import { useContext } from 'react';
import { LayoutContext } from './LayoutContext';

/*
 * generic modal dialog component
 */

/* Allow multiple components in this file: */
/* eslint react/no-multi-comp:0 */

const modalOverlayStyle = css({
    position: 'fixed',
    top: 0,
    left: 0,
    background: 'rgba(0,0,0,0.6)',
    zIndex: 5,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
});
const selectedBorder = '2px solid #a0a0a0';
const modalContainerStyle = (theme: Theme) =>
    css({
        minWidth: 300,
        /* maxWidth: 640, */
        maxHeight: '80%',
        position: 'relative',
        zIndex: 10,
        borderRadius: 3,
        background: theme.background,
        margin: 'auto',
        border: selectedBorder,
        flexGrow: 0,
        display: 'flex',
        flexDirection: 'column',
    });
const modalBodyContainerStyle = css({
    display: 'flex',
    minHeight: 50,
    maxHeight: Constants.MODAL_BODY_MAX_HEIGHT,
    overflow: 'auto',
    flexDirection: 'column',
    margin: 8,
});

const modalTitleBase = css({
    fontWeight: 'bold',
    paddingLeft: 7,
    maxWidth: 243,
});

const titleStyle = cx(styles.text, styles.noWrap, modalTitleBase, styles.open);

const dialogInfoStyle = css({
    borderBottom: '1px solid #bababa',
    paddingLeft: 3,
});

interface DialogProps {
    title: String;
    onClose: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void;
    className?: string;
    children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({
    title,
    onClose,
    className,
    children,
}: DialogProps) => {
    const theme = useContext(ThemeContext);
    const layout = useContext(LayoutContext);

    const handleClose = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        event.preventDefault();
        onClose(event);
    };

    const closeButton = (
        <HeaderButton
            className={styles.modalCloseButton(theme)}
            visible
            title="Close Window"
            onClick={handleClose}
        />
    );
    // Note explicit global css class name windowHeaderHoverContainer here
    // Due to limitation of nested class selectors with composition;
    // see https://emotion.sh/docs/nested for more info.
    const modalDiv = (
        <div className={modalOverlayStyle}>
            <div className={cx(className, modalContainerStyle(theme))}>
                <div
                    className={
                        cx(styles.windowHeader(theme, layout), styles.noWrap) +
                        ' windowHeaderHoverContainer'
                    }
                >
                    <span className={titleStyle}>{title}</span>
                    <div className={styles.spacer} />
                    {closeButton}
                </div>
                {children}
            </div>
        </div>
    );
    return modalDiv;
};

interface InfoProps {
    children: React.ReactNode;
}

export const Info: React.FC<InfoProps> = ({ children }) => {
    return (
        <div className={dialogInfoStyle}>
            <div className={styles.dialogInfoContents}>{children}</div>
        </div>
    );
};

interface BodyProps {
    children: React.ReactNode;
}

export const Body: React.FC<BodyProps> = ({ children }) => {
    return <div className={modalBodyContainerStyle}>{children}</div>;
};
