export function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  let clean = url.trim();
  if (/^(youtu\.be\/|www\.youtube\.com\/|youtube\.com\/|m\.youtube\.com\/)/.test(clean) && !/^https?:\/\//i.test(clean)) {
    clean = `https://${clean}`;
  }
  try {
    const u = new URL(clean);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtu.be") {
      const id = u.pathname.split("/")[1];
      return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname === "/watch") {
        const id = u.searchParams.get("v");
        return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
      }
      const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})$/);
      return m ? m[1] : null;
    }
    return null;
  } catch {
    return null;
  }
}

export function getYouTubeEmbedUrl(url: string): string | null {
  const id = getYouTubeVideoId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}
