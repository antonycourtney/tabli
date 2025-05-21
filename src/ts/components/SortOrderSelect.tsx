import * as React from 'react';
import { css } from '@emotion/css';
import { Preferences } from '../preferences';
import { ArrowDownWideNarrow } from 'lucide-react';
import * as actions from '../actions';
import { StateRef } from 'oneref';
import TabManagerState from '../tabManagerState';

const selectContainerStyle = css({
    display: 'flex',
    alignItems: 'center',
    marginRight: 5,
});

const selectIconStyle = css({
    marginRight: 5,
    width: 16,
    height: 16,
});

const selectStyle = css({
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '0.75rem',
    padding: '2px 4px',
    appearance: 'none',
    width: 90,
});

interface SortOrderSelectProps {
    stateRef: StateRef<TabManagerState>;
    sortOrder: 'alpha' | 'recent';
}

const SortOrderSelect: React.FC<SortOrderSelectProps> = ({
    stateRef,
    sortOrder,
}) => {
    const handleSortOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSortOrder = e.target.value as 'alpha' | 'recent';
        actions.updatePreferences(stateRef, { sortOrder: newSortOrder });
    };

    return (
        <div className={selectContainerStyle}>
            <ArrowDownWideNarrow className={selectIconStyle} />
            <select
                className={selectStyle}
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
