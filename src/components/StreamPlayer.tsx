import { GetStreamVideoSrc } from '../services/twitch';

interface PlayerProps {
    channelName: string;
    initialMutedState: boolean;
    width: number;
    height: number;
    left: number;
    top: number;
}

export const StreamPlayer = (props: PlayerProps) => {
    const { channelName, initialMutedState, width, height, left, top } = props;
    const src = GetStreamVideoSrc(channelName, initialMutedState);

    return (
        <iframe
            src={src}
            width={width}
            height={height}
            allowFullScreen
            style={{ display: 'block', position: 'absolute', left, top }}
        />
    );
};
