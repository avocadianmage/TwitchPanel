import { Box, Tooltip } from '@mui/material';
import { grey } from '@mui/material/colors';
import { ChatBubble, Highlight } from '@mui/icons-material';
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
    isChatOpen: boolean;
    chatActive: boolean;
    onToggleSpotlight(): void;
    onToggleChat(): void;
}

interface ControlButtonProps {
    onClick(): void;
    tooltipText: string;
    icon: React.ReactNode;
    isActiveOnThisStream: boolean;
}

const ControlButton = (props: ControlButtonProps) => {
    const { onClick, tooltipText, icon, isActiveOnThisStream } = props;
    return (
        <Tooltip title={tooltipText} arrow disableInteractive>
            <Box
                onClick={onClick}
                sx={{
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                    background: 'rgba(0, 0, 0, 0.75)',
                    color: 'white',
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    flexShrink: 0,
                    '&:hover': { background: 'rgba(0, 0, 0, 0.9)' },
                }}
            >
                {icon}
                {isActiveOnThisStream && (
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
    );
};

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
        isChatOpen,
        chatActive,
        onToggleSpotlight,
        onToggleChat,
    } = props;
    const src = GetStreamVideoSrc(channelName, initialMutedState);

    const spotlightTooltip = isSpotlit
        ? 'Turn off Spotlight'
        : spotlightActive
        ? 'Switch Spotlight'
        : 'Turn on Spotlight';

    const chatTooltip = isChatOpen
        ? 'Hide chat'
        : chatActive
        ? 'Switch chat'
        : 'Show chat';

    return (
        <Box
            sx={{
                position: 'absolute',
                left,
                top,
                width,
                height,
                '&:hover .controls-overlay': { opacity: 1 },
            }}
        >
            <iframe
                src={src}
                width={width}
                height={height}
                allowFullScreen
                style={{ display: 'block' }}
            />
            <Box
                className='controls-overlay'
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
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {canSpotlight && (
                        <ControlButton
                            onClick={onToggleSpotlight}
                            tooltipText={spotlightTooltip}
                            isActiveOnThisStream={isSpotlit}
                            icon={
                                <Highlight
                                    sx={{
                                        fontSize: 32,
                                        transform: 'rotate(135deg)',
                                        color: isSpotlit ? grey[500] : undefined,
                                    }}
                                />
                            }
                        />
                    )}
                    <ControlButton
                        onClick={onToggleChat}
                        tooltipText={chatTooltip}
                        isActiveOnThisStream={isChatOpen}
                        icon={
                            <ChatBubble
                                sx={{
                                    fontSize: 26,
                                    transform: 'scaleX(-1)',
                                    color: isChatOpen ? grey[500] : undefined,
                                }}
                            />
                        }
                    />
                </Box>
            </Box>
        </Box>
    );
};
