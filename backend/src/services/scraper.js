const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrape recent content from a YouTube or Instagram creator profile URL.
 * Returns an array of { title, description, platform } objects.
 */
async function scrapeCreatorContent(profileUrl) {
    const url = profileUrl.trim();

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return scrapeYouTube(url);
    } else if (url.includes('instagram.com')) {
        return scrapeInstagram(url);
    } else {
        throw new Error('Unsupported platform. Please provide a YouTube or Instagram URL.');
    }
}

// ── YouTube Scraper ──
async function scrapeYouTube(url) {
    try {
        // Normalize to channel/videos page
        let channelUrl = url;
        if (url.includes('/watch')) {
            // If it's a video URL, extract the channel from the video page first
            return scrapeYouTubeFromVideo(url);
        }
        // Make sure we're on the videos tab
        if (!channelUrl.endsWith('/videos')) {
            channelUrl = channelUrl.replace(/\/$/, '') + '/videos';
        }

        const { data: html } = await axios.get(channelUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            },
            timeout: 15000
        });

        // Extract ytInitialData JSON from the page
        const dataMatch = html.match(/var ytInitialData\s*=\s*(\{.+?\});\s*<\/script>/s);
        if (!dataMatch) {
            // Fallback: try to get video info from meta tags and links
            return scrapeYouTubeFallback(html, url);
        }

        const ytData = JSON.parse(dataMatch[1]);
        const videos = extractYouTubeVideos(ytData);

        if (videos.length === 0) {
            return scrapeYouTubeFallback(html, url);
        }

        // Get details for the top 3 videos
        const detailed = [];
        for (const vid of videos.slice(0, 3)) {
            try {
                const desc = await fetchYouTubeVideoDescription(vid.videoId);
                detailed.push({
                    title: vid.title,
                    description: desc || vid.description || '',
                    platform: 'YouTube'
                });
            } catch {
                detailed.push({
                    title: vid.title,
                    description: vid.description || '',
                    platform: 'YouTube'
                });
            }
        }

        return detailed;
    } catch (err) {
        console.error('YouTube scrape error:', err.message);
        throw new Error('Failed to scrape YouTube profile. Check the URL and try again.');
    }
}

function extractYouTubeVideos(ytData) {
    const videos = [];
    try {
        // Navigate the ytInitialData structure to find video renderers
        const tabs = ytData?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
        for (const tab of tabs) {
            const tabContent = tab?.tabRenderer?.content;
            if (!tabContent) continue;

            const richGridRenderer = tabContent?.richGridRenderer;
            if (!richGridRenderer) continue;

            for (const item of richGridRenderer.contents || []) {
                const videoRenderer = item?.richItemRenderer?.content?.videoRenderer;
                if (!videoRenderer) continue;

                videos.push({
                    videoId: videoRenderer.videoId,
                    title: videoRenderer.title?.runs?.[0]?.text || videoRenderer.title?.simpleText || '',
                    description: videoRenderer.descriptionSnippet?.runs?.map(r => r.text).join('') || ''
                });

                if (videos.length >= 3) break;
            }
            if (videos.length >= 3) break;
        }
    } catch (err) {
        console.error('Error parsing ytInitialData:', err.message);
    }
    return videos;
}

async function fetchYouTubeVideoDescription(videoId) {
    try {
        const { data: html } = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            },
            timeout: 10000
        });

        // Try to get description from meta tag
        const $ = cheerio.load(html);
        const metaDesc = $('meta[name="description"]').attr('content') || '';
        const ogDesc = $('meta[property="og:description"]').attr('content') || '';

        // Also try extracting from ytInitialPlayerResponse
        const playerMatch = html.match(/var ytInitialPlayerResponse\s*=\s*(\{.+?\});\s*(?:var|<\/script>)/s);
        if (playerMatch) {
            try {
                const playerData = JSON.parse(playerMatch[1]);
                const shortDesc = playerData?.videoDetails?.shortDescription || '';
                if (shortDesc) return shortDesc.slice(0, 500);
            } catch { }
        }

        return ogDesc || metaDesc || '';
    } catch {
        return '';
    }
}

