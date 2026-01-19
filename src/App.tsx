import { useEffect, useState } from 'react';
import { Box, createTheme, CssBaseline, GlobalStyles, ThemeProvider } from '@mui/material';
import { StreamList } from './components/StreamList';
import { StreamVideoGrid } from './components/StreamVideoGrid';
import { Authenticate, GetFollowedStreams, StreamAndUserInfo } from './services/twitch';
import { StreamChat } from './components/StreamChat';
import { GetPromisedTimeout } from './services/utilities';
import { StorageModule } from './services/storage';

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
    typography: {
        fontSize: 12,
    },
    components: {
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    fontSize: 11,
                },
            },
        },
    },
});

const PollIntervalMs = 30000;
let IsPollingStarted = false;

const filterOfflineStreams = (
    baseStreams: StreamAndUserInfo[],
    onlineStreams: StreamAndUserInfo[]
) => baseStreams.filter((bs) => !!onlineStreams.find((os) => os.user_id === bs.user_id));

const App = () => {
    const [followedStreams, setFollowedStreams] = useState<StreamAndUserInfo[]>([]);
    const [selectedStreams, setSelectedStreams] = useState<StreamAndUserInfo[]>([]);
    const [streamChat, setStreamChat] = useState<StreamAndUserInfo>();

    const toggleStreamSelect = (stream: StreamAndUserInfo) => {
        setSelectedStreams((prev) => {
            const value = [...prev];

            const selectedStreamIndex = value.findIndex((p) => p.user_name === stream.user_name);
            if (selectedStreamIndex >= 0) {
                // Deselect stream from viewing.
                value.splice(selectedStreamIndex, 1);
                // If it was on, turn off this stream's chat.
                setStreamChat((prev) => {
                    const value = prev?.user_id !== stream.user_id ? prev : undefined;
                    StorageModule.SetStreamChat(value);
                    return value;
                });
            } else {
                // Select stream for viewing.
                value.push(stream);
            }

            StorageModule.SetSelectedStreams(value);
            return value;
        });
    };

    const toggleStreamChat = (stream: StreamAndUserInfo) => {
        setStreamChat((prev) => {
            const value = prev?.user_id !== stream.user_id ? stream : undefined;
            StorageModule.SetStreamChat(value);
            return value;
        });
    };

    const updateStreamChat = (stream: StreamAndUserInfo | undefined) => {
        setStreamChat(stream);
        StorageModule.SetStreamChat(stream);
    };

    const pollFollowedStreams = async (isFirstPoll: boolean) => {
        try {
            const latestFollowedStreams = await GetFollowedStreams();
            setFollowedStreams(latestFollowedStreams);
            if (isFirstPoll && latestFollowedStreams.length > 0) {
                // If the page just loaded in:

                // Try to select the same streams from last time if they are still online.
                const storedStreams = filterOfflineStreams(
                    StorageModule.GetSelectedStreams() ?? [],
                    latestFollowedStreams
                );
                const streamsToSelect =
                    storedStreams.length > 0 ? storedStreams : [latestFollowedStreams[0]];
                setSelectedStreams(streamsToSelect);
                StorageModule.SetSelectedStreams(streamsToSelect);

                // Try to open same chat from last time, if it is still online.
                const storedStreamChat = StorageModule.GetStreamChat();
                const onlineStreamChat =
                    storedStreamChat !== undefined
                        ? filterOfflineStreams([storedStreamChat], latestFollowedStreams)
                        : [];
                updateStreamChat(onlineStreamChat.length > 0 ? onlineStreamChat[0] : undefined);

            } else {
                // Unselect all streams that have gone offline.
                setSelectedStreams((prev) => {
                    const value = filterOfflineStreams(prev, latestFollowedStreams);
                    StorageModule.SetSelectedStreams(value);
                    return value;
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            GetPromisedTimeout(PollIntervalMs).then(() => pollFollowedStreams(false));
        }
    };

    useEffect(() => {
        if (IsPollingStarted) return;
        IsPollingStarted = true;

        Authenticate();
        pollFollowedStreams(true);
    }, []);

    return (
        <ThemeProvider theme={darkTheme}>
            <GlobalStyles styles={{ iframe: { border: 'none' } }} />
            <CssBaseline />
            <Box sx={{ display: 'flex' }}>
                <StreamList
                    followedStreams={followedStreams}
                    selectedStreams={selectedStreams}
                    streamChat={streamChat}
                    toggleStreamSelect={toggleStreamSelect}
                    toggleStreamChat={toggleStreamChat}
                />
                <StreamVideoGrid selectedStreams={selectedStreams} />
                {streamChat && (
                    <StreamChat
                        stream={streamChat.user_name}
                        onClose={() => updateStreamChat(undefined)}
                    />
                )}
            </Box>
        </ThemeProvider>
    );
};

export default App;
