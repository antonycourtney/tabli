import * as React from 'react';
import * as Constants from './constants';
import { css } from 'emotion';
const windowListSectionStyle = css({
    borderBottom: '1px solid #bababa',
    paddingLeft: 12,
    paddingRight: 24,
    paddingTop: 10,
    paddingBottom: 4,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch'
});

const windowListSectionHeaderStyle = css({
    minWidth: Constants.WINDOW_MIN_WIDTH,
    maxWidth: Constants.WINDOW_MAX_WIDTH,
    fontWeight: 'bold',
    marginBottom: 5
});

interface WindowListSectionProps {
    title?: string;
    focusedRef?: React.MutableRefObject<HTMLDivElement | null>;
    // children: React.ReactChildren;
}

interface SectionDivProps {
    className: string;
    ref?: React.MutableRefObject<HTMLDivElement | null>;
}

const WindowListSection: React.FC<WindowListSectionProps> = ({
    title,
    focusedRef,
    children
}) => {
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
            <div>{children}</div>
        </div>
    );
};

export default WindowListSection;
