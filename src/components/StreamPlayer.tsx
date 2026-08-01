import { Box, IconButton, Tooltip } from '@mui/material';
import { green, grey } from '@mui/material/colors';
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

// The control buttons are sized explicitly rather than by their padding so that both are
// identical squares regardless of the size of the icon each one holds.
const ControlButtonSize = '28px';
const ControlsCornerRadius = '6px';

interface ControlButtonProps {
    onClick(): void;
    tooltipText: string;
    icon: React.ReactNode;
    isActiveOnThisStream: boolean;
}

const ControlButton = (props: ControlButtonProps) => {
    const { onClick, tooltipText, icon, isActiveOnThisStream } = props;
    return (
        <Tooltip title={tooltipText} placement='bottom' arrow disableInteractive>
            <IconButton
                onClick={onClick}
                sx={{
                    width: ControlButtonSize,
                    height: ControlButtonSize,
                    padding: 0,
                    flexShrink: 0,
                    borderRadius: 0,
                    // Darker than a comparable chip on a solid surface would need to be: these
                    // sit over arbitrary video and have to stay legible against a bright frame.
                    background: 'rgba(0, 0, 0, 0.6)',
                    color: isActiveOnThisStream ? green[400] : grey[500],
                    // A button that is already on stays green on hover; the rest brighten to white.
                    '&:hover': {
                        background: 'rgba(0, 0, 0, 0.8)',
                        ...(!isActiveOnThisStream && { color: 'common.white' }),
                    },
                }}
            >
                {icon}
            </IconButton>
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

    const chatTooltip = isChatOpen ? 'Hide chat' : chatActive ? 'Switch chat' : 'Show chat';

    return (
        <Box sx={{ position: 'absolute', left, top, width, height }}>
            <iframe
                src={src}
                width={width}
                height={height}
                allowFullScreen
                style={{ display: 'block' }}
            />
            {/* Pinned flush into the stream's top right corner and visible at all times, so the
                same control is always in the same place on every stream. The block is only as
                large as its buttons, leaving the rest of the player free to take mouse input. */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    display: 'flex',
                    // The block's bottom left corner is the only one that sits inside the video;
                    // rounding it alone makes it read as a tab tucked into the stream's corner,
                    // while its other two sides stay flush with the stream's own edges.
                    '& > :first-of-type': { borderBottomLeftRadius: ControlsCornerRadius },
                }}
            >
                {canSpotlight && (
                    <ControlButton
                        onClick={onToggleSpotlight}
                        tooltipText={spotlightTooltip}
                        isActiveOnThisStream={isSpotlit}
                        icon={<Highlight sx={{ fontSize: 20, transform: 'rotate(135deg)' }} />}
                    />
                )}
                <ControlButton
                    onClick={onToggleChat}
                    tooltipText={chatTooltip}
                    isActiveOnThisStream={isChatOpen}
                    icon={<ChatBubble sx={{ fontSize: 16, transform: 'scaleX(-1)' }} />}
                />
            </Box>
        </Box>
    );
};
