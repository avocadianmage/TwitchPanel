import { StreamAndUserInfo } from './twitch';

const StreamListCollapsedKey = 'StreamListCollapsed';
const SelectedStreamsKey = 'SelectedStreams';
const StreamChatKey = 'StreamChat';

const getFromStorage = <T,>(key: string): T | undefined => {
    const value = window.localStorage.getItem(key);
    return value !== null ? JSON.parse(value) : undefined;
};

const setToStorage = <T,>(key: string, value: T): void => {
    window.localStorage.setItem(key, JSON.stringify(value));
};

export const StorageModule = {
    GetStreamListCollapsed: () => getFromStorage<boolean>(StreamListCollapsedKey),
    SetStreamListCollapsed: (collapsed: boolean) => setToStorage(StreamListCollapsedKey, collapsed),

    GetSelectedStreams: () => getFromStorage<StreamAndUserInfo[]>(SelectedStreamsKey),
    SetSelectedStreams: (streams: StreamAndUserInfo[]) => setToStorage(SelectedStreamsKey, streams),

    GetStreamChat: () => getFromStorage<StreamAndUserInfo>(StreamChatKey),
    SetStreamChat: (stream: StreamAndUserInfo | undefined) => setToStorage(StreamChatKey, stream),
};
