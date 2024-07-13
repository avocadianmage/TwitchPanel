import { useRef } from 'react';
import * as Twitch from '../services/twitch';
import { StreamListProps } from './StreamList';
import { useRect } from '../hooks/useRect';
import { Box } from '@mui/material';

interface PlayerProps {
    channelName: string;
    initialMutedState: boolean;
    width: number;
    height: number;
    left: number;
    top: number;
}

const StreamPlayer = (props: PlayerProps) => {
    const { channelName, initialMutedState, width, height, left, top } = props;
    const src = Twitch.GetStreamVideoSrc(channelName, initialMutedState);
    return (
        <iframe
            src={src}
            style={{ position: 'absolute', left, top, border: 'none' }}
            width={width}
            height={height}
            allowFullScreen
        />
    );
};

export const StreamVideoGrid = (props: StreamListProps) => {
    const { followedStreams } = props;
    const selectedStreams = followedStreams.filter((s) => s.selected);

    const divRef = useRef<HTMLDivElement>(null);
    const { width, height } = useRect(divRef);

    // Create video layout grid, optimizing for size of each video player.
    const streamCount = selectedStreams.length;
    const aspectRatio = Twitch.AspectRatio;

    let bestGridX = 0;
    let bestGridY = 0;
    let bestVideoWidth = 0;
    for (let gridX = 1; gridX <= streamCount; gridX++) {
        const gridY = Math.ceil(streamCount / gridX);

        // Skip any grid configurations that would mathematically not produce an optimal size.
        const gridEmptyCount = gridX * gridY - streamCount;
        if (gridEmptyCount >= gridX || gridEmptyCount >= gridY) continue;

        // Calculate video dimensions with necessary aspect ratio applied.
        const videoWidth = Math.min(width / gridX, (height / gridY) * aspectRatio);
        if (videoWidth > bestVideoWidth) {
            bestGridX = gridX;
            bestGridY = gridY;
            bestVideoWidth = videoWidth;
        }
    }
    const bestVideoHeight = bestVideoWidth / aspectRatio;

    return (
        <Box sx={{ flex: '1 0', position: 'relative' }} ref={divRef}>
            {selectedStreams.map((s, i) => {
                return (
                    <StreamPlayer
                        key={s.user_name}
                        channelName={s.user_name}
                        initialMutedState={true}
                        width={bestVideoWidth}
                        height={bestVideoHeight}
                        left={(i % bestGridX) * bestVideoWidth}
                        top={(Math.floor(i / bestGridX) % bestGridY) * bestVideoHeight}
                    />
                );
            })}
        </Box>
    );
};
