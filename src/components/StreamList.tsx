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
import { green, grey, purple, red } from '@mui/material/colors';
import { ChatBubble, Circle, Highlight } from '@mui/icons-material';
import { StreamAndUserInfo } from '../services/twitch';
import { TitleBar } from './TitleBar';
import { useState } from 'react';
import { Theme } from '@emotion/react';
import { IsMobileDevice } from '../services/utilities';
import { StorageModule } from '../services/storage';

export interface StreamListProps {
    followedStreams: StreamAndUserInfo[];
    selectedStreams: StreamAndUserInfo[];
    spotlightStreamId: string | undefined;
    streamChat: StreamAndUserInfo | undefined;
    toggleStreamSelect(stream: StreamAndUserInfo): void;
    toggleStreamSpotlight(stream: StreamAndUserInfo): void;
    toggleStreamChat(stream: StreamAndUserInfo): void;
}

export const TitleBarHeight = '64px';
export const CollapsedLeftRightPadding = '5px';
export const ExpandedLeftRightPadding = '16px';
const AvatarSize = '36px';
const JustifySpaceBetweenSx: SxProps<Theme> = {
    display: 'flex',
    justifyContent: 'space-between',
};

// The action buttons are sized explicitly rather than by their padding so that both are
// identical squares regardless of the size of the icon each one holds.
const ActionButtonSize = '28px';
const ActionsCornerRadius = '6px';
const ActionsBottomMargin = '4px';
// Space held open on the right of every expanded entry for its action buttons, so stream text
// and viewer counts stay aligned across entries regardless of which buttons an entry shows.
const OneActionWidth = '36px';
const TwoActionsWidth = '64px';

interface StreamActionButtonProps {
    onClick(): void;
    tooltipText: string;
    icon: React.ReactNode;
    isActiveOnThisStream: boolean;
}

const StreamActionButton = (props: StreamActionButtonProps) => {
    const { onClick, tooltipText, icon, isActiveOnThisStream } = props;
    return (
        <Tooltip title={tooltipText} placement='top' arrow disableInteractive>
            <IconButton
                onClick={onClick}
                sx={{
                    width: ActionButtonSize,
                    height: ActionButtonSize,
                    padding: 0,
                    flexShrink: 0,
                    borderRadius: 0,
                    background: 'rgba(0, 0, 0, 0.3)',
                    color: isActiveOnThisStream ? green[400] : grey[500],
                    // A button that is already on stays green on hover; the rest brighten to white.
                    '&:hover': {
                        background: 'rgba(0, 0, 0, 0.5)',
                        ...(!isActiveOnThisStream && { color: 'common.white' }),
                    },
                }}
            >
                {icon}
            </IconButton>
        </Tooltip>
    );
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
        spotlightStreamId,
        streamChat,
        toggleStreamSelect,
        toggleStreamSpotlight,
        toggleStreamChat,
    } = props;
    const leftRightPadding = collapsed ? CollapsedLeftRightPadding : ExpandedLeftRightPadding;

    // Spotlight is meaningless with fewer than two streams being watched.
    const canSpotlight = selectedStreams.length >= 2;
    const spotlightActive =
        canSpotlight && selectedStreams.some((s) => s.user_id === spotlightStreamId);
    const chatActive = !!streamChat;
    const actionsWidth = canSpotlight ? TwoActionsWidth : OneActionWidth;

    const StreamEntry = (stream: StreamAndUserInfo) => {
        const { user_id, user_name, game_name, title, viewer_count, userInfo } = stream;
        const selected = !!selectedStreams.find((ss) => ss.user_name === user_name);
        const isSpotlit = spotlightActive && spotlightStreamId === user_id;
        const isChatOpen = streamChat?.user_id === user_id;

        const spotlightTooltip = isSpotlit
            ? 'Turn off Spotlight'
            : spotlightActive
            ? 'Switch Spotlight'
            : 'Turn on Spotlight';

        const chatTooltip = isChatOpen ? 'Hide chat' : chatActive ? 'Switch chat' : 'Show chat';

        // Actions only apply to streams being watched, and there is no room for them while the
        // list is collapsed down to avatars. They are pinned flush to the entry's bottom right
        // corner over the space it holds open for them, so they never displace stream text.
        const actions = !collapsed && selected && (
            <Box
                sx={{
                    position: 'absolute',
                    right: 0,
                    bottom: ActionsBottomMargin,
                    display: 'flex',
                    alignItems: 'center',
                    // Round the block's outer left corners — whichever button leads it — so it
                    // reads as a tab tucked into the corner rather than a hard-edged bar.
                    '& > :first-of-type': {
                        borderTopLeftRadius: ActionsCornerRadius,
                        borderBottomLeftRadius: ActionsCornerRadius,
                    },
                }}
            >
                {canSpotlight && (
                    <StreamActionButton
                        onClick={() => toggleStreamSpotlight(stream)}
                        tooltipText={spotlightTooltip}
                        isActiveOnThisStream={isSpotlit}
                        icon={<Highlight sx={{ fontSize: 20, transform: 'rotate(135deg)' }} />}
                    />
                )}
                <StreamActionButton
                    onClick={() => toggleStreamChat(stream)}
                    tooltipText={chatTooltip}
                    isActiveOnThisStream={isChatOpen}
                    icon={<ChatBubble sx={{ fontSize: 16, transform: 'scaleX(-1)' }} />}
                />
            </Box>
        );

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
                                // Only the description shares a line with the action buttons, so
                                // it alone holds space open for them — the viewer count above
                                // keeps the full width and stays flush with the entry's gutter.
                                secondaryTypographyProps={{
                                    sx: { ...JustifySpaceBetweenSx, paddingRight: actionsWidth },
                                }}
                            />
                        )}
                    </ListItemButton>
                </Tooltip>
                {actions}
            </ListItem>
        );
    };

    return (
        <Paper elevation={1} sx={{ maxWidth: '360px', height: '100vh', overflow: 'hidden' }}>
            <TitleBar collapsed={collapsed} onCollapseToggle={onCollapseToggle} />
            <List
                sx={{
                    overflowY: 'auto',
                    height: `calc(100vh - ${TitleBarHeight})`,
                    // Selected and selected+hover states:
                    '&& .Mui-selected, && .Mui-selected:hover': {
                        bgcolor: purple[900],
                    },
                }}
                subheader={
                    <ListSubheader
                        sx={{
                            bgcolor: green[900],
                            p: `12px ${leftRightPadding}`,
                            lineHeight: 1.5,
                        }}
                    >
                        {collapsed ? '\u00A0' : 'Live Followed Channels'}
                    </ListSubheader>
                }
            >
                {followedStreams.map(StreamEntry)}
            </List>
        </Paper>
    );
};
