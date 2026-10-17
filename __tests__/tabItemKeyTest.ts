import { TabItem } from '../src/ts/tabWindow';

test('new tab item keys skip past keys restored from a snapshot', () => {
    const restored = TabItem.create({ key: '_tabItem-9000' } as any);
    expect(restored.key).toBe('_tabItem-9000');

    const fresh = TabItem.create();
    expect(fresh.key).toBe('_tabItem-9001');
});

test('restored keys lower than the counter leave it unchanged', () => {
    const before = TabItem.create().key;
    TabItem.create({ key: '_tabItem-1' } as any);
    const after = TabItem.create().key;
    const n = (key: string) => Number(key.slice('_tabItem-'.length));
    expect(n(after)).toBe(n(before) + 1);
});
