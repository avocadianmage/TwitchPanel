import {
    Avatar,
    Box,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemButton,
    ListItemText,
    ListSubheader,
    Paper,
    SxProps,
    Tooltip,
    Typography,
} from '@mui/material';
import { blue, green, purple, red } from '@mui/material/colors';
import { Circle, Clear } from '@mui/icons-material';
import { GameInfo, GetGameBoxArtUrl, StreamAndUserInfo } from '../services/twitch';
import { TitleBar } from './TitleBar';
import { GameSearch } from './GameSearch';
import { useEffect, useRef, useState } from 'react';
import { Theme } from '@emotion/react';
import { IsMobileDevice } from '../services/utilities';
import { StorageModule } from '../services/storage';

export interface StreamListProps {
    followedStreams: StreamAndUserInfo[];
    selectedStreams: StreamAndUserInfo[];
    trackedGames: GameInfo[];
    gameStreams: Record<string, StreamAndUserInfo[]>;
    toggleStreamSelect(stream: StreamAndUserInfo): void;
    addGame(game: GameInfo): void;
    removeGame(gameId: string): void;
}

export const TitleBarHeight = '64px';
export const CollapsedLeftRightPadding = '5px';
export const ExpandedLeftRightPadding = '16px';
const AvatarSize = '36px';
const JustifySpaceBetweenSx: SxProps<Theme> = {
    display: 'flex',
    justifyContent: 'space-between',
};

