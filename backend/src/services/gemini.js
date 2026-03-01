const { GoogleGenerativeAI } = require('@google/generative-ai');

function getModel() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

function extractJSON(text) {
  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
  } catch {
    // Try to find JSON object in text
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch {}
    }
    return null;
  }
}

// 1. Parse sponsorship email → structured deal data
async function parseEmailForDeal(emailText) {
  const model = getModel();
  const result = await model.generateContent(`You are a sponsorship deal parser for content creators. Extract structured deal information from this email.

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
${emailText}`);

  const text = result.response.text();
  const parsed = extractJSON(text);
  return parsed || { is_sponsorship: false, confidence: 0, error: 'parse_failed', raw: text };
}

// 2. Suggest rate for a deal
async function suggestRate(context) {
  const model = getModel();
  const result = await model.generateContent(`You are a sponsorship rate advisor for content creators. Based on the creator's profile, suggest a fair rate range.

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
  "currency": "INR",
  "reasoning": string (2-3 sentences explaining the estimate),
  "negotiation_tips": [string, string]
}`);

  const text = result.response.text();
  const parsed = extractJSON(text);
  return parsed || { error: 'parse_failed', raw: text };
}

// 3. Draft a response email
async function draftResponse(context) {
  const model = getModel();
  const result = await model.generateContent(`You are a professional email writer for a content creator. Draft a reply email.

Context:
- Creator name: ${context.creatorName}
- Brand: ${context.brandName}
- Deal: ${context.dealTitle}
- Current stage: ${context.stage}
- Creator wants to: ${context.userAction}
- Original email snippet: ${context.originalEmailSnippet || 'N/A'}

Write a professional, friendly email reply. Keep it concise (under 200 words). Do not include a subject line. Start directly with the greeting.`);

  return { draft: result.response.text() };
}

// 4. Basic content repurposing
async function repurposeContent(context) {
  const model = getModel();
  const result = await model.generateContent(`You are a content repurposing expert for creators. Adapt this content for a different platform.

Source platform: ${context.sourcePlatform}
Target platform: ${context.targetPlatform}
Content type: ${context.contentType}

Original content:
${context.sourceContent}

Rewrite this content optimized for ${context.targetPlatform}. Include appropriate formatting, hashtags, and tone for that platform. Be practical and specific.`);

  return { repurposed: result.response.text() };
}

// 5. Generate content brief from deal context
async function generateBrief(context) {
  const model = getModel();
  const result = await model.generateContent(`You are a content strategist for creators. Generate a detailed content brief for a brand sponsorship deliverable.

Deal context:
- Brand: ${context.brandName}
- Deal title: ${context.dealTitle}
- Deal value: ₹${context.dealValue || 'TBD'}
- Deliverables: ${JSON.stringify(context.deliverables || [])}
- Brand industry: ${context.brandIndustry || 'unknown'}
- Requirements: ${context.requirements || 'none specified'}
- Deadline: ${context.deadline || 'not set'}

Generate a comprehensive content brief. Return ONLY valid JSON:
{
  "title": string (brief title),
  "objective": string (what the content should achieve),
  "key_messages": [string, string, string] (3 key talking points),
  "content_outline": string (suggested structure/flow),
  "dos": [string, string, string] (things to include),
  "donts": [string, string] (things to avoid),
  "cta_suggestions": [string, string] (call-to-action ideas),
  "hashtags": [string, string, string, string, string] (5 relevant hashtags),
  "estimated_production_time": string (e.g. "2-3 days"),
  "notes": string (any additional tips)
}`);

  const text = result.response.text();
  const parsed = extractJSON(text);
  return parsed || { error: 'parse_failed', raw: text };
}

// 6. Negotiation coaching based on brand history
async function negotiationCoach(context) {
  const model = getModel();
  const result = await model.generateContent(`You are a negotiation coach for content creators dealing with brands. Based on this brand's history, give strategic advice.

Brand: ${context.brandName}
Brand history:
- Total past deals: ${context.totalDeals || 0}
- Average deal value: ₹${context.avgDealValue || 0}
- Payment reliability: ${context.paymentReliability || 'unknown'}
- Average payment days: ${context.avgPaymentDays || 'unknown'}
- Warmth score: ${context.warmthScore || 50}/100
- Past negotiation notes: ${JSON.stringify(context.pastNotes || [])}

Current deal:
- Proposed value: ₹${context.proposedValue || 'TBD'}
- Deliverables: ${JSON.stringify(context.deliverables || [])}

Return ONLY valid JSON:
{
  "recommended_rate": string (suggested counter-offer range),
  "leverage_points": [string, string] (your negotiation strengths),
  "risk_flags": [string] (things to watch out for),
  "strategy": string (2-3 sentence negotiation approach),
  "payment_terms_suggestion": string (e.g. "50% upfront, 50% on delivery"),
  "walk_away_threshold": string (minimum acceptable deal)
}`);

  const text = result.response.text();
  const parsed = extractJSON(text);
  return parsed || { error: 'parse_failed', raw: text };
}

module.exports = { parseEmailForDeal, suggestRate, draftResponse, repurposeContent, generateBrief, negotiationCoach };
