import { Box, Typography } from '@mui/material';
import { GetStreamVideoSrc } from '../services/twitch';

interface PlayerProps {
    channelName: string;
    initialMutedState: boolean;
    width: number;
    height: number;
    left: number;
    top: number;
    isSpotlit: boolean;
    spotlightActive: boolean;
    canSpotlight: boolean;
    onToggleSpotlight(): void;
}

export const StreamPlayer = (props: PlayerProps) => {
    const {
        channelName,
        initialMutedState,
        width,
        height,
        left,
        top,
        isSpotlit,
        spotlightActive,
        canSpotlight,
        onToggleSpotlight,
    } = props;
    const src = GetStreamVideoSrc(channelName, initialMutedState);

    const overlayText = isSpotlit
        ? 'Turn off Spotlight mode'
        : !spotlightActive
        ? 'Turn on Spotlight mode'
        : 'Switch Spotlight';

    return (
        <Box
            sx={{
                position: 'absolute',
                left,
                top,
                width,
                height,
                '&:hover .spotlight-overlay': { opacity: 1 },
            }}
        >
            <iframe
                src={src}
                width={width}
                height={height}
                allowFullScreen
                style={{ display: 'block' }}
            />
            {canSpotlight && (
                <Box
                    className='spotlight-overlay'
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0,
                        transition: 'opacity 0.15s ease',
                        pointerEvents: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Typography
                        onClick={onToggleSpotlight}
                        sx={{
                            pointerEvents: 'auto',
                            cursor: 'pointer',
                            background: 'rgba(0, 0, 0, 0.75)',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontWeight: 500,
                            userSelect: 'none',
                            '&:hover': { background: 'rgba(0, 0, 0, 0.9)' },
                        }}
                    >
                        {overlayText}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};
