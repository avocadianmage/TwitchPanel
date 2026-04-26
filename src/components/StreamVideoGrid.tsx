import { useRef } from 'react';
import { useRect } from '../hooks/useRect';
import { Box } from '@mui/material';
import { AspectRatio, StreamAndUserInfo } from '../services/twitch';
import { StreamPlayer } from './StreamPlayer';

interface StreamVideoGridProps {
    selectedStreams: StreamAndUserInfo[];
    spotlightStreamId: string | undefined;
    toggleStreamSpotlight(stream: StreamAndUserInfo): void;
}

interface Layout {
    width: number;
    height: number;
    left: number;
    top: number;
}

export const StreamVideoGrid = (props: StreamVideoGridProps) => {
    const { selectedStreams, spotlightStreamId, toggleStreamSpotlight } = props;

    const divRef = useRef<HTMLDivElement>(null);
    const { width, height } = useRect(divRef);

    const aspectRatio = AspectRatio;
    const streamCount = selectedStreams.length;
    const canSpotlight = streamCount >= 2;
    const spotlightStream = spotlightStreamId
        ? selectedStreams.find((s) => s.user_id === spotlightStreamId)
        : undefined;
    const useSpotlight = !!spotlightStream && canSpotlight;
    const spotlightActive = useSpotlight;

    // Compute layout per stream by user_id so we can render in a stable order.
    // Stable render order is critical: reordering iframes in the DOM causes them to reload
    // (and pause), so all layout changes must happen via sx/attr updates only.
    const layouts = new Map<string, Layout>();

    if (useSpotlight && spotlightStream) {
        const n = streamCount - 1;

        // Bottom-strip layout: thumbnails in 1 row across the bottom.
        // Cap thumbnail thickness at 25% of cross dim to avoid degenerate sizes for small n.
        const bottomThumbH = Math.min(width / n / aspectRatio, height * 0.25);
        const bottomThumbW = bottomThumbH * aspectRatio;
        const bottomSpotW = Math.min(width, (height - bottomThumbH) * aspectRatio);

        // Right-strip layout: thumbnails in 1 column down the right edge.
        const rightThumbW = Math.min((height / n) * aspectRatio, width * 0.25);
        const rightThumbH = rightThumbW / aspectRatio;
        const rightSpotW = Math.min(width - rightThumbW, height * aspectRatio);

        // Pick the orientation that maximizes the spotlight stream's size.
        const useBottom = bottomSpotW >= rightSpotW;

        const spotW = useBottom ? bottomSpotW : rightSpotW;
        const spotH = spotW / aspectRatio;
        const thumbW = useBottom ? bottomThumbW : rightThumbW;
        const thumbH = useBottom ? bottomThumbH : rightThumbH;

        // Center spotlight in its available area.
        const spotAvailW = useBottom ? width : width - thumbW;
        const spotAvailH = useBottom ? height - thumbH : height;
        layouts.set(spotlightStream.user_id, {
            width: spotW,
            height: spotH,
            left: (spotAvailW - spotW) / 2,
            top: (spotAvailH - spotH) / 2,
        });

        // Center the thumbnail row/column within its strip.
        const totalThumbExtent = n * (useBottom ? thumbW : thumbH);
        const thumbStripStart = useBottom
            ? (width - totalThumbExtent) / 2
            : (height - totalThumbExtent) / 2;
        const thumbCrossPos = useBottom ? height - thumbH : width - thumbW;

        let thumbIdx = 0;
        selectedStreams.forEach((s) => {
            if (s.user_id === spotlightStreamId) return;
            const along = thumbStripStart + thumbIdx * (useBottom ? thumbW : thumbH);
            layouts.set(s.user_id, {
                width: thumbW,
                height: thumbH,
                left: useBottom ? along : thumbCrossPos,
                top: useBottom ? thumbCrossPos : along,
            });
            thumbIdx++;
        });
    } else {
        // Original grid optimizer: pick the X×Y configuration that maximizes tile size.
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

        selectedStreams.forEach((s, i) => {
            layouts.set(s.user_id, {
                width: bestVideoWidth,
                height: bestVideoHeight,
                left: (i % bestGridX) * bestVideoWidth,
                top: (Math.floor(i / bestGridX) % bestGridY) * bestVideoHeight,
            });
        });
    }

    return (
        <Box sx={{ flex: '1 0', position: 'relative', background: '#0a0a0a' }} ref={divRef}>
            {selectedStreams.map((s) => {
                const layout = layouts.get(s.user_id)!;
                return (
                    <StreamPlayer
                        key={s.user_name}
                        channelName={s.user_name}
                        initialMutedState={true}
                        width={layout.width}
                        height={layout.height}
                        left={layout.left}
                        top={layout.top}
                        isSpotlit={useSpotlight && s.user_id === spotlightStreamId}
                        spotlightActive={spotlightActive}
                        canSpotlight={canSpotlight}
                        onToggleSpotlight={() => toggleStreamSpotlight(s)}
                    />
                );
            })}
        </Box>
    );
};
