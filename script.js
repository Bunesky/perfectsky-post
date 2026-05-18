const statusEl = document.getElementById("status");
const resultadoEl = document.getElementById("resultado");

const API_URL =
  "https://public.api.bsky.app/xrpc/app.bsky.feed.getFeed?feed=at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot&limit=30";

init();

async function init() {

  try {

    statusEl.textContent = "Cargando feed de Bluesky...";

    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Error HTTP " + response.status);
    }

    const data = await response.json();

    if (!data.feed || data.feed.length === 0) {
      throw new Error("El feed llegó vacío");
    }

    const posts = data.feed;

    const stats = analizar(posts);

    resultadoEl.textContent = generarTexto(stats);

    statusEl.textContent =
      "Análisis completado correctamente";

  } catch (error) {

    console.error(error);

    statusEl.textContent =
      "Error cargando feed";

    resultadoEl.textContent =
      "No se pudo analizar el feed.\n\n" +
      error.message;
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

    const words =
      text.trim().split(/\s+/).filter(Boolean);

    totalWords += words.length;

    const hashtags =
      text.match(/#\w+/g) || [];

    totalHashtags += hashtags.length;

    const embedType =
      post.embed?.$type || "";

    if (embedType.includes("images")) {
      conImagen++;
    }
    else if (embedType.includes("video")) {
      conVideo++;
    }
    else {
      sinMedia++;
    }

    const hasLink =
      text.includes("http://") ||
      text.includes("https://") ||
      embedType.includes("external");

    if (hasLink) {
      conLinks++;
    }

    if (item.reply) {
      respuestas++;
    }
    else if (embedType.includes("record")) {
      quotes++;
    }
    else {
      originales++;
    }
  }

  const total = posts.length;

  const mediaPalabras =
    totalWords / total;

  const mediaChars =
    totalChars / total;

  const mediaHashtags =
    totalHashtags / total;

  return {

    total,

    mediaChars:
      Math.round(mediaChars),

    mediaPalabras:
      Math.round(mediaPalabras),

    mediaHashtags:
      mediaHashtags.toFixed(1),

    imagenPct:
      porcentaje(conImagen, total),

    videoPct:
      porcentaje(conVideo, total),

    sinMediaPct:
      porcentaje(sinMedia, total),

    linksPct:
      porcentaje(conLinks, total),

    respuestasPct:
      porcentaje(respuestas, total),

    originalesPct:
      porcentaje(originales, total),

    quotesPct:
      porcentaje(quotes, total),

    recomendacion: {

      palabras:
        Math.round(mediaPalabras),

      hashtags:
        Math.round(mediaHashtags),

      media:
        recomendarMedia(
          conImagen,
          conVideo,
          sinMedia
        ),

      links:
        conLinks > total / 2
          ? "usar enlaces"
          : "no usar enlaces",

      tipo:
        recomendarTipo(
          respuestas,
          originales,
          quotes
        )
    }
  };
}

function porcentaje(valor, total) {
  return Math.round((valor / total) * 100);
}

function recomendarMedia(
  img,
  vid,
  none
) {

  if (img >= vid && img >= none) {
    return "usar imagen";
  }

  if (vid >= img && vid >= none) {
    return "usar vídeo";
  }

  return "sin media";
}

function recomendarTipo(
  respuestas,
  originales,
  quotes
) {

  if (
    respuestas >= originales &&
    respuestas >= quotes
  ) {
    return "respuesta";
  }

  if (
    originales >= respuestas &&
    originales >= quotes
  ) {
    return "post normal";
  }

  return "quote";
}

function generarTexto(stats) {

  return `
-----------------------------------------
|   Análisis de estilo (últimas 24h)    |
-----------------------------------------

Resultados:
• Posts analizados: ${stats.total}
• Media de caracteres: ${stats.mediaChars}
• Media de palabras: ${stats.mediaPalabras}
• Media de hashtags: ${stats.mediaHashtags}
• % con imagen: ${stats.imagenPct}%
• % con vídeo: ${stats.videoPct}%
• % sin media: ${stats.sinMediaPct}%
• % con enlaces: ${stats.linksPct}%
• % respuestas: ${stats.respuestasPct}%
• % originales: ${stats.originalesPct}%
• % quotes: ${stats.quotesPct}%

Recomendación aproximada:
• ${stats.recomendacion.palabras} palabras
• ${stats.recomendacion.hashtags} hashtags
• ${stats.recomendacion.media}
• ${stats.recomendacion.links}
• tipo de post: ${stats.recomendacion.tipo}
`;
}
