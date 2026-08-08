import { useEffect, useRef, useState } from 'react';
import { Box, createTheme, CssBaseline, GlobalStyles, ThemeProvider } from '@mui/material';
import { StreamList } from './components/StreamList';
import { StreamVideoGrid } from './components/StreamVideoGrid';
import {
    Authenticate,
    GameInfo,
    GetFollowedStreams,
    GetStreamsByGame,
    GetStreamsByUserIds,
    StreamAndUserInfo,
} from './services/twitch';
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

const App = () => {
    const [followedStreams, setFollowedStreams] = useState<StreamAndUserInfo[]>([]);
    const [selectedStreams, setSelectedStreams] = useState<StreamAndUserInfo[]>([]);
    const [streamChat, setStreamChat] = useState<StreamAndUserInfo>();
    const [spotlightStreamId, setSpotlightStreamId] = useState<string | undefined>();
    const [trackedGames, setTrackedGames] = useState<GameInfo[]>(
        () => StorageModule.GetTrackedGames() ?? []
    );
    const [gameStreams, setGameStreams] = useState<Record<string, StreamAndUserInfo[]>>({});

    // The poll loop's closure is created once on mount, so it reads these through refs kept
    // current on every render.
    const trackedGamesRef = useRef(trackedGames);
    trackedGamesRef.current = trackedGames;
    const selectedStreamsRef = useRef(selectedStreams);
    selectedStreamsRef.current = selectedStreams;

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
                // If it was the spotlit stream, turn off spotlight.
                setSpotlightStreamId((prev) => {
                    const value = prev !== stream.user_id ? prev : undefined;
                    StorageModule.SetSpotlightStreamId(value);
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

    const toggleStreamSpotlight = (stream: StreamAndUserInfo) => {
        setSpotlightStreamId((prev) => {
            const value = prev === stream.user_id ? undefined : stream.user_id;
            StorageModule.SetSpotlightStreamId(value);
            return value;
        });
    };

    const addGame = async (game: GameInfo) => {
        if (trackedGames.some((g) => g.id === game.id)) return;

        setTrackedGames((prev) => {
            if (prev.some((g) => g.id === game.id)) return prev;
            const value = [...prev, game];
            StorageModule.SetTrackedGames(value);
            return value;
        });

        // Fetch the game's streams immediately instead of waiting for the next poll.
        try {
            const streams = await GetStreamsByGame(game.id);
            setGameStreams((prev) => ({ ...prev, [game.id]: streams }));
        } catch (error) {
            console.error(error);
        }
    };

    const removeGame = (gameId: string) => {
        setTrackedGames((prev) => {
            const value = prev.filter((g) => g.id !== gameId);
            StorageModule.SetTrackedGames(value);
            return value;
        });
        setGameStreams((prev) => {
            const value = { ...prev };
            delete value[gameId];
            return value;
        });
    };

    const pollStreams = async (isFirstPoll: boolean) => {
        try {
            // Fetch followed streams and every tracked game's streams in parallel.
            const gamesToPoll = trackedGamesRef.current;
            const [latestFollowedStreams, latestGameStreamsList] = await Promise.all([
                GetFollowedStreams(),
                Promise.all(gamesToPoll.map((game) => GetStreamsByGame(game.id))),
            ]);
            const latestGameStreams: Record<string, StreamAndUserInfo[]> = {};
            gamesToPoll.forEach((game, i) => {
                latestGameStreams[game.id] = latestGameStreamsList[i];
            });

            // Every stream seen online this poll, from any source.
            const onlineIds = new Set(
                [...latestFollowedStreams, ...latestGameStreamsList.flat()].map((s) => s.user_id)
            );

            // Directly verify liveness of selected streams not seen above (e.g. selected from
            // a game section that was since removed, or whose top streams they dropped out of).
            const selectedCandidates = isFirstPoll
                ? StorageModule.GetSelectedStreams() ?? []
                : selectedStreamsRef.current;
            const idsToVerify = [
                ...new Set(
                    selectedCandidates.map((s) => s.user_id).filter((id) => !onlineIds.has(id))
                ),
            ];
            const checkedIds = new Set([...onlineIds, ...idsToVerify]);
            const verifiedStreams = await GetStreamsByUserIds(idsToVerify);
            verifiedStreams.forEach((s) => onlineIds.add(s.user_id));

            setFollowedStreams(latestFollowedStreams);
            setGameStreams((prev) => {
                // Rebuild from the current tracked list so games removed mid-poll are
                // dropped and results stored by a concurrent addGame are kept.
                const value: Record<string, StreamAndUserInfo[]> = {};
                for (const game of trackedGamesRef.current) {
                    const streams: StreamAndUserInfo[] | undefined =
                        latestGameStreams[game.id] ?? prev[game.id];
                    if (streams !== undefined) value[game.id] = streams;
                }
                return value;
            });

            if (isFirstPoll) {
                // If the page just loaded in:

                // Try to select the same streams from last time if they are still online.
                let streamsToSelect = selectedCandidates.filter((s) => onlineIds.has(s.user_id));
                if (streamsToSelect.length === 0 && latestFollowedStreams.length > 0) {
                    streamsToSelect = [latestFollowedStreams[0]];
                }
                setSelectedStreams(streamsToSelect);
                StorageModule.SetSelectedStreams(streamsToSelect);

                // Try to open same chat from last time, if it is still online.
                const storedStreamChat = StorageModule.GetStreamChat();
                const chatToRestore =
                    storedStreamChat !== undefined && onlineIds.has(storedStreamChat.user_id)
                        ? storedStreamChat
                        : undefined;
                updateStreamChat(chatToRestore);

                // Try to restore spotlight from last time, if its stream is still selected
                // and there are at least 2 selected streams (spotlight is meaningless otherwise).
                const storedSpotlightId = StorageModule.GetSpotlightStreamId();
                const validSpotlight =
                    storedSpotlightId !== undefined &&
                    streamsToSelect.length >= 2 &&
                    streamsToSelect.some((s) => s.user_id === storedSpotlightId);
                const spotlightToSet = validSpotlight ? storedSpotlightId : undefined;
                setSpotlightStreamId(spotlightToSet);
                StorageModule.SetSpotlightStreamId(spotlightToSet);
            } else {
                // Unselect streams that were checked this poll and found offline. Streams
                // selected while the poll was in flight (not yet checked) are kept.
                setSelectedStreams((prev) => {
                    const value = prev.filter(
                        (s) => onlineIds.has(s.user_id) || !checkedIds.has(s.user_id)
                    );
                    StorageModule.SetSelectedStreams(value);
                    // If the spotlit stream went offline, clear spotlight.
                    setSpotlightStreamId((spotPrev) => {
                        if (spotPrev === undefined) return spotPrev;
                        const stillSelected = value.some((s) => s.user_id === spotPrev);
                        if (stillSelected) return spotPrev;
                        StorageModule.SetSpotlightStreamId(undefined);
                        return undefined;
                    });
                    return value;
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            GetPromisedTimeout(PollIntervalMs).then(() => pollStreams(false));
        }
    };

    useEffect(() => {
        if (IsPollingStarted) return;
        IsPollingStarted = true;

        Authenticate();
        pollStreams(true);
    }, []);

    return (
        <ThemeProvider theme={darkTheme}>
            <GlobalStyles styles={{ iframe: { border: 'none' } }} />
            <CssBaseline />
            <Box sx={{ display: 'flex' }}>
                <StreamList
                    followedStreams={followedStreams}
                    selectedStreams={selectedStreams}
                    trackedGames={trackedGames}
                    gameStreams={gameStreams}
                    toggleStreamSelect={toggleStreamSelect}
                    addGame={addGame}
                    removeGame={removeGame}
                />
                <StreamVideoGrid
                    selectedStreams={selectedStreams}
                    spotlightStreamId={spotlightStreamId}
                    streamChat={streamChat}
                    toggleStreamSpotlight={toggleStreamSpotlight}
                    toggleStreamChat={toggleStreamChat}
                />
                {streamChat && (
                    <StreamChat
                        stream={streamChat.user_login ?? streamChat.user_name}
                        onClose={() => updateStreamChat(undefined)}
                    />
                )}
            </Box>
        </ThemeProvider>
    );
};

export default App;
