import {
    Avatar,
    Box,
    List,
    ListItem,
    ListItemAvatar,
    ListItemButton,
    ListItemText,
    ListSubheader,
    Typography,
} from '@mui/material';
import { purple, red } from '@mui/material/colors';
import { Circle } from '@mui/icons-material';
import { StreamAndUserInfo } from '../services/twitch';
import { TitleBar } from './TitleBar';
import { useState } from 'react';

export interface StreamListProps {
    followedStreams: StreamAndUserInfo[];
    selectedStreams: StreamAndUserInfo[];
    toggleStreamSelect(stream: StreamAndUserInfo): void;
}

export const CollapsedLeftRightPadding = '5px';
export const ExpandedLeftRightPadding = '16px';

export const StreamList = (props: StreamListProps) => {
    const [collapsed, setCollapsed] = useState<boolean>(false);

    const onCollapseToggle = () => {
        setCollapsed((prev) => !prev);
    };

    const { followedStreams, selectedStreams, toggleStreamSelect } = props;
    const leftRightPadding = collapsed ? CollapsedLeftRightPadding : ExpandedLeftRightPadding;
    
    return (
        <>
            <TitleBar collapsed={collapsed} onCollapseToggle={onCollapseToggle} />
            <List
                subheader={
                    <ListSubheader
                        sx={{
                            bgcolor: purple[900],
                            p: `12px ${leftRightPadding}`,
                            lineHeight: 1.5,
                        }}
                    >
                        {collapsed ? '\u00A0' : 'Live Followed Channels'}
                    </ListSubheader>
                }
            >
                {followedStreams.map((stream) => {
                    const { user_name, game_name, title, viewer_count, userInfo } = stream;
                    const selected = !!selectedStreams.find((ss) => ss.user_name === user_name);
                    const AvatarSize = 36;

                    return (
                        <ListItem key={user_name} disablePadding>
                            <ListItemButton
                                selected={selected}
                                onClick={() => toggleStreamSelect(stream)}
                                sx={{ padding: `5px ${leftRightPadding}` }}
                            >
                                <ListItemAvatar sx={{ minWidth: AvatarSize + 'px' }}>
                                    <Avatar
                                        src={userInfo.profile_image_url}
                                        sx={{ width: AvatarSize, height: AvatarSize }}
                                        variant='rounded'
                                    />
                                </ListItemAvatar>
                                {!collapsed && (
                                    <ListItemText
                                        sx={{ paddingLeft: ExpandedLeftRightPadding }}
                                        primary={
                                            <>
                                                {user_name}
                                                <Box component='span' color={red[300]}>
                                                    <Circle sx={{ fontSize: 10 }} />
                                                    &nbsp;
                                                    <Typography component='span'>
                                                        {viewer_count.toLocaleString(undefined, {
                                                            useGrouping: true,
                                                        })}
                                                    </Typography>
                                                </Box>
                                            </>
                                        }
                                        primaryTypographyProps={{
                                            sx: {
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                            },
                                        }}
                                        secondary={
                                            <>
                                                {game_name}
                                                &nbsp;—&nbsp;
                                                <Typography
                                                    component='span'
                                                    variant='body2'
                                                    color='text.primary'
                                                >
                                                    {title}
                                                </Typography>
                                            </>
                                        }
                                    />
                                )}
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
        </>
    );
};
