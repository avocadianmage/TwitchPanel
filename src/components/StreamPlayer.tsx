import { Box, Tooltip } from '@mui/material';
import { grey } from '@mui/material/colors';
import { Highlight } from '@mui/icons-material';
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

    const tooltipText = isSpotlit
        ? 'Turn off Spotlight'
        : spotlightActive
        ? 'Switch Spotlight'
        : 'Turn on Spotlight';

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
                        justifyContent: 'flex-start',
                        paddingLeft: '16px',
                    }}
                >
                    <Tooltip title={tooltipText} arrow disableInteractive>
                        <Box
                            onClick={onToggleSpotlight}
                            sx={{
                                pointerEvents: 'auto',
                                cursor: 'pointer',
                                background: 'rgba(0, 0, 0, 0.75)',
                                color: 'white',
                                padding: '12px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                '&:hover': { background: 'rgba(0, 0, 0, 0.9)' },
                            }}
                        >
                            <Highlight
                                sx={{
                                    fontSize: 32,
                                    transform: 'rotate(135deg)',
                                    color: isSpotlit ? grey[500] : undefined,
                                }}
                            />
                            {isSpotlit && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '12%',
                                        right: '12%',
                                        height: '3px',
                                        background: 'currentColor',
                                        borderRadius: '2px',
                                        transform: 'translateY(-50%) rotate(-45deg)',
                                        pointerEvents: 'none',
                                    }}
                                />
                            )}
                        </Box>
                    </Tooltip>
                </Box>
            )}
        </Box>
    );
};
