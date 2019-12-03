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
        width="20"
        height="20"
        viewBox="0 0 24 24"
    >
        <path fill="none" d="M0 0h24v24H0V0z" />
        <path d="M4 18h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1s.45 1 1 1zm0-5h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1s.45 1 1 1zM3 7c0 .55.45 1 1 1h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1z" />
    </svg>
);

export const expandMore = (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="2 4 20 20"
    >
        <path opacity=".87" fill="none" d="M24 24H0V0h24v24z" />
        <path d="M15.88 9.29L12 13.17 8.12 9.29c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l4.59 4.59c.39.39 1.02.39 1.41 0l4.59-4.59c.39-.39.39-1.02 0-1.41-.39-.38-1.03-.39-1.42 0z" />
    </svg>
);

const debugHelper = css({
    backgroundColor: 'yellow'
});

export const expandLess = (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="2 4 20 20"
    >
        <path fill="none" d="M0 0h24v24H0V0z" />
        <path d="M11.29 8.71L6.7 13.3c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12 10.83l3.88 3.88c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L12.7 8.71c-.38-.39-1.02-.39-1.41 0z" />
    </svg>
);

export const closeIcon = (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
    >
        <path fill="none" d="M0 0h24v24H0V0z" />
        <path d="M18.3 5.71c-.39-.39-1.02-.39-1.41 0L12 10.59 7.11 5.7c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L10.59 12 5.7 16.89c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12 13.41l4.89 4.89c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z" />
    </svg>
);

export const check = (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
    >
        <path fill="none" d="M0 0h24v24H0V0z" />
        <path d="M9 16.17L5.53 12.7c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l4.18 4.18c.39.39 1.02.39 1.41 0L20.29 7.71c.39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0L9 16.17z" />
    </svg>
);

export const chevron = (
    <svg
        height="16px"
        width="16px"
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        x="0px"
        y="0px"
        viewBox="0 0 100 100"
    >
        <g>
            <path d="M5273.1,2400.1v-2c0-2.8-5-4-9.7-4s-9.7,1.3-9.7,4v2c0,1.8,0.7,3.6,2,4.9l5,4.9c0.3,0.3,0.4,0.6,0.4,1v6.4     c0,0.4,0.2,0.7,0.6,0.8l2.9,0.9c0.5,0.1,1-0.2,1-0.8v-7.2c0-0.4,0.2-0.7,0.4-1l5.1-5C5272.4,2403.7,5273.1,2401.9,5273.1,2400.1z      M5263.4,2400c-4.8,0-7.4-1.3-7.5-1.8v0c0.1-0.5,2.7-1.8,7.5-1.8c4.8,0,7.3,1.3,7.5,1.8C5270.7,2398.7,5268.2,2400,5263.4,2400z"></path>
            <path d="M5268.4,2410.3c-0.6,0-1,0.4-1,1c0,0.6,0.4,1,1,1h4.3c0.6,0,1-0.4,1-1c0-0.6-0.4-1-1-1H5268.4z"></path>
            <path d="M5272.7,2413.7h-4.3c-0.6,0-1,0.4-1,1c0,0.6,0.4,1,1,1h4.3c0.6,0,1-0.4,1-1C5273.7,2414.1,5273.3,2413.7,5272.7,2413.7z"></path>
            <path d="M5272.7,2417h-4.3c-0.6,0-1,0.4-1,1c0,0.6,0.4,1,1,1h4.3c0.6,0,1-0.4,1-1C5273.7,2417.5,5273.3,2417,5272.7,2417z"></path>
        </g>
        <g>
            <polygon points="55.4,75 69.6,75 44.6,50 69.6,25 55.4,25 30.4,50    "></polygon>
            <polygon points="27.4,75 41.7,75 16.7,50 41.7,25 27.5,25 2.5,50    "></polygon>
            <polygon points="83.3,75 97.5,75 72.5,50 97.5,25 83.3,25 58.3,50    "></polygon>
        </g>
    </svg>
);
