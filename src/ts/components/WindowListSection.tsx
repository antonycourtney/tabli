import * as React from 'react';
import * as Constants from './constants';
import { css } from '@emotion/css';
import { Layout, LayoutContext } from './LayoutContext';
import { useContext } from 'react';

const windowListSectionStyle = (layout: Layout) =>
    css({
        borderBottom: '1px solid #bababa',
        paddingLeft: 12,
        paddingRight: 24,
        paddingTop: layout.sectionPaddingTop,
        paddingBottom: layout.sectionPaddingBottom,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
    });

const windowListSectionHeaderStyle = (layout: Layout) =>
    css({
        minWidth: Constants.WINDOW_MIN_WIDTH,
        maxWidth: Constants.WINDOW_MAX_WIDTH,
        fontWeight: 900,
        fontSize: layout.sectionHeaderFontSize,
        marginBottom: layout.sectionHeaderMarginBottom,
    });

const windowListChildrenContainerStyle = css({
    marginLeft: 8,
});

const headerRowStyle = css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
});

interface WindowListSectionProps {
    title?: string;
    focusedRef?: React.MutableRefObject<HTMLDivElement | null>;
    children: React.ReactNode;
    extraElements?: React.ReactNode;
}

interface SectionDivProps {
    className: string;
    ref?: React.MutableRefObject<HTMLDivElement | null>;
}

const WindowListSection: React.FC<WindowListSectionProps> = ({
    title,
    focusedRef,
    children,
    extraElements,
}: WindowListSectionProps) => {
    const layout = useContext(LayoutContext);

    var header = null;
    if (title) {
        header = (
            <div className={windowListSectionHeaderStyle(layout)}>
                <div className={headerRowStyle}>
                    <span>{title}</span>
                    {extraElements}
                </div>
            </div>
        );
    }
    var sectionDivProps: SectionDivProps = {
        className: windowListSectionStyle(layout),
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
