export const META_GRAPH_VERSION = "v19.0";
export const META_GRAPH_BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

export interface CapiCustomData {
  content_ids?: string[];
  content_type?: string;
  content_name?: string;
  content_category?: string;
  value?: number;
  currency?: string;
  quantity?: number;
  search_string?: string;
  source?: string;
}

export interface CapiEvent {
  event: string;
  event_id: string;
  data: CapiCustomData;
}

export interface SendCapiOptions {
  pixelId: string;
  accessToken: string;
  testEventCode?: string;
  userAgent?: string;
  eventSourceUrl?: string;
  fbp?: string;
  fbc?: string;
}

export function buildCapiPayload(event: CapiEvent, options: SendCapiOptions) {
  return {
    data: [
      {
        event_name: event.event,
        event_time: Math.floor(Date.now() / 1000),
        event_id: event.event_id,
        action_source: "website",
        event_source_url: options.eventSourceUrl,
        user_data: {
          client_user_agent: options.userAgent || "",
          ...(options.fbp ? { fbp: options.fbp } : {}),
          ...(options.fbc ? { fbc: options.fbc } : {}),
        },
        custom_data: event.data,
      },
    ],
    ...(options.testEventCode ? { test_event_code: options.testEventCode } : {}),
    access_token: options.accessToken,
  };
}

export async function sendMetaCapiEvent(
  event: CapiEvent,
  options: SendCapiOptions
): Promise<Response> {
  const payload = buildCapiPayload(event, options);
  return fetch(`${META_GRAPH_BASE}/${options.pixelId}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(5000),
  });
}