function scrapeYouTubeFallback(html, url) {
    const $ = cheerio.load(html);
    const channelName = $('meta[property="og:title"]').attr('content') || 'Unknown Channel';
    const channelDesc = $('meta[property="og:description"]').attr('content') || '';

    // Return channel info as context
    return [{
        title: `Channel: ${channelName}`,
        description: channelDesc || 'Channel description not available',
        platform: 'YouTube'
    }];
}

async function scrapeYouTubeFromVideo(url) {
    try {
        const { data: html } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            },
            timeout: 15000
        });

        const $ = cheerio.load(html);
        const title = $('meta[name="title"]').attr('content') || $('meta[property="og:title"]').attr('content') || '';
        const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';

        // Try to get more from ytInitialPlayerResponse
        let fullDesc = description;
        const playerMatch = html.match(/var ytInitialPlayerResponse\s*=\s*(\{.+?\});\s*(?:var|<\/script>)/s);
        if (playerMatch) {
            try {
                const playerData = JSON.parse(playerMatch[1]);
                fullDesc = playerData?.videoDetails?.shortDescription || description;
            } catch { }
        }

        // Try to find the channel URL and get more videos
        const channelMatch = html.match(/"channelId":"([^"]+)"/);
        if (channelMatch) {
            try {
                const channelVideos = await scrapeYouTube(`https://www.youtube.com/channel/${channelMatch[1]}/videos`);
                // Add the current video at the top if not already there
                const currentVid = { title, description: fullDesc.slice(0, 500), platform: 'YouTube' };
                const others = channelVideos.filter(v => v.title !== title).slice(0, 2);
                return [currentVid, ...others];
            } catch { }
        }

        return [{
            title,
            description: fullDesc.slice(0, 500),
            platform: 'YouTube'
        }];
    } catch (err) {
        throw new Error('Failed to scrape YouTube video. Check the URL and try again.');
    }
}

// ── Instagram Scraper ──
async function scrapeInstagram(url) {
    try {
        // Clean up the URL
        let profileUrl = url.replace(/\/$/, '');
        if (!profileUrl.endsWith('/')) profileUrl += '/';

        const { data: html } = await axios.get(profileUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml'
            },
            timeout: 15000
        });

        const $ = cheerio.load(html);

        // Try to extract profile info from meta tags
        const ogTitle = $('meta[property="og:title"]').attr('content') || '';
        const ogDesc = $('meta[property="og:description"]').attr('content') || '';
        const metaDesc = $('meta[name="description"]').attr('content') || '';

        const description = ogDesc || metaDesc || '';

        // Try to extract data from embedded JSON
        let posts = [];
        const scripts = $('script[type="application/ld+json"]');
        scripts.each((_, el) => {
            try {
                const jsonData = JSON.parse($(el).html());
                if (jsonData.description) {
                    posts.push({ title: jsonData.name || 'Instagram Post', description: jsonData.description, platform: 'Instagram' });
                }
            } catch { }
        });

        // If we couldn't get individual posts, return profile-level data
        if (posts.length === 0) {
            // Parse the OG description which often contains follower count and bio
            posts = [{
                title: ogTitle || 'Instagram Profile',
                description: `Profile bio and stats: ${description}`,
                platform: 'Instagram'
            }];
        }

        return posts.slice(0, 3);
    } catch (err) {
        console.error('Instagram scrape error:', err.message);
        // Instagram is hard to scrape — provide a helpful error
        throw new Error(
            'Could not scrape Instagram profile (Instagram restricts automated access). ' +
            'Try using a YouTube URL instead, or describe your content style in the description field.'
        );
    }
}

module.exports = { scrapeCreatorContent };
