import { SetStateAction } from 'react';
import * as Twitch from '../services/twitch';
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

export interface Stream extends Twitch.StreamAndUserInfo {
    selected: boolean;
}

export interface StreamListProps {
    followedStreams: Stream[];
    setFollowedStreams(value: SetStateAction<Stream[]>): void;
}

export const StreamList = (props: StreamListProps) => {
    const { followedStreams, setFollowedStreams } = props;
    return (
        <List
            subheader={
                <ListSubheader sx={{ bgcolor: purple[900], p: '12px 16px', lineHeight: 1.5 }}>
                    Live Followed Channels
                </ListSubheader>
            }
        >
            {followedStreams.map((stream) => {
                const { user_name, game_name, title, viewer_count, userInfo, selected } = stream;

                const handleSelectToggle = () => {
                    setFollowedStreams((prev) =>
                        prev.map((s) =>
                            s.user_name === user_name ? { ...s, selected: !selected } : s
                        )
                    );
                };
                const AvatarSize = 32;
                return (
                    <ListItem key={user_name} disablePadding>
                        <ListItemButton
                            selected={selected}
                            onClick={handleSelectToggle}
                            sx={{ paddingTop: '5px', paddingBottom: '5px' }}
                        >
                            <ListItemAvatar
                                sx={{ minWidth: AvatarSize + 'px', paddingRight: '16px' }}
                            >
                                <Avatar
                                    src={userInfo.profile_image_url}
                                    sx={{ width: AvatarSize, height: AvatarSize }}
                                    variant='rounded'
                                />
                            </ListItemAvatar>
                            <ListItemText
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
                        </ListItemButton>
                    </ListItem>
                );
            })}
        </List>
    );
};
