const Anthropic = require('@anthropic-ai/sdk');

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// 1. Parse sponsorship email → structured deal data
async function parseEmailForDeal(emailText) {
  const client = getClient();
  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `You are a sponsorship deal parser for content creators. Extract structured deal information from this email.

Return ONLY valid JSON in this exact format:
{
  "is_sponsorship": boolean,
  "confidence": number (0-1),
  "brand_name": string or null,
  "contact_name": string or null,
  "contact_email": string or null,
  "budget_amount": number or null,
  "currency": string or null,
  "deliverables": [
    { "type": string, "platform": string, "quantity": number, "details": string }
  ],
  "timeline_notes": string or null,
  "requirements": string or null,
  "key_dates": string or null,
  "sentiment": "positive" | "neutral" | "negative",
  "summary": string (2-3 sentence plain English summary)
}

Email:
${emailText}`
    }]
  });

  const text = response.content[0].text;
  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
  } catch {
    return { is_sponsorship: false, confidence: 0, error: 'parse_failed', raw: text };
  }
}

// 2. Suggest rate for a deal
async function suggestRate(context) {
  const client = getClient();
  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `You are a sponsorship rate advisor for content creators. Based on the creator's profile, suggest a fair rate range.

Creator context:
- Niche: ${context.niche || 'general'}
- Platform: ${context.platform || 'unknown'}
- Follower count: ${context.followerCount || 'unknown'}
- Engagement rate: ${context.engagementRate || 'unknown'}
- Deliverables requested: ${JSON.stringify(context.deliverables)}
- Past deals with this brand: ${JSON.stringify(context.brandBudgetHistory || [])}

Return ONLY valid JSON:
{
  "low_estimate": number,
  "mid_estimate": number,
  "high_estimate": number,
  "currency": "USD",
  "reasoning": string (2-3 sentences explaining the estimate),
  "negotiation_tips": [string, string]
}`
    }]
  });

  const text = response.content[0].text;
  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
  } catch {
    return { error: 'parse_failed', raw: text };
  }
}

// 3. Draft a response email
async function draftResponse(context) {
  const client = getClient();
  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `You are a professional email writer for a content creator. Draft a reply email.

Context:
- Creator name: ${context.creatorName}
- Brand: ${context.brandName}
- Deal: ${context.dealTitle}
- Current stage: ${context.stage}
- Creator wants to: ${context.userAction}
- Original email snippet: ${context.originalEmailSnippet || 'N/A'}

Write a professional, friendly email reply. Keep it concise (under 200 words). Do not include a subject line. Start directly with the greeting.`
    }]
  });

  return { draft: response.content[0].text };
}

// 4. Basic content repurposing
async function repurposeContent(context) {
  const client = getClient();
  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1200,
    messages: [{
      role: 'user',
      content: `You are a content repurposing expert for creators. Adapt this content for a different platform.

Source platform: ${context.sourcePlatform}
Target platform: ${context.targetPlatform}
Content type: ${context.contentType}

Original content:
${context.sourceContent}

Rewrite this content optimized for ${context.targetPlatform}. Include appropriate formatting, hashtags, and tone for that platform. Be practical and specific.`
    }]
  });

  return { repurposed: response.content[0].text };
}

module.exports = { parseEmailForDeal, suggestRate, draftResponse, repurposeContent };
