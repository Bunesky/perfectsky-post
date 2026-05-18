// PerfectSky Post - Full Metrics + Recommendation Version

console.log("PerfectSky Post script loaded.");

const resultsElement = document.getElementById("results");
const recommendationElement = document.getElementById("recommendation");

// Bluesky Top 24h feed
const FEED_URL =
  "https://public.api.bsky.app/xrpc/app.bsky.feed.getFeed?feed=at://did:plc:ewvi7hyq6g2bq6u7p5f4f6gn/app.bsky.feed.generator/top-24h&limit=30";

async function startAnalysis() {
  resultsElement.textContent = "Fetching data...";

  try {
    const response = await fetch(FEED_URL);
        const data = await response.json();

    // TEMP: show raw response to understand what Bluesky returns
    resultsElement.textContent = JSON.stringify(data, null, 2);

   if (!data.feed) {
  resultsElement.textContent = "RAW RESPONSE:\n\n" + JSON.stringify(data, null, 2);
  return;
}



    const posts = data.feed.map(item => item.post.record.text || "");

    const metrics = calculateMetrics(posts);
    const recommendation = generateRecommendation(metrics);

    resultsElement.textContent = formatMetrics(metrics);
    recommendationElement.textContent = recommendation;

  } catch (error) {
    resultsElement.textContent = "Error fetching data.";
    console.error(error);
  }
}

// ---------------------------
// METRICS CALCULATION
// ---------------------------

function calculateMetrics(posts) {
  const totalPosts = posts.length;

  const wordCounts = posts.map(t => t.split(/\s+/).filter(Boolean).length);
  const charCounts = posts.map(t => t.length);
  const hashtagCounts = posts.map(t => (t.match(/#/g) || []).length);
  const uppercasePercents = posts.map(t => {
    if (t.length === 0) return 0;
    const upper = t.replace(/[^A-Z]/g, "").length;
    return (upper / t.length) * 100;
  });

  const mediaImagePercent = percentageOf(posts, t => t.includes(".jpg") || t.includes(".png"));
  const mediaVideoPercent = percentageOf(posts, t => t.includes(".mp4") || t.includes(".mov"));
  const mediaNonePercent = 100 - (mediaImagePercent + mediaVideoPercent);

  const linkPercent = percentageOf(posts, t => t.includes("http"));

  const avgWords = average(wordCounts);
  const avgChars = average(charCounts);
  const avgHashtags = average(hashtagCounts);
  const avgUppercase = average(uppercasePercents);

  const readingTime = (avgWords / 200) * 60;

  return {
    totalPosts,
    avgWords,
    avgChars,
    avgHashtags,
    mediaImagePercent,
    mediaVideoPercent,
    mediaNonePercent,
    linkPercent,
    avgUppercase,
    readingTime
  };
}

// ---------------------------
// RECOMMENDATION ENGINE
// ---------------------------

function generateRecommendation(m) {
  const idealWords = Math.round(m.avgWords);
  const idealChars = Math.round(m.avgChars);
  const idealHashtags = Math.round(m.avgHashtags);
  const idealUpper = Math.round(m.avgUppercase);
  const idealReading = Math.round(m.readingTime);

  return (
    "Based on the top-performing posts:\n\n" +
    `• Ideal word count: ${idealWords}\n` +
    `• Ideal character count: ${idealChars}\n` +
    `• Suggested hashtags: ${idealHashtags}\n` +
    `• Uppercase usage: ${idealUpper}%\n` +
    `• Reading time: ${idealReading} seconds\n\n` +
    "This template reflects the average style of the most successful posts in the last 24 hours."
  );
}

// ---------------------------
// HELPERS
// ---------------------------

function average(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function percentageOf(arr, fn) {
  const count = arr.filter(fn).length;
  return (count / arr.length) * 100;
}

function formatMetrics(m) {
  return (
    "METRICS (Last 24h)\n\n" +
    `Total posts analyzed: ${m.totalPosts}\n\n` +
    `Average words: ${m.avgWords.toFixed(2)}\n` +
    `Average characters: ${m.avgChars.toFixed(2)}\n` +
    `Average hashtags: ${m.avgHashtags.toFixed(2)}\n\n` +
    `Posts with images: ${m.mediaImagePercent.toFixed(1)}%\n` +
    `Posts with videos: ${m.mediaVideoPercent.toFixed(1)}%\n` +
    `Posts with no media: ${m.mediaNonePercent.toFixed(1)}%\n\n` +
    `Posts with links: ${m.linkPercent.toFixed(1)}%\n` +
    `Uppercase usage: ${m.avgUppercase.toFixed(1)}%\n\n` +
    `Estimated reading time: ${m.readingTime.toFixed(1)} seconds\n`
  );
}

// Run on page load
startAnalysis();
