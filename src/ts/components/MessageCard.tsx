import * as React from 'react';
import * as styles from './cssStyles';
import { cx, css } from 'emotion';
import FlatButton from './FlatButton';

const messageCardBaseStyle = css({
    padding: 0
});
const messageCardStyle = cx(
    styles.tabWindow,
    styles.tabWindowFocused,
    messageCardBaseStyle
);

const cardActionsStyle = css({
    display: 'inline-flex',
    flexDirection: 'row-reverse',
    paddingRight: 16,
    paddingBottom: 16,
    position: 'relative'
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
    onClick
}: MessageCardProps) => {
    const rawMarkup = { __html: content };

    return (
        <div className={messageCardStyle}>
            <div className="cardContent" dangerouslySetInnerHTML={rawMarkup} />
            <div className={cardActionsStyle}>
                <FlatButton label="GOT IT" onClick={onClick} />
            </div>
        </div>
    );
};

export default MessageCard;
