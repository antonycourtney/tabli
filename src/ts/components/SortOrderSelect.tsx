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

    // Determine theme colors for dropdown
    const isDarkTheme = theme.background === '#1e1e1e';
    const dropdownBg = isDarkTheme ? '#2d2d2d' : '#fff';
    const dropdownText = isDarkTheme ? '#fff' : '#222';
    const hoverColor = isDarkTheme ? '#404040' : '#f5f5f5';
    const highlightColor = isDarkTheme ? '#505050' : '#f0f0f0';

    return (
        <div className={selectContainerStyle}>
            <ArrowDownWideNarrow className={selectIconStyle(theme.foreground)} />
            <Select value={sortOrder} onValueChange={handleSortOrderChange}>
                <TooltipWrapper tip="Sort windows by name or recent activity">
                    <SelectTrigger color={theme.foreground}>
                        <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                </TooltipWrapper>
                <SelectContent 
                    color={theme.foreground}
                    backgroundColor={dropdownBg}
                    textColor={dropdownText}
                >
                    <SelectItem 
                        value="alpha" 
                        hoverColor={hoverColor}
                        highlightColor={highlightColor}
                    >
                        A-Z
                    </SelectItem>
                    <SelectItem 
                        value="recent"
                        hoverColor={hoverColor}
                        highlightColor={highlightColor}
                    >
                        Recent
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
};

export default SortOrderSelect;
