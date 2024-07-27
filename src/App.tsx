import { useEffect, useState } from 'react';
import { Box, createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import { StreamList } from './components/StreamList';
import { StreamVideoGrid } from './components/StreamVideoGrid';
import { Authenticate, GetFollowedStreams, StreamAndUserInfo } from './services/twitch';

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
const getPromisedTimeout = (ms: number) => new Promise((r) => setTimeout(r, ms));

let IsPollingStarted = false;

const App = () => {
    const [followedStreams, setFollowedStreams] = useState<StreamAndUserInfo[]>([]);
    const [selectedStreams, setSelectedStreams] = useState<StreamAndUserInfo[]>([]);

    const toggleStreamSelect = (stream: StreamAndUserInfo) => {
        setSelectedStreams((prev) => {
            const next = [...prev];

            const selectedStreamIndex = next.findIndex((p) => p.user_name === stream.user_name);
            if (selectedStreamIndex >= 0) {
                next.splice(selectedStreamIndex, 1);
            } else {
                next.push(stream);
            }
            return next;
        });
    };

    const pollFollowedStreams = async (isFirstPoll: boolean) => {
        console.log('[' + new Date().toLocaleString() + '] Polling Twitch for followed streams.');

        try {
            const streamInfos = await GetFollowedStreams();
            setFollowedStreams(streamInfos);
            if (isFirstPoll && streamInfos.length > 0) {
                // Add select first stream if the page just loaded in.
                setSelectedStreams([streamInfos[0]]);
            } else {
                // Unselect all streams that have gone offline.
                setSelectedStreams((prev) =>
                    prev.filter((p) => !!streamInfos.find((si) => si.user_name === p.user_name))
                );
            }
        } catch (error) {
            console.error(error);
        } finally {
            getPromisedTimeout(PollIntervalMs).then(() => pollFollowedStreams(false));
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
            <CssBaseline />
            <Box sx={{ display: 'flex' }}>
                <StreamList
                    followedStreams={followedStreams}
                    selectedStreams={selectedStreams}
                    toggleStreamSelect={toggleStreamSelect}
                />
                <StreamVideoGrid selectedStreams={selectedStreams} />
            </Box>
        </ThemeProvider>
    );
};

export default App;
