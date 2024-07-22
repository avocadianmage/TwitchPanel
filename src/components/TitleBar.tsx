import { Coffee, GitHub, KeyboardTab, LiveTv } from '@mui/icons-material';
import { AppBar, Box, IconButton, Toolbar, Tooltip, Typography } from '@mui/material';
import { repository, funding } from '../../package.json';
import { CollapsedLeftRightPadding, ExpandedLeftRightPadding } from './StreamList';

export interface TitleBarProps {
    collapsed: boolean;
    onCollapseToggle(): void;
}

export const TitleBar = (props: TitleBarProps) => {
    const { collapsed, onCollapseToggle } = props;
    const leftRightPadding = collapsed ? CollapsedLeftRightPadding : ExpandedLeftRightPadding;
    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position='static'>
                <Toolbar disableGutters sx={{ p: `0 ${leftRightPadding}` }}>
                    {!collapsed && (
                        <>
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
                                <IconButton href={repository.url} target='_blank'>
                                    <GitHub />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title='Buy me a coffee' disableInteractive>
                                <IconButton href={funding} target='_blank'>
                                    <Coffee />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                    <Tooltip title={collapsed ? 'Expand' : 'Collapse'} disableInteractive>
                        <IconButton onClick={onCollapseToggle}>
                            <KeyboardTab sx={{ transform: collapsed ? 'none' : 'scaleX(-1)' }} />
                        </IconButton>
                    </Tooltip>
                </Toolbar>
            </AppBar>
        </Box>
    );
};
