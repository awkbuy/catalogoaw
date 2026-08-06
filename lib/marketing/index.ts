export { trackMarketingEvent } from "./events";
export type {
  MarketingEvent,
  MarketingEventData,
  MarketingEventName,
} from "./events";
export {
  getClientMarketingConfig,
  setClientMarketingConfig,
} from "./config";
export type { ClientMarketingConfig } from "./config";
export { initMetaPixel, metaTrack, metaTrackCustom } from "./meta";
export { clarityEvent, initClarity } from "./clarity";
