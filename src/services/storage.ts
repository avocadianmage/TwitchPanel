import { GameInfo, StreamAndUserInfo } from './twitch';

const StreamListCollapsedKey = 'StreamListCollapsed';
const SelectedStreamsKey = 'SelectedStreams';
const StreamChatKey = 'StreamChat';
const SpotlightStreamIdKey = 'SpotlightStreamId';
const TrackedGamesKey = 'TrackedGames';

const getFromStorage = <T,>(key: string): T | undefined => {
    const value = window.localStorage.getItem(key);
    if (value === null) return undefined;
    try {
        return JSON.parse(value);
    } catch {
        // Tolerate corrupt values (e.g. the literal 'undefined' written by older versions).
        return undefined;
    }
};

const setToStorage = <T,>(key: string, value: T): void => {
    // JSON.stringify(undefined) is not valid JSON and would break the next JSON.parse.
    if (value === undefined) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
};

export const StorageModule = {
    GetStreamListCollapsed: () => getFromStorage<boolean>(StreamListCollapsedKey),
    SetStreamListCollapsed: (collapsed: boolean) => setToStorage(StreamListCollapsedKey, collapsed),

    GetSelectedStreams: () => getFromStorage<StreamAndUserInfo[]>(SelectedStreamsKey),
    SetSelectedStreams: (streams: StreamAndUserInfo[]) => setToStorage(SelectedStreamsKey, streams),

    GetStreamChat: () => getFromStorage<StreamAndUserInfo>(StreamChatKey),
    SetStreamChat: (stream: StreamAndUserInfo | undefined) => setToStorage(StreamChatKey, stream),

    GetSpotlightStreamId: () => getFromStorage<string>(SpotlightStreamIdKey),
    SetSpotlightStreamId: (id: string | undefined) => setToStorage(SpotlightStreamIdKey, id),

    GetTrackedGames: () => getFromStorage<GameInfo[]>(TrackedGamesKey),
    SetTrackedGames: (games: GameInfo[]) => setToStorage(TrackedGamesKey, games),
};
