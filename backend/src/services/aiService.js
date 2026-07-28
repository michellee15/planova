const { fetchWithTimeout } = require("./httpService");

const GEMINI_BASE_URL =
  process.env.GEMINI_BASE_URL ||
  "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";

const recommendationSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    mode: { type: "string", enum: ["discover", "plan"] },
    message: { type: "string" },
    planDate: { type: ["string", "null"] },
    items: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          placeId: { type: "string" },
          reason: { type: "string" },
          estimatedVisitMinutes: { type: "integer", minimum: 15, maximum: 480 },
          startTime: { type: ["string", "null"] },
          endTime: { type: ["string", "null"] },
          price: {
            type: "object",
            additionalProperties: false,
            properties: {
              status: {
                type: "string",
                enum: ["sourced", "estimated", "unavailable"],
              },
              min: { type: ["number", "null"], minimum: 0 },
              max: { type: ["number", "null"], minimum: 0 },
              currency: { type: ["string", "null"] },
              confidence: {
                type: ["string", "null"],
                enum: ["low", "medium", "high", null],
              },
              note: { type: "string" },
            },
            required: ["status", "min", "max", "currency", "confidence", "note"],
          },
        },
        required: [
          "placeId",
          "reason",
          "estimatedVisitMinutes",
          "startTime",
          "endTime",
          "price",
        ],
      },
    },
  },
  required: ["mode", "message", "planDate", "items"],
};

const compactHistory = (messages) =>
  messages.slice(-8).map((message) => {
    if (message.role === "assistant" && message.response_data?.items) {
      return {
        role: "assistant",
        content: message.content,
        previousItems: message.response_data.items.map((item) => ({
          placeId: item.placeId,
          name: item.name,
        })),
      };
    }
    return { role: message.role, content: message.content };
  });

const buildPrompt = ({
  message,
  requestedMode,
  candidates,
  history,
  trip,
  localDate,
  localTime,
  timezone,
  planningWindowHours,
}) => {
  const safeCandidates = candidates.map((candidate) => ({
    placeId: candidate.placeId,
    name: candidate.name,
    category: candidate.category,
    address: candidate.address,
    openingHours: candidate.openingHours,
    fee: candidate.fee,
    ticketPrice: candidate.ticketPrice,
    wheelchair: candidate.wheelchair,
    distanceStraightLineKm: candidate.distanceStraightLineKm,
    travel: candidate.travel,
  }));

  return [
    "Respond using only the supplied place candidates.",
    "Never create a new place or alter a placeId.",
    "Choose 5 to 8 places when enough candidates exist.",
    "Use discover mode for independent recommendations and plan mode for an ordered schedule.",
    "For plan mode, fit travel and visits inside the requested planning window.",
    "Use HH:MM 24-hour startTime and endTime values for plan items.",
    "Use null times and planDate for discover mode.",
    "When a supplied ticketPrice exists, preserve it as sourced.",
    "For attractions, estimate admission when a sourced ticket price is unavailable.",
    "For restaurants and cafes, estimate a typical per-person spend.",
    "For retail, groceries, transport, health, and services, mark price unavailable unless the user asks about a specific priced item.",
    "Mark every model-generated price as estimated.",
    "Every estimated price must explain that users should verify the official price.",
    "Do not claim opening hours that were not supplied.",
    JSON.stringify({
      userMessage: message,
      requestedMode,
      localDate,
      localTime,
      timezone,
      planningWindowHours,
      trip: trip
        ? {
            title: trip.title,
            destination: trip.destination,
            startDate: trip.start_date,
            endDate: trip.end_date,
            budget: trip.total_budget,
            currency: trip.currency,
            numberOfPeople: trip.num_of_people,
          }
        : null,
      conversationHistory: compactHistory(history),
      candidates: safeCandidates,
    }),
  ].join("\n");
};

const extractResponseText = (data) => {
  const parts = data.candidates?.[0]?.content?.parts || [];
  return parts.map((part) => part.text || "").join("");
};

const validateRecommendation = (recommendation, candidateIds) => {
  if (!recommendation || !["discover", "plan"].includes(recommendation.mode)) {
    throw new Error("AI response has an invalid mode");
  }
  if (!Array.isArray(recommendation.items) || recommendation.items.length === 0) {
    throw new Error("AI response did not include recommendations");
  }
  if (
    recommendation.items.some(
      (item) => !item.placeId || !candidateIds.has(item.placeId)
    )
  ) {
    throw new Error("AI response referenced an unknown place");
  }
  return recommendation;
};

const generateRecommendations = async (input) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error("GEMINI_API_KEY is not configured");
    error.code = "AI_NOT_CONFIGURED";
    throw error;
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const url = `${GEMINI_BASE_URL}/models/${encodeURIComponent(
    model
  )}:generateContent`;
  const requestBody = {
    systemInstruction: {
      parts: [
        {
          text:
            "You are Planova's nearby-place and travel-planning assistant. Ground every factual place field in supplied data and clearly label estimates.",
        },
      ],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: buildPrompt(input) }],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseJsonSchema: recommendationSchema,
      temperature: 0.3,
      maxOutputTokens: 4096,
    },
  };

  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(requestBody),
      }, 45000);
      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `Gemini returned status ${response.status}: ${body.slice(0, 300)}`
        );
      }

      const data = await response.json();
      const text = extractResponseText(data);
      const recommendation = JSON.parse(text);
      const validated = validateRecommendation(
        recommendation,
        new Set(input.candidates.map((candidate) => candidate.placeId))
      );
      if (validated.mode !== input.requestedMode) {
        throw new Error("AI response mode did not match the requested mode");
      }
      return validated;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
};

module.exports = {
  generateRecommendations,
  buildPrompt,
  validateRecommendation,
  recommendationSchema,
};
