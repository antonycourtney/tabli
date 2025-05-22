import * as React from 'react';
import { css } from '@emotion/css';
import { Preferences } from '../preferences';
import { ArrowDownWideNarrow } from 'lucide-react';
import * as actionsClient from '../actionsClient';
import { StateRef } from 'oneref';
import TabManagerState from '../tabManagerState';
import { ThemeContext } from './themeContext';
import { useContext } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { TooltipWrapper } from './ui/TooltipWrapper';

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

interface SortOrderSelectProps {
    stateRef: StateRef<TabManagerState>;
    sortOrder: 'alpha' | 'recent';
}

const SortOrderSelect: React.FC<SortOrderSelectProps> = ({
    stateRef,
    sortOrder,
}) => {
    const theme = useContext(ThemeContext);
    
    const handleSortOrderChange = (value: string) => {
        const newSortOrder = value as 'alpha' | 'recent';
        actionsClient.updatePreferences(stateRef, { sortOrder: newSortOrder });
    };

    return (
        <div className={selectContainerStyle}>
            <ArrowDownWideNarrow className={selectIconStyle(theme.foreground)} />
            <TooltipWrapper tip="Sort windows by name or recent activity">
                <Select value={sortOrder} onValueChange={handleSortOrderChange}>
                    <SelectTrigger color={theme.foreground}>
                        <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent color={theme.foreground}>
                        <SelectItem value="alpha">A-Z</SelectItem>
                        <SelectItem value="recent">Recent</SelectItem>
                    </SelectContent>
                </Select>
            </TooltipWrapper>
        </div>
    );
};

export default SortOrderSelect;
