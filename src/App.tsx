import { useEffect, useState } from 'react';
import { Box, createTheme, CssBaseline, Paper, ThemeProvider } from '@mui/material';
import * as Twitch from './services/twitch';
import { Stream, StreamList } from './components/StreamList';
import { StreamVideoGrid } from './components/StreamVideoGrid';

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

const App = () => {
    const [followedStreams, setFollowedStreams] = useState<Stream[]>([]);

    const pollFollowedStreams = async () => {
        const streamInfos = await Twitch.GetFollowedStreams();
        setFollowedStreams((prev) => {
            return streamInfos.map((si) => ({
                ...si,
                selected: prev.find((prevSI) => prevSI.user_id === si.user_id)?.selected ?? false,
            }));
        });
        getPromisedTimeout(PollIntervalMs).then(pollFollowedStreams);
    };

    useEffect(() => {
        Twitch.Authenticate();
        pollFollowedStreams();
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
                        setFollowedStreams={setFollowedStreams}
                    />
                </Paper>
                <StreamVideoGrid
                    followedStreams={followedStreams}
                    setFollowedStreams={setFollowedStreams}
                />
            </Box>
        </ThemeProvider>
    );
};

export default App;
