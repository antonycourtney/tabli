import * as React from 'react';
import * as styles from './cssStyles';
import { cx, css } from '@emotion/css';
import FlatButton from './FlatButton';
import { Theme, ThemeContext } from './themeContext';
import { useEffect } from 'react';

const messageCardBaseStyle = css({
    padding: 0,
});
const messageCardStyle = (theme: Theme) =>
    cx(
        styles.tabWindow(theme),
        styles.tabWindowFocused(theme),
        messageCardBaseStyle,
    );

const cardActionsStyle = css({
    display: 'inline-flex',
    flexDirection: 'row-reverse',
    paddingRight: 16,
    paddingBottom: 16,
    position: 'relative',
});

interface MessageCardProps {
    content: string;
    onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}

/*
 * Layout / design based on Card from Material UI:
 *
 * http://www.material-ui.com/#/components/card
 */
const MessageCard: React.FunctionComponent<MessageCardProps> = ({
    content,
    onClick,
}: MessageCardProps) => {
    const rawMarkup = { __html: content };
    const theme = React.useContext(ThemeContext);

    useEffect(() => {
        // Force the CSS variable for crufty Blueprint card style:
        document.documentElement.style.setProperty(
            '--bs-body-color',
            theme.foreground,
        );
    }, []);

    return (
        <div className={messageCardStyle(theme)}>
            <div className="cardContent" dangerouslySetInnerHTML={rawMarkup} />
            <div className={cardActionsStyle}>
                <FlatButton label="GOT IT" onClick={onClick} />
            </div>
        </div>
    );
};

export default MessageCard;
