import * as React from 'react';
import { css } from 'emotion';

export const popout = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <g transform="translate(50 50) scale(0.69 0.69) rotate(-90) translate(-50 -50)">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                data-name="Layer 1"
                viewBox="0 0 100 100"
                x="0px"
                y="0px"
            >
                <g data-name="Group">
                    <path
                        data-name="Path"
                        d="M90.7,12.5v-.7l-.2-.4-.2-.3-.5-.6h0L89,9.9l-.3-.2-.4-.2H65.1a4,4,0,1,0,0,8H77.1L41.2,53.1a4,4,0,1,0,5.7,5.7L82.8,22.9V34.9a4,4,0,0,0,8,0V13.2h0A4,4,0,0,0,90.7,12.5Z"
                    ></path>
                    <path
                        data-name="Path"
                        d="M21.2,90.8H68.6a12,12,0,0,0,12-12V50.5a4,4,0,1,0-8,0V78.8a4,4,0,0,1-4,4H21.2a4,4,0,0,1-4-4V31.4a4,4,0,0,1,4-4H49.5a4,4,0,0,0,0-8H21.2a12,12,0,0,0-12,12V78.8A12,12,0,0,0,21.2,90.8Z"
                    ></path>
                </g>
            </svg>
        </g>
    </svg>
);

export const popin = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <g transform="translate(50 50) scale(0.69 0.69) rotate(-90) translate(-50 -50)">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                data-name="Layer 1"
                viewBox="0 0 100 100"
                x="0px"
                y="0px"
            >
                <g data-name="Group">
                    <path
                        data-name="Path"
                        d="M87.9,12.1a4,4,0,0,0-5.7,0L46.4,48V35.9a4,4,0,0,0-8,0V57.6a4,4,0,0,0,.1.8v.7l.2.4.2.3A4,4,0,0,0,40.2,61l.3.2.4.2H64.1a4,4,0,0,0,0-8H52L87.9,17.7A4,4,0,0,0,87.9,12.1Z"
                    ></path>
                    <path
                        data-name="Path"
                        d="M24.9,89.1H68.2a14,14,0,0,0,14-14V48.9a4,4,0,0,0-8,0V75.1a6,6,0,0,1-6,6H24.9a6,6,0,0,1-6-6V31.8a6,6,0,0,1,6-6H51.1a4,4,0,0,0,0-8H24.9a14,14,0,0,0-14,14V75.1A14,14,0,0,0,24.9,89.1Z"
                    ></path>
                </g>
            </svg>
        </g>
    </svg>
);

const menuStyle = css`
    margin: 2px;
`;

export const menu = (
    <svg
        className={menuStyle}
        xmlns="http://www.w3.org/2000/svg"
        width="20px"
        height="20px"
        viewBox="0 0 24 24"
    >
        <path d="M0 0h24v24H0z" fill="none" />
        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
    </svg>
);
