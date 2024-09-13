import { log } from '../globals';
import * as React from 'react';
import { css } from '@emotion/css';

const flatButtonStyle = css({
    border: '0px',
    display: 'inline-block',
    backgroundColor: 'rgba(0,0,0,0)',
    fontFamily: 'Roboto, sans-serif',
    fontSize: '1.167rem',
    color: '#4285f4',
    cursor: 'pointer',
    '&:hover': {
        textDecoration: 'none',
    },
});

interface FlatButtonProps {
    label: string;
    onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}

const FlatButton: React.FunctionComponent<FlatButtonProps> = ({
    label,
    onClick,
}: FlatButtonProps) => {
    const handleClick = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        event.stopPropagation();
        event.preventDefault();
        if (onClick) {
            onClick(event);
        }
        return false;
    };
    return (
        <div role="button" onClick={handleClick}>
            <span className={flatButtonStyle}>{label}</span>
        </div>
    );
};

export default FlatButton;
