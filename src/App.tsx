import { useEffect, useState } from 'react';
import { Box, createTheme, CssBaseline, Paper, ThemeProvider } from '@mui/material';
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

        const streamInfos = await GetFollowedStreams();
        setFollowedStreams(streamInfos);
        if (isFirstPoll && streamInfos.length > 0) {
            setSelectedStreams([streamInfos[0]]);
        }

        getPromisedTimeout(PollIntervalMs).then(() => pollFollowedStreams(false));
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
            <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
                <Paper
                    elevation={1}
                    sx={{ minWidth: '360px', width: '360px', overflowY: 'auto', borderRadius: 0 }}
                >
                    <StreamList
                        followedStreams={followedStreams}
                        selectedStreams={selectedStreams}
                        toggleStreamSelect={toggleStreamSelect}
                    />
                </Paper>
                <StreamVideoGrid selectedStreams={selectedStreams} />
            </Box>
        </ThemeProvider>
    );
};

export default App;
