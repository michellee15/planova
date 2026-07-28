# Chatbot API

The chatbot discovers real nearby OpenStreetMap places, adds route estimates, and
uses Gemini to rank the candidates or arrange them into a four-hour plan. Place
search is selected from the prompt and supports attractions, food, groceries,
shopping, nightlife, accommodation, nature, entertainment, healthcare, everyday
services, transport, education, worship, fitness, and personal care.

## Setup

1. Run `npm run migrate` to apply the SQL migrations to the Planova PostgreSQL database.
2. Copy the chatbot settings from `.env.example` into the local `.env`.
3. Set `GEMINI_API_KEY` to a free Google AI Studio key.
4. Start the backend with `npm run dev`.

`GEMINI_MODEL` is configurable because free-tier model availability can change.

## Privacy

Device coordinates are required on each recommendation request. They are used
only for the current Overpass and OSRM lookups. They are not written to
PostgreSQL and are not included in the Gemini prompt. If browser location
permission is unavailable, send `manual_location` instead.

Attraction coordinates are returned and may be stored as part of the structured
assistant response because they describe public places, not the user's exact
position.

## Sessions

All endpoints require the existing bearer JWT.

### Create a session

`POST /api/chat/sessions`

```json
{
  "trip_id": 12,
  "title": "Singapore ideas"
}
```

`trip_id` is optional. When supplied, it must belong to the authenticated user.

### List sessions

`GET /api/chat/sessions`

### Get a conversation

`GET /api/chat/sessions/:sessionId/messages`

### Delete a conversation

`DELETE /api/chat/sessions/:sessionId`

## Generate recommendations

`POST /api/chat/sessions/:sessionId/messages`

```json
{
  "message": "Plan my afternoon with museums and a park",
  "mode": "auto",
  "location": {
    "latitude": 1.29027,
    "longitude": 103.851959
  },
  "timezone": "Asia/Singapore",
  "radius_km": 5
}
```

`mode` may be `auto`, `discover`, or `plan`. Radius defaults to 5 km and must be
between 0.5 and 25 km. When coordinates are missing, use:

```json
{
  "message": "What attractions are nearby?",
  "manual_location": "Bugis, Singapore",
  "timezone": "Asia/Singapore"
}
```

The assistant response is stored in `response_data`. Place identity, coordinates,
opening hours, and sourced prices come from OpenStreetMap. Gemini may estimate
admission prices or typical per-person dining spend only when labelled
`estimated`; categories without a meaningful single price return `unavailable`.
Each travel mode includes an accuracy label.

Discovery requests degrade to nearest-place results when Gemini is temporarily
unavailable. Planning requests return a service error because an ordered schedule
cannot be produced safely without the planner.

Recommendation generation is limited to 10 requests per authenticated user per
minute to protect the free upstream quotas. A `429` response includes
`Retry-After`.

## Save approved recommendations

Use the batch endpoint for one selected card or a complete plan:

`POST /api/trips/:tripId/itinerary/batch`

```json
{
  "items": [
    {
      "title": "Example Museum",
      "location": "Example Street",
      "itinerary_date": "2026-07-28",
      "start_time": "13:00",
      "end_time": "14:30",
      "notes": "Recommended by Planova",
      "latitude": 1.3,
      "longitude": 103.8,
      "formatted_address": "Example Street",
      "place_id": "node/123"
    }
  ]
}
```

The endpoint accepts 1–20 entries. The trip ownership check and every insert run
in one PostgreSQL transaction.

## Free-service limitations

- Public Overpass, Nominatim, and OSRM instances are best-effort services.
- Results depend on the completeness of OpenStreetMap metadata.
- Public-transport and walking times are speed-based estimates.
- OpenStreetMap attribution must be visible in the frontend.
- Gemini free-tier quotas and model availability can change.
