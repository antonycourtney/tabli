import log from 'loglevel';
import * as React from 'react';
import * as styles from './cssStyles';
import { cx, css, keyframes } from 'emotion';

const previewContainerStyle = css`
    width: 300px;
    max-height: 330px;
    overflow: hidden;
    border: 1px solid #000000;
    font-size: 14px;
`;

// Using technique from https://jonathannicol.com/blog/2014/06/16/centre-crop-thumbnails-with-css/
// for thumbnails:
const thumbnailDiv = css`
    position: relative;
    width: 300px;
    height: 300px;
    overflow: hidden;
`;

// From https://www.kirupa.com/html5/ken_burns_effect_css.htm
const kenburns = keyframes`
    0% {
        opacity: 0;
    }
    5% {
        opacity: 1;
    }
    50% {
        transform: scale3d(1.5, 1.5, 1.5) translate3d(-250px, -150px, 0px);
        animation-timing-function: ease-in;
        opacity: 1;
    }
    95% {
        transform: scale3d(2.0, 2.0, 2.0) translate3d(-50px, -175px, 0px);
        animation-timing-function: ease-out;
        opacity: 1;
    }

    100% {
        transform: scale3d(2.3, 2.3, 2.3) translate3d(-100px, -100px, 0px);
        opacity: 0;
    }
`;

/*
    -webkit-transform: translate(-50%, -50%);
    -ms-transform: translate(-50%, -50%);
    transform: translate(-50%, -50%);
*/

const thumbnailImg = css`
    position: absolute;
    left: 50%;
    top: 50%;
    height: 100%;
    width: auto;
    transform: translate(-50%, -50%);
    animation: ${kenburns} 10s infinite;
`;

export interface TabPreviewProps {
    title: string;
    url: string;
    screenshot: string | null;
}

export const TabPreview: React.FunctionComponent<TabPreviewProps> = ({
    title,
    url,
    screenshot
}: TabPreviewProps) => {
    const header = (
        <div>
            <span>{title}</span>
            <br />
            <span>{url}</span>
        </div>
    );
    const body = screenshot ? (
        <div className={thumbnailDiv}>
            <img className={thumbnailImg} src={screenshot} />
        </div>
    ) : null;

    return (
        <div className={previewContainerStyle}>
            {header}
            {body}
        </div>
    );
};
