console.log("PerfectSky Post script loaded.");

const statusEl = document.getElementById("status");
const resultadoEl = document.getElementById("resultado");

// NUEVO FEED: tu feed Trending publicado con MIT
const API_URL =
  "https://public.api.bsky.app/xrpc/app.bsky.feed.getFeed?feed=" +
  encodeURIComponent("at://did:plc:jlyxq2frdkpnkwhzldvmjlrv/app.bsky.feed.generator/aaadxgnfze66k");

init();

async function init() {
  try {
    statusEl.textContent = "Loading Bluesky feed...";

    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("HTTP Error " + response.status);
    }

    const data = await response.json();

    if (!data.feed || data.feed.length === 0) {
      throw new Error("Feed returned empty");
    }

    const posts = data.feed;

    const stats = analizar(posts);

    resultadoEl.textContent = generarTexto(stats);

    statusEl.textContent = "Analysis completed successfully";

    // Perfect Post del día
    document.getElementById("perfect-post").textContent =
      generarPerfectPost(stats);

  } catch (error) {
    console.error(error);

    statusEl.textContent = "Error loading feed";

    resultadoEl.textContent =
      "Could not analyze feed.\n\n" + error.message;
  }
}

function analizar(posts) {
  let totalChars = 0;
  let totalWords = 0;
  let totalHashtags = 0;

  let conImagen = 0;
  let conVideo = 0;
  let sinMedia = 0;

  let conLinks = 0;

  let respuestas = 0;
  let originales = 0;
  let quotes = 0;

  for (const item of posts) {
    const post = item.post;
    const text = post.record.text || "";

    totalChars += text.length;

    const words = text.trim().split(/\s+/).filter(Boolean);
    totalWords += words.length;

    const hashtags = text.match(/#\w+/g) || [];
    totalHashtags += hashtags.length;

    const embedType = post.embed?.$type || "";

    if (embedType.includes("images")) conImagen++;
    else if (embedType.includes("video")) conVideo++;
    else sinMedia++;

    const hasLink =
      text.includes("http://") ||
      text.includes("https://") ||
      embedType.includes("external");

    if (hasLink) conLinks++;

    if (item.reply) respuestas++;
    else if (embedType.includes("record")) quotes++;
    else originales++;
  }

  const total = posts.length;

  return {
    total,
    mediaChars: Math.round(totalChars / total),
    mediaPalabras: Math.round(totalWords / total),
    mediaHashtags: (totalHashtags / total).toFixed(1),
    imagenPct: porcentaje(conImagen, total),
    videoPct: porcentaje(conVideo, total),
    sinMediaPct: porcentaje(sinMedia, total),
    linksPct: porcentaje(conLinks, total),
    respuestasPct: porcentaje(respuestas, total),
    originalesPct: porcentaje(originales, total),
    quotesPct: porcentaje(quotes, total),
  };
}

function porcentaje(valor, total) {
  return Math.round((valor / total) * 100);
}

function generarTexto(stats) {
  return `
-----------------------------------------
|   Style Analysis (last 24h)           |
-----------------------------------------

Results:
• Posts analyzed: ${stats.total}
• Avg characters: ${stats.mediaChars}
• Avg words: ${stats.mediaPalabras}
• Avg hashtags: ${stats.mediaHashtags}
• % with image: ${stats.imagenPct}%
• % with video: ${stats.videoPct}%
• % without media: ${stats.sinMediaPct}%
• % with links: ${stats.linksPct}%
• % replies: ${stats.respuestasPct}%
• % originals: ${stats.originalesPct}%
• % quotes: ${stats.quotesPct}%
`;
}

function generarPerfectPost(stats) {
  return `
Perfect Post del día:
• Publicación original
• ${stats.mediaChars} caracteres
• ${stats.mediaPalabras} palabras
• Imagen: ${stats.imagenPct > 50 ? "sí" : "no"}
• Hashtags: ${stats.mediaHashtags > 0 ? "sí" : "no"}
• Enlaces: ${stats.linksPct > 0 ? "sí" : "no"}
• Video: ${stats.videoPct > 0 ? "sí" : "no"}
`;
}
