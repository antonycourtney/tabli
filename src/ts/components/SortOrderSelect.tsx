import * as React from 'react';
import { css } from '@emotion/css';
import { Preferences } from '../preferences';
import { ArrowDownWideNarrow } from 'lucide-react';
import * as actionsClient from '../actionsClient';
import { StateRef } from 'oneref';
import TabManagerState from '../tabManagerState';
import { ThemeContext } from './themeContext';
import { useContext } from 'react';

const selectContainerStyle = css({
    display: 'flex',
    alignItems: 'center',
    marginRight: 5,
});

const selectIconStyle = (color: string) => css({
    marginRight: 5,
    width: 16,
    height: 16,
    color: color, // Use theme color for the icon
});

const selectStyle = (color: string) => css({
    border: '1px solid ' + color,
    borderRadius: '3px',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '0.75rem',
    padding: '2px 4px',
    appearance: 'none',
    width: 90,
    color: color, // Use theme color for the text
});

interface SortOrderSelectProps {
    stateRef: StateRef<TabManagerState>;
    sortOrder: 'alpha' | 'recent';
}

const SortOrderSelect: React.FC<SortOrderSelectProps> = ({
    stateRef,
    sortOrder,
}) => {
    const theme = useContext(ThemeContext);
    
    const handleSortOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSortOrder = e.target.value as 'alpha' | 'recent';
        actionsClient.updatePreferences(stateRef, { sortOrder: newSortOrder });
    };

    return (
        <div className={selectContainerStyle}>
            <ArrowDownWideNarrow className={selectIconStyle(theme.foreground)} />
            <select
                className={selectStyle(theme.foreground)}
                value={sortOrder}
                onChange={handleSortOrderChange}
                title="Sort windows by name or recent activity"
            >
                <option value="alpha">A-Z</option>
                <option value="recent">Recent</option>
            </select>
        </div>
    );
};

export default SortOrderSelect;
