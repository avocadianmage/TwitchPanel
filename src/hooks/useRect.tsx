import { RefObject, useEffect, useState } from "react";

export const useRect = (nodeRef: RefObject<HTMLElement>) => {
    const [rect, setRect] = useState<DOMRect>(new DOMRect());
    useEffect(() => {
        const updateRect = () => setRect(nodeRef.current!.getBoundingClientRect());
        new ResizeObserver(updateRect).observe(nodeRef.current!);
        updateRect();
    }, [nodeRef]);
    return rect;
};
