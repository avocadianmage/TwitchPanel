import { useEffect, useRef } from 'react';

declare global {
    interface Window {
        Twitch?: {
            Player: new (elementId: string, options: TwitchPlayerOptions) => TwitchPlayer;
        };
    }
}

interface TwitchPlayerOptions {
    channel: string;
    width: number | string;
    height: number | string;
    parent: string[];
    muted?: boolean;
}

interface TwitchPlayer {
    destroy(): void;
}

interface PlayerProps {
    channelName: string;
    initialMutedState: boolean;
    width: number;
    height: number;
    left: number;
    top: number;
}

// Track which channel each player div is showing to detect changes
const playerInstances = new Map<string, { player: TwitchPlayer; channel: string }>();

// Ensure Twitch script is loaded only once
let twitchScriptLoaded = false;
let twitchScriptLoading = false;
const loadTwitchScript = (): Promise<void> => {
    if (twitchScriptLoaded) return Promise.resolve();
    if (twitchScriptLoading) {
        return new Promise((resolve) => {
            const checkLoaded = setInterval(() => {
                if (twitchScriptLoaded) {
                    clearInterval(checkLoaded);
                    resolve();
                }
            }, 50);
        });
    }

    twitchScriptLoading = true;
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://player.twitch.tv/js/embed/v1.js';
        script.onload = () => {
            twitchScriptLoaded = true;
            resolve();
        };
        document.head.appendChild(script);
    });
};

export const StreamPlayer = (props: PlayerProps) => {
    const { channelName, initialMutedState, width, height, left, top } = props;
    const containerRef = useRef<HTMLDivElement>(null);
    const playerId = `twitch-player-${channelName}`;

    // Only recreate player when channel changes, not on resize
    useEffect(() => {
        let mounted = true;

        const initPlayer = async () => {
            await loadTwitchScript();
            
            if (!mounted || !containerRef.current || !window.Twitch) return;

            // Check if we already have a player for this div with the same channel
            const existing = playerInstances.get(playerId);
            if (existing && existing.channel === channelName) {
                return; // Player already exists for this channel
            }

            // Destroy existing player if channel changed
            if (existing) {
                existing.player.destroy();
                playerInstances.delete(playerId);
            }

            // Clear the container
            containerRef.current.innerHTML = '';
            
            // Create a div for the player
            const playerDiv = document.createElement('div');
            playerDiv.id = playerId;
            containerRef.current.appendChild(playerDiv);

            // Use 100% sizing - the iframe will inherit from the container
            const player = new window.Twitch.Player(playerId, {
                channel: channelName,
                width: '100%',
                height: '100%',
                parent: [window.location.hostname],
                muted: initialMutedState,
            });

            playerInstances.set(playerId, { player, channel: channelName });
        };

        initPlayer();

        return () => {
            mounted = false;
            // Clean up player on unmount
            const existing = playerInstances.get(playerId);
            if (existing) {
                existing.player.destroy();
                playerInstances.delete(playerId);
            }
        };
    }, [channelName, playerId, initialMutedState]); // Removed width/height - container CSS handles resizing

    return (
        <div
            ref={containerRef}
            style={{
                position: 'absolute',
                left,
                top,
                width,
                height,
                overflow: 'hidden',
            }}
        />
    );
};
