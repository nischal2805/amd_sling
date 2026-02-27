const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-20250514';

/**
 * Parse a sponsorship/brand deal email and extract structured data.
 */
async function parseEmailForDeal(emailText) {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are an expert at parsing brand sponsorship emails for content creators. 
Extract deal information from this email and return a JSON object with these fields:
- brand_name (string or null)
- deal_title (string or null)
- estimated_value (number or null)
- currency (string, default "USD")
- deliverables (array of strings)
- posting_deadline (ISO date string or null)
- stage (one of: "inbound", "negotiation", "contract_sent", "in_production", "completed", "cancelled")
- notes (string or null)
- contact_name (string or null)
- contact_email (string or null)

Return ONLY valid JSON, no other text.

Email:
${emailText}`,
      },
    ],
  });

  const text = message.content[0].text.trim();
  // Strip markdown code fences if present
  const json = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  return JSON.parse(json);
}

/**
 * Suggest a rate for a sponsorship deal based on creator stats.
 */
async function suggestRate({ niche, platform, followerCount, engagementRate, deliverables, brandBudgetHistory }) {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are an expert sponsorship rate negotiation advisor for content creators.
Based on the following creator and deal information, suggest an appropriate rate.

Creator Info:
- Niche: ${niche || 'Not specified'}
- Platform: ${platform || 'Not specified'}
- Follower Count: ${followerCount || 'Unknown'}
- Engagement Rate: ${engagementRate ? engagementRate + '%' : 'Unknown'}

Deliverables: ${deliverables ? JSON.stringify(deliverables) : 'Not specified'}
Brand Budget History: ${brandBudgetHistory ? JSON.stringify(brandBudgetHistory) : 'Not available'}

Return a JSON object with:
- suggested_rate (number, in USD)
- rate_range (object with "low" and "high" numbers)
- rationale (string explaining the recommendation)
- negotiation_tips (array of strings)

Return ONLY valid JSON, no other text.`,
      },
    ],
  });

  const text = message.content[0].text.trim();
  const json = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  return JSON.parse(json);
}

/**
 * Draft a professional email response for a deal at a specific stage.
 */
async function draftResponse({ dealTitle, brandName, stage, userAction, originalEmailSnippet, creatorName }) {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are an expert at writing professional sponsorship negotiation emails for content creators.

Draft a professional email response for the following situation:
- Creator Name: ${creatorName || 'Creator'}
- Brand: ${brandName || 'Brand'}
- Deal: ${dealTitle || 'Sponsorship Deal'}
- Current Stage: ${stage}
- Creator wants to: ${userAction}
${originalEmailSnippet ? `\nOriginal Email:\n${originalEmailSnippet}` : ''}

Return a JSON object with:
- subject (string, email subject line)
- body (string, full email body)
- tone (string: "professional", "friendly", "assertive")

Return ONLY valid JSON, no other text.`,
      },
    ],
  });

  const text = message.content[0].text.trim();
  const json = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  return JSON.parse(json);
}

/**
 * Repurpose content from one platform format to another.
 */
async function repurposeContent({ sourceContent, sourcePlatform, targetPlatform, contentType }) {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You are an expert content strategist who helps creators repurpose content across platforms.

Repurpose the following content:
- Source Platform: ${sourcePlatform}
- Target Platform: ${targetPlatform}
- Content Type: ${contentType || 'general'}

Source Content:
${sourceContent}

Return a JSON object with:
- repurposed_content (string, the adapted content)
- platform_tips (array of strings, tips for posting on ${targetPlatform})
- hashtags (array of strings, relevant hashtags if applicable)
- character_count (number)

Return ONLY valid JSON, no other text.`,
      },
    ],
  });

  const text = message.content[0].text.trim();
  const json = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  return JSON.parse(json);
}

module.exports = { parseEmailForDeal, suggestRate, draftResponse, repurposeContent };
