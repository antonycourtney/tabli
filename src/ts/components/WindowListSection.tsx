import * as React from 'react';
import * as Constants from './constants';
import { css } from 'emotion';
const windowListSectionStyle = css({
    borderBottom: '1px solid #bababa',
    paddingLeft: 12,
    paddingRight: 24,
    paddingTop: 12,
    paddingBottom: 8,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch'
});

const windowListSectionHeaderStyle = css({
    minWidth: Constants.WINDOW_MIN_WIDTH,
    maxWidth: Constants.WINDOW_MAX_WIDTH,
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 8
});

const windowListChildrenContainerStyle = css({
    marginLeft: 8
});

interface WindowListSectionProps {
    title?: string;
    focusedRef?: React.MutableRefObject<HTMLDivElement | null>;
    children: React.ReactNode;
}

interface SectionDivProps {
    className: string;
    ref?: React.MutableRefObject<HTMLDivElement | null>;
}

const WindowListSection: React.FC<WindowListSectionProps> = ({
    title,
    focusedRef,
    children
}: WindowListSectionProps) => {
    var header = null;
    if (title) {
        header = (
            <div className={windowListSectionHeaderStyle}>
                <span>{title}</span>
            </div>
        );
    }
    var sectionDivProps: SectionDivProps = {
        className: windowListSectionStyle
    };
    if (focusedRef) {
        sectionDivProps.ref = focusedRef;
    }
    return (
        <div {...sectionDivProps}>
            {header}
            <div className={windowListChildrenContainerStyle}>{children}</div>
        </div>
    );
};

export default WindowListSection;
