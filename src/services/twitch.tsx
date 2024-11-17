export const AspectRatio = 16 / 9;

interface StreamInfo {
    user_id: string;
    user_name: string;
    game_name: string;
    title: string;
    viewer_count: number;
}

export interface UserInfo {
    id: string;
    profile_image_url: string;
}

export interface StreamAndUserInfo extends StreamInfo {
    userInfo: UserInfo;
}

interface QueryParam {
    key: string;
    value: string | number | boolean;
}

/**
 * Authentication details
 */

const client_id = 'ko2dweidblciqum63bel4ae0axtpav';

const getAccessToken = () => {
    const oAuthResponse = document.location.hash;
    return oAuthResponse ? oAuthResponse.split('&')[0].split('#access_token=')[1] : undefined;
};

/**
 * Private APIs
 */

const buildUrl = (base: string, params: QueryParam[]) => {
    let url = base + '?';
    for (let param of params) {
        if (param.key === '') continue;
        url += param.key;
        if (param.value !== '') url += '=' + param.value;
        url += '&';
    }
    return url.slice(0, -1);
};

const invokeTwitchApi = async (api: string, params: QueryParam[]) => {
    const url = buildUrl(`https://api.twitch.tv/helix/${api}`, params);
    const response = await fetch(url, {
        method: 'GET',
        headers: new Headers({
            Authorization: 'Bearer ' + getAccessToken(),
            'Client-Id': client_id,
        }),
    });

    // If Unauthorized response, renew authentication to generate a new access token.
    if (response.status === 401) Authenticate(true);

    return response.json();
};

const getUsersData = async (streams: StreamInfo[]): Promise<UserInfo[]> => {
    const params = streams.map((s) => ({ key: 'id', value: s.user_id }));
    const getUsersResponse = await invokeTwitchApi('users', params);
    return getUsersResponse.data;
};

const getLoggedInUserInfo = async (): Promise<UserInfo> => {
    const users = await getUsersData([]);
    return users[0];
};

/**
 * Public APIs
 */

export const Authenticate = (renew: boolean = false) => {

    // Quit if already authenticated and not attempting to renew authentication.
    if (!renew && getAccessToken()) return;

    // The redirect_uri must match exactly (including trailing slash) or Twitch will reject the 
    // request. However, it should not include the location hash to avoid passing forward any stale
    // access tokens persisting when in the process of renewing authentication. This is why 
    // window.location.href is not used.
    const appendIfNeeded = (s: string, append: string) => s.endsWith(append) ? s : s + append;
    const redirect_uri = appendIfNeeded(window.location.origin, '/');

    const oAuthUrl = buildUrl('https://id.twitch.tv/oauth2/authorize', [
        { key: 'response_type', value: 'token' },
        { key: 'client_id', value: client_id },
        { key: 'redirect_uri', value: redirect_uri },
        { key: 'scope', value: encodeURIComponent('user:read:follows') },
    ]);
    window.location.replace(oAuthUrl);
};

export const GetFollowedStreams = async (): Promise<StreamAndUserInfo[]> => {
    const userInfo = await getLoggedInUserInfo();

    let ret: StreamAndUserInfo[] = [];
    let cursor: string | undefined = '';
    do {
        const getFollowedChannelsResponse = await invokeTwitchApi('streams/followed', [
            { key: 'user_id', value: userInfo.id },
            { key: 'first', value: 100 }, // This is the max value.
            { key: 'after', value: cursor },
        ]);
        const getFollowedChannelsResponseData: StreamInfo[] = getFollowedChannelsResponse.data;

        const getUsersResponseData = await getUsersData(getFollowedChannelsResponseData);
        const streamAndUserInfos: StreamAndUserInfo[] = getFollowedChannelsResponseData.map(
            (s) => ({
                ...s,
                userInfo: getUsersResponseData.find((u) => u.id === s.user_id)!,
            })
        );

        ret = ret.concat(streamAndUserInfos);
        cursor = getFollowedChannelsResponse.pagination.cursor;
    } while (!!cursor);
    return ret;
};

const getEmbeddingParentDomain = () => window.location.hostname;

export const GetStreamVideoSrc = (name: string, muted: boolean) => {
    return buildUrl('https://player.twitch.tv/', [
        { key: 'channel', value: name },
        { key: 'parent', value: getEmbeddingParentDomain() },
        { key: 'muted', value: muted },
    ]);
};

export const GetStreamChatSrc = (name: string, darkMode: boolean) => {
    return buildUrl(`https://twitch.tv/embed/${name}/chat`, [
        { key: 'parent', value: getEmbeddingParentDomain() },
        { key: darkMode ? 'darkpopout' : '', value: '' },
    ]);
};
