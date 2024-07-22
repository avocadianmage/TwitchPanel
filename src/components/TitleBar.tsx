import { Coffee, GitHub, LiveTv } from '@mui/icons-material';
import { AppBar, Box, IconButton, Toolbar, Tooltip, Typography } from '@mui/material';
import { repository, funding } from '../../package.json';

export const TitleBar = () => {
    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position='static'>
                <Toolbar disableGutters sx={{ p: '0 16px' }}>
                    <LiveTv sx={{ color: 'secondary.main' }} />
                    <Typography
                        variant='h6'
                        noWrap
                        sx={{
                            flexGrow: 1,
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: 'inherit',
                            textDecoration: 'none',
                            marginLeft: '1px',
                            marginTop: '1px',
                        }}
                    >
                        TWITCH
                        <Box component='span' sx={{ color: 'secondary.main' }}>
                            PANEL
                        </Box>
                    </Typography>
                    <Tooltip title='GitHub' disableInteractive>
                        <IconButton href={repository.url} target='_blank' color='inherit'>
                            <GitHub />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title='Buy me a coffee' disableInteractive>
                        <IconButton href={funding} target='_blank' color='inherit'>
                            <Coffee />
                        </IconButton>
                    </Tooltip>
                </Toolbar>
            </AppBar>
        </Box>
    );
};
