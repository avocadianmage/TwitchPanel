import { GetStreamChatSrc } from '../services/twitch';

export const StreamChat = (props: { stream: string }) => {
    return <iframe src={GetStreamChatSrc(props.stream, true)} />;
};
