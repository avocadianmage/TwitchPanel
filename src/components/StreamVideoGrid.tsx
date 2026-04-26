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

        // Orientation: use the strip that doesn't waste the spotlight's natural fit.
        // - For grids narrower than 16:9 (gridAspect <= streamAspect), the spotlight
        //   naturally fills width with leftover height — put thumbs at the bottom.
        // - For wider grids, the spotlight naturally fills height with leftover width
        //   — put thumbs on the right.
        const useBottom = width / height <= aspectRatio;

        // Minimum thumb height (px) for visibility. Small so the spotlight wins as much
        // of the area as possible; thumbs only grow above this when the grid actually
        // has the empty space to give.
        const minThumbH = 200;

        let thumbW: number;
        let thumbH: number;

        if (useBottom) {
            // Strip thickness ideally equals the height that the spotlight can't use
            // while filling width (the natural leftover). Capped by what fits n thumbs
            // in a single row, floored by minimum visibility.
            const naturalH = Math.max(0, height - width / aspectRatio);
            const fitH = width / (n * aspectRatio);
            thumbH = Math.max(Math.min(naturalH, fitH), Math.min(minThumbH, fitH));
            thumbW = thumbH * aspectRatio;
        } else {
            const naturalW = Math.max(0, width - height * aspectRatio);
            const fitW = (height / n) * aspectRatio;
            const minThumbW = minThumbH * aspectRatio;
            thumbW = Math.max(Math.min(naturalW, fitW), Math.min(minThumbW, fitW));
            thumbH = thumbW / aspectRatio;
        }

        // Spotlight fills the area not taken by the thumb strip, preserving 16:9.
        const spotAvailW = useBottom ? width : width - thumbW;
        const spotAvailH = useBottom ? height - thumbH : height;
        const spotW = Math.min(spotAvailW, spotAvailH * aspectRatio);
        const spotH = spotW / aspectRatio;

        // Center spotlight in its available area.
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
