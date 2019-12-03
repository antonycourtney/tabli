import * as React from 'react';
import * as styles from './cssStyles';
import { cx } from 'emotion';

export const headerButtonSpacer = (
    <button className={cx(styles.headerButton, styles.hidden)} />
);

export interface HeaderButtonProps {
    className?: string;
    title: string;
    visible: boolean;
    onClick: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}

export const HeaderButton: React.FunctionComponent<HeaderButtonProps> = ({
    className,
    title,
    visible,
    onClick
}: HeaderButtonProps) => {
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

    return <button className={className} title={title} onClick={handleClick} />;
};
