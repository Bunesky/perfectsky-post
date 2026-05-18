console.log("PerfectSky Post script loaded.");

const statusEl = document.getElementById("status");
const resultadoEl = document.getElementById("resultado");

// Trending feed (MIT published)
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

    const stats = analyze(posts);

    resultadoEl.textContent = generateText(stats);

    statusEl.textContent = "Analysis completed successfully";

  } catch (error) {
    console.error(error);

    statusEl.textContent = "Error loading feed";

    resultadoEl.textContent =
      "Could not analyze feed.\n\n" + error.message;
  }
}

function analyze(posts) {
  let totalChars = 0;
  let totalWords = 0;
  let totalHashtags = 0;

  let withImage = 0;
  let withVideo = 0;
  let noMedia = 0;

  let withLinks = 0;

  let replies = 0;
  let originals = 0;
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

    if (embedType.includes("images")) withImage++;
    else if (embedType.includes("video")) withVideo++;
    else noMedia++;

    const hasLink =
      text.includes("http://") ||
      text.includes("https://") ||
      embedType.includes("external");

    if (hasLink) withLinks++;

    if (item.reply) replies++;
    else if (embedType.includes("record")) quotes++;
    else originals++;
  }

  const total = posts.length;

  return {
    total,
    avgChars: Math.round(totalChars / total),
    avgWords: Math.round(totalWords / total),
    avgHashtags: (totalHashtags / total).toFixed(1),
    imagePct: percentage(withImage, total),
    videoPct: percentage(withVideo, total),
    noMediaPct: percentage(noMedia, total),
    linksPct: percentage(withLinks, total),
    repliesPct: percentage(replies, total),
    originalsPct: percentage(originals, total),
    quotesPct: percentage(quotes, total),
  };
}

function percentage(value, total) {
  return Math.round((value / total) * 100);
}

function generateText(stats) {
  return `
-----------------------------------------
|   Style Analysis (last 24h)           |
-----------------------------------------

Results:
• Posts analyzed: ${stats.total}
• Avg characters: ${stats.avgChars}
• Avg words: ${stats.avgWords}
• Avg hashtags: ${stats.avgHashtags}
• % with image: ${stats.imagePct}%
• % with video: ${stats.videoPct}%
• % without media: ${stats.noMediaPct}%
• % with links: ${stats.linksPct}%
• % replies: ${stats.repliesPct}%
• % originals: ${stats.originalsPct}%
• % quotes: ${stats.quotesPct}%
`;
}