export const StreamList = (props: StreamListProps) => {
    const defaultCollapsedValue = StorageModule.GetStreamListCollapsed() ?? IsMobileDevice;
    const [collapsed, setCollapsed] = useState<boolean>(defaultCollapsedValue);

    const onCollapseToggle = () => {
        setCollapsed((prev) => {
            const value = !prev;
            StorageModule.SetStreamListCollapsed(value);
            return value;
        });
    };

    const {
        followedStreams,
        selectedStreams,
        trackedGames,
        gameStreams,
        toggleStreamSelect,
        addGame,
        removeGame,
    } = props;
    const leftRightPadding = collapsed ? CollapsedLeftRightPadding : ExpandedLeftRightPadding;

    // When a game is added (always appended last), scroll its new section into view, aligned
    // to the top so its rows are visible below the header once they load.
    const scrollBoxRef = useRef<HTMLDivElement>(null);
    const prevGameCount = useRef(trackedGames.length);
    useEffect(() => {
        if (trackedGames.length > prevGameCount.current) {
            scrollBoxRef.current?.lastElementChild?.scrollIntoView({
                block: 'start',
                behavior: 'smooth',
            });
        }
        prevGameCount.current = trackedGames.length;
    }, [trackedGames]);

    const subheaderBaseSx = {
        bgcolor: green[900],
        p: `12px ${leftRightPadding}`,
        lineHeight: 1.5,
    };

    const StreamEntry = (stream: StreamAndUserInfo) => {
        const { user_name, game_name, title, viewer_count, userInfo } = stream;
        const selected = !!selectedStreams.find((ss) => ss.user_name === user_name);

        const StreamEntryHeader = () => {
            const formattedViewerCount = viewer_count.toLocaleString(undefined, {
                useGrouping: true,
            });
            return (
                <>
                    {user_name}
                    <Box component='span' color={red[300]}>
                        <Circle sx={{ fontSize: 10 }} />
                        &nbsp;
                        <Typography component='span'>{formattedViewerCount}</Typography>
                    </Box>
                </>
            );
        };

        const StreamEntryDescription = () => {
            return (
                <Box component='span' sx={{ overflowX: 'hidden' }}>
                    {game_name}
                    &nbsp;—&nbsp;
                    <Typography component='span' variant='body2' color='text.primary'>
                        {title}
                    </Typography>
                </Box>
            );
        };

        return (
            <ListItem key={user_name} disablePadding>
                <Tooltip
                    title={user_name}
                    placement='right'
                    arrow
                    disableInteractive
                    disableHoverListener={!collapsed}
                    disableFocusListener={!collapsed}
                    disableTouchListener={!collapsed}
                >
                    <ListItemButton
                        selected={selected}
                        onClick={() => toggleStreamSelect(stream)}
                        sx={{ padding: `5px ${leftRightPadding}` }}
                    >
                        <ListItemAvatar sx={{ minWidth: AvatarSize }}>
                            <Avatar
                                src={userInfo.profile_image_url}
                                sx={{ width: AvatarSize, height: AvatarSize }}
                                variant='rounded'
                            />
                        </ListItemAvatar>
                        {!collapsed && (
                            <ListItemText
                                sx={{ paddingLeft: ExpandedLeftRightPadding }}
                                primary={<StreamEntryHeader />}
                                primaryTypographyProps={{ sx: JustifySpaceBetweenSx }}
                                secondary={<StreamEntryDescription />}
                                secondaryTypographyProps={{ sx: JustifySpaceBetweenSx }}
                            />
                        )}
                    </ListItemButton>
                </Tooltip>
            </ListItem>
        );
    };

    const GameSection = (game: GameInfo) => {
        // undefined means the game's streams have not been fetched yet (vs. none live).
        const streams: StreamAndUserInfo[] | undefined = gameStreams[game.id];
        // Channels already listed in the followed section are not repeated here.
        const dedupedStreams = streams?.filter(
            (s) => !followedStreams.some((fs) => fs.user_id === s.user_id)
        );
        return (
            <List
                key={game.id}
                disablePadding
                subheader={
                    <ListSubheader
                        sx={{
                            ...subheaderBaseSx,
                            bgcolor: blue[900],
                            ...(collapsed && { p: `4px ${leftRightPadding}` }),
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        {collapsed ? (
                            <Tooltip title={game.name} placement='right' arrow disableInteractive>
                                <Avatar
                                    src={GetGameBoxArtUrl(game, 52, 72)}
                                    sx={{ width: AvatarSize, height: AvatarSize }}
                                    variant='rounded'
                                />
                            </Tooltip>
                        ) : (
                            <>
                                <Box
                                    component='span'
                                    sx={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {game.name}
                                </Box>
                                <Tooltip title='Remove game' disableInteractive>
                                    <IconButton
                                        size='small'
                                        edge='end'
                                        onClick={() => removeGame(game.id)}
                                        // Overlap the header padding so the button does not
                                        // increase the header height.
                                        sx={{ my: '-6px' }}
                                    >
                                        <Clear fontSize='small' />
                                    </IconButton>
                                </Tooltip>
                            </>
                        )}
                    </ListSubheader>
                }
            >
                {dedupedStreams?.map(StreamEntry)}
                {!collapsed && streams !== undefined && dedupedStreams?.length === 0 && (
                    <ListItem sx={{ padding: `5px ${leftRightPadding}` }}>
                        <ListItemText
                            secondary={
                                streams.length > 0
                                    ? 'All live channels are followed'
                                    : 'No live channels'
                            }
                        />
                    </ListItem>
                )}
            </List>
        );
    };

    return (
        <Paper
            elevation={1}
            sx={{
                maxWidth: '360px',
                height: '100vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <TitleBar collapsed={collapsed} onCollapseToggle={onCollapseToggle} />
            <Box
                ref={scrollBoxRef}
                sx={{
                    overflowY: 'auto',
                    flex: 1,
                    // Selected and selected+hover states, for rows in every list below:
                    '&& .Mui-selected, && .Mui-selected:hover': {
                        bgcolor: purple[900],
                    },
                }}
            >
                <List
                    disablePadding
                    subheader={
                        <ListSubheader sx={subheaderBaseSx}>
                            {collapsed ? '\u00A0' : 'Live Followed Channels'}
                        </ListSubheader>
                    }
                >
                    {followedStreams.map(StreamEntry)}
                </List>
                {trackedGames.map(GameSection)}
            </Box>
            {!collapsed && (
                <Box sx={{ p: `8px ${leftRightPadding}`, borderTop: 1, borderColor: 'divider' }}>
                    <GameSearch addGame={addGame} />
                </Box>
            )}
        </Paper>
    );
};
