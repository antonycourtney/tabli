import { Patch } from 'immer';
import { TabWindow, TabItem, SavedTabState, OpenTabState } from './tabWindow';

// Serialize a patch
function serializePatch(patch: Patch): any {
    return {
        ...patch,
        value: serializeValue(patch.value),
    };
}

// Deserialize a patch
function deserializePatch(serializedPatch: any): Patch {
    return {
        ...serializedPatch,
        value: deserializeValue(serializedPatch.value),
    };
}

// Serialize a value, handling TabWindow and other custom types
function serializeValue(value: any): any {
    if (value instanceof TabWindow) {
        return { type: 'TabWindow', data: value };
    } else if (value instanceof TabItem) {
        return { type: 'TabItem', data: value };
    } else if (value instanceof SavedTabState) {
        return { type: 'SavedTabState', data: value };
    } else if (value instanceof OpenTabState) {
        return { type: 'OpenTabState', data: value };
    } else if (Array.isArray(value)) {
        return value.map(serializeValue);
    } else if (typeof value === 'object' && value !== null) {
        return Object.fromEntries(
            Object.entries(value).map(([k, v]) => [k, serializeValue(v)]),
        );
    }
    return value;
}

// Deserialize a value, handling TabWindow and other custom types
function deserializeValue(value: any): any {
    if (value && typeof value === 'object' && 'type' in value) {
        switch (value.type) {
            case 'TabWindow':
                return TabWindow.create(value.data);
            case 'TabItem':
                return TabItem.create(value.data);
            case 'SavedTabState':
                return SavedTabState.create(value.data);
            case 'OpenTabState':
                return OpenTabState.create(value.data);
        }
    } else if (Array.isArray(value)) {
        return value.map(deserializeValue);
    } else if (typeof value === 'object' && value !== null) {
        return Object.fromEntries(
            Object.entries(value).map(([k, v]) => [k, deserializeValue(v)]),
        );
    }
    return value;
}

// Serialize patches
export function serializePatches(patches: Patch[]): string {
    const serializedPatches = patches.map(serializePatch);
    return JSON.stringify(serializedPatches);
}

// Deserialize patches
export function deserializePatches(serializedPatches: string): Patch[] {
    const parsedPatches = JSON.parse(serializedPatches);
    return parsedPatches.map(deserializePatch);
}
