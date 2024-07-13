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

const App = () => {
    const [followedStreams, setFollowedStreams] = useState<Stream[]>([]);

    const loadFollowedStreams = async () => {
        const streamInfos = await Twitch.GetFollowedStreams();
        const streams = streamInfos.map((si) => ({ ...si, selected: false }));
        setFollowedStreams(streams);
    };

    useEffect(() => {
        Twitch.Authenticate();
        loadFollowedStreams();
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
