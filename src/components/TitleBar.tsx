import { Coffee, GitHub, LiveTv } from "@mui/icons-material";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { repository, funding } from '../../package.json';

export const TitleBar = () => {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
            }}
            padding='8px 8px 8px 16px'
        >
            <Typography
                fontFamily='Noto Sans'
                fontSize='1.5rem'
                fontWeight='600'
                color='primary.light'
            >
                <LiveTv sx={{ color: 'secondary.dark' }} />
                <Box component='span' sx={{ verticalAlign: 'text-bottom' }}>
                    &nbsp;TWITCH PANEL
                </Box>
            </Typography>
            <Box component='span'>
                <Tooltip title='GitHub' disableInteractive>
                    <IconButton href={repository.url} target='_blank'>
                        <GitHub />
                    </IconButton>
                </Tooltip>
                <Tooltip title='Buy me a coffee' disableInteractive>
                    <IconButton href={funding} target='_blank'>
                        <Coffee />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );
};
