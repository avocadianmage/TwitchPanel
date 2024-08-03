import { Box, IconButton } from '@mui/material';
import { GetStreamChatSrc } from '../services/twitch';
import { Clear } from '@mui/icons-material';

export const StreamChat = (props: { stream: string; onClose(): void }) => {
    return (
        <Box sx={{ position: 'relative', overflow: 'hidden' }}>
            <iframe src={GetStreamChatSrc(props.stream, true)} height='100%' />
            <IconButton
                onClick={props.onClose}
                sx={{ position: 'absolute', left: '6px', top: '6px' }}
            >
                <Clear />
            </IconButton>
        </Box>
    );
};
