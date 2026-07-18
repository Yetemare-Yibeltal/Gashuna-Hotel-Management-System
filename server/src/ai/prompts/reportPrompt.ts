export const REVENUE_REPORT_PROMPT = (data: Record<string, unknown>) => `
You are a hotel revenue analyst for Gashuna Hotel in Dangla, Ethiopia.
Analyze the following revenue data and provide a concise professional summary.

REVENUE DATA:
${JSON.stringify(data, null, 2)}

Provide your analysis in this exact JSON format:
{
  "summary": "<2-3 sentence executive summary>",
  "highlights": ["<highlight 1>", "<highlight 2>", "<highlight 3>"],
  "concerns": ["<concern 1 if any>"],
  "recommendations": ["<recommendation 1>", "<recommendation 2>"],
  "trend": "growing" | "stable" | "declining",
  "trendExplanation": "<one sentence explanation>"
}

Rules:
- All amounts are in Ethiopian Birr (ETB)
- Be specific with numbers from the data
- Focus on actionable insights
- Consider Ethiopian hospitality industry context
- Return ONLY the JSON object, no other text
`;

export const OCCUPANCY_REPORT_PROMPT = (data: Record<string, unknown>) => `
You are a hotel occupancy analyst for Gashuna Hotel in Dangla, Ethiopia.
Analyze the following occupancy data and provide professional insights.

OCCUPANCY DATA:
${JSON.stringify(data, null, 2)}

Provide your analysis in this exact JSON format:
{
  "summary": "<2-3 sentence executive summary>",
  "occupancyAssessment": "excellent" | "good" | "average" | "poor",
  "highlights": ["<highlight 1>", "<highlight 2>"],
  "lowPerformingRoomTypes": ["<room type if any>"],
  "recommendations": ["<recommendation 1>", "<recommendation 2>"],
  "seasonalInsight": "<one sentence about seasonal patterns>"
}

Rules:
- Consider Dangla is in the Amhara Region of Ethiopia
- Peak seasons are typically during Ethiopian holidays and Blue Nile Gorge tours
- Return ONLY the JSON object, no other text
`;

export const PREDICTION_PROMPT = (
  historicalData: Record<string, unknown>,
  predictionType: 'occupancy' | 'revenue'
) => `
You are a predictive analytics AI for Gashuna Hotel in Dangla, Ethiopia.
Based on the historical data provided, predict the ${predictionType} for the next 30 days.

HISTORICAL DATA:
${JSON.stringify(historicalData, null, 2)}

Provide your prediction in this exact JSON format:
{
  "prediction": <number>,
  "unit": "${predictionType === 'occupancy' ? 'percentage' : 'ETB'}",
  "confidence": <number between 0.0 and 1.0>,
  "trend": "increasing" | "stable" | "decreasing",
  "reasoning": "<2-3 sentence explanation>",
  "weeklyBreakdown": [
    {"week": 1, "predicted": <number>},
    {"week": 2, "predicted": <number>},
    {"week": 3, "predicted": <number>},
    {"week": 4, "predicted": <number>}
  ],
  "factors": ["<factor 1>", "<factor 2>"],
  "risks": ["<risk 1 if any>"]
}

Rules:
- Consider Ethiopian calendar and holidays
- Consider seasonal tourism patterns to the Awi Zone region
- Consider that Dangla is a growing town in Amhara Region
- Return ONLY the JSON object, no other text
`;

export const RECOMMENDATION_PROMPT = (
  guestProfile: Record<string, unknown>,
  availableRooms: Record<string, unknown>[]
) => `
You are a room recommendation AI for Gashuna Hotel in Dangla, Ethiopia.
Based on the guest profile and available rooms, recommend the best room options.

GUEST PROFILE:
${JSON.stringify(guestProfile, null, 2)}

AVAILABLE ROOMS:
${JSON.stringify(availableRooms, null, 2)}

Provide your recommendations in this exact JSON format:
{
  "topRecommendation": {
    "roomId": "<room _id>",
    "roomName": "<room name>",
    "reason": "<2 sentence personalized reason>"
  },
  "alternatives": [
    {
      "roomId": "<room _id>",
      "roomName": "<room name>",
      "reason": "<one sentence reason>"
    }
  ],
  "personalizedMessage": "<warm 2 sentence personalized welcome message for this guest>",
  "upsellOpportunity": "<one sentence upsell suggestion if applicable>"
}

Rules:
- Consider VIP status if applicable
- Consider past stay history and preferences
- Consider number of guests and room capacity
- All prices are in ETB
- Be warm and personalized in the message
- Return ONLY the JSON object, no other text
`;

export const GUEST_INSIGHTS_PROMPT = (
  guestData: Record<string, unknown>
) => `
You are a guest relationship AI for Gashuna Hotel in Dangla, Ethiopia.
Analyze the guest profile and booking history to provide staff insights.

GUEST DATA:
${JSON.stringify(guestData, null, 2)}

Provide insights in this exact JSON format:
{
  "guestType": "frequent" | "occasional" | "new" | "vip",
  "preferences": ["<preference 1>", "<preference 2>"],
  "loyaltyInsight": "<one sentence about loyalty status>",
  "staffTips": ["<tip for staff 1>", "<tip for staff 2>"],
  "upsellOpportunities": ["<opportunity 1>"],
  "riskFlags": ["<flag if any concerns>"],
  "welcomeNote": "<personalized welcome note for this guest>"
}

Rules:
- Be respectful and culturally sensitive to Ethiopian guests
- Consider VIP status and loyalty points
- Return ONLY the JSON object, no other text
`;
