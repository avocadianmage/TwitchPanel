export const IsMobileDevice = /Mobi/i.test(window.navigator.userAgent);

export const GetPromisedTimeout = (ms: number) => new Promise((r) => setTimeout(r, ms));
