import { useEffect, useMemo, useRef, useState } from "react";
import { createItineraryBatch } from "../../api/itineraryApi";
import useChatbot from "../../hooks/useChatbot";

const promptSuggestions = [
  "What museums and landmarks are nearby?",
  "Plan a relaxed four-hour afternoon",
  "Find family-friendly attractions",
];

const Icon = ({ name, size = 18 }) => {
  const paths = {
    sparkle: (
      <>
        <path d="m12 3-1.2 3.3L7.5 7.5l3.3 1.2L12 12l1.2-3.3 3.3-1.2-3.3-1.2L12 3Z" />
        <path d="m5.5 12-.8 2.2-2.2.8 2.2.8.8 2.2.8-2.2 2.2-.8-2.2-.8-.8-2.2Z" />
        <path d="m17.5 14-.6 1.6-1.6.6 1.6.6.6 1.6.6-1.6 1.6-.6-1.6-.6-.6-1.6Z" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    trash: (
      <>
        <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13" />
        <path d="M10 11v5M14 11v5" />
      </>
    ),
    location: (
      <>
        <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
    send: (
      <>
        <path d="m21 3-7.5 18-3-7.5L3 10.5 21 3Z" />
        <path d="m10.5 13.5 4-4" />
      </>
    ),
    clock: <circle cx="12" cy="12" r="9" />,
    car: (
      <>
        <path d="m5 15 1.5-5h11l1.5 5v4h-2v-2H7v2H5v-4Z" />
        <path d="M7 14h.01M17 14h.01" />
      </>
    ),
    walk: (
      <>
        <circle cx="13" cy="4" r="2" />
        <path d="m10 21 2-6-2-3 2-4 3 3 3 1M12 15l4 6M8 21l2-4" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    pin: (
      <>
        <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="chat-icon"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
        {paths[name]}
      </g>
    </svg>
  );
};

const formatPrice = (price) => {
  if (!price || price.status === "unavailable") return "Price unavailable";
  const currency = price.currency || "";
  const range =
    price.min === price.max ? price.min : `${price.min}–${price.max}`;
  return `${currency} ${range}`.trim();
};

const TravelSummary = ({ travel }) => {
  if (!travel) return null;

  return (
    <div className="chat-travel" aria-label="Estimated travel times">
      {travel.drivingMinutes != null && (
        <span title="Route estimate">
          <Icon name="car" size={15} />
          {travel.drivingMinutes} min
        </span>
      )}
      {travel.publicTransportMinutes != null && (
        <span title="Speed-based public transport estimate">
          Transit {travel.publicTransportMinutes} min
        </span>
      )}
      {travel.walkingMinutes != null && (
        <span title="Speed-based walking estimate">
          <Icon name="walk" size={15} />
          {travel.walkingMinutes} min
        </span>
      )}
    </div>
  );
};

const RecommendationCard = ({
  item,
  checked,
  disabled,
  saved,
  onToggle,
  onSave,
  saving,
}) => (
  <article className={`chat-recommendation ${checked ? "is-selected" : ""}`}>
    <div className="chat-recommendation-topline">
      <label className="chat-recommendation-select">
        <input
          type="checkbox"
          checked={checked || saved}
          disabled={disabled || saved}
          onChange={() => onToggle(item.placeId)}
        />
        <span className="sr-only">Select {item.name}</span>
      </label>
      <span className="chat-category">{item.category}</span>
      {saved && (
        <span className="chat-saved-badge">
          <Icon name="check" size={14} />
          Added
        </span>
      )}
    </div>

    <h4>{item.name}</h4>
    <p className="chat-recommendation-location">
      <Icon name="pin" size={15} />
      {item.location}
    </p>
    <p className="chat-recommendation-reason">{item.reason}</p>

    {(item.startTime || item.endTime || item.estimatedVisitMinutes) && (
      <div className="chat-recommendation-time">
        <Icon name="clock" size={15} />
        {item.startTime && item.endTime
          ? `${item.startTime}–${item.endTime}`
          : `About ${item.estimatedVisitMinutes || 60} min`}
      </div>
    )}

    <TravelSummary travel={item.travelFromPrevious || item.travelFromOrigin} />

    <div className="chat-recommendation-details">
      <span>
        {formatPrice(item.price)}
        {item.price?.status === "estimated" ? " · estimate" : ""}
      </span>
      {item.openingHours && <span>Hours: {item.openingHours}</span>}
    </div>

    <div className="chat-recommendation-actions">
      {item.website && (
        <a
          href={
            /^https?:\/\//i.test(item.website)
              ? item.website
              : `https://${item.website}`
          }
          target="_blank"
          rel="noreferrer"
        >
          Website
        </a>
      )}
      {!saved && (
        <button
          className="chat-text-button"
          type="button"
          disabled={disabled || saving}
          onClick={() => onSave([item])}
        >
          {saving ? "Adding..." : "Add to itinerary"}
        </button>
      )}
    </div>
  </article>
);

function RecommendationGroup({
  data,
  trip,
  savedPlaceIds,
  onItinerarySaved,
}) {
  const availableItems = (data.items || []).filter(
    (item) => !savedPlaceIds.has(item.placeId),
  );
  const [selectedIds, setSelectedIds] = useState(
    () => new Set(availableItems.map((item) => item.placeId)),
  );
  const [itineraryDate, setItineraryDate] = useState(
    data.planDate ||
      trip.start_date?.slice(0, 10) ||
      new Date().toISOString().slice(0, 10),
  );
  const [savingIds, setSavingIds] = useState(new Set());
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const toggleItem = (placeId) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(placeId)) next.delete(placeId);
      else next.add(placeId);
      return next;
    });
  };

  const saveItems = async (items) => {
    if (!itineraryDate) {
      setSaveError("Choose a date before adding recommendations.");
      return;
    }

    const unsavedItems = items.filter(
      (item) => !savedPlaceIds.has(item.placeId),
    );
    if (unsavedItems.length === 0) return;

    try {
      setSaveError("");
      setSaveMessage("");
      setSavingIds(new Set(unsavedItems.map((item) => item.placeId)));
      await createItineraryBatch(
        trip.id,
        unsavedItems.map((item) => ({
          title: item.name,
          location: item.location || null,
          itinerary_date: itineraryDate,
          start_time: item.startTime || null,
          end_time: item.endTime || null,
          notes: item.reason
            ? `Recommended by Planova. ${item.reason}`
            : "Recommended by Planova.",
          latitude: item.latitude,
          longitude: item.longitude,
          formatted_address: item.location || null,
          place_id: item.placeId,
        })),
      );
      setSelectedIds((current) => {
        const next = new Set(current);
        unsavedItems.forEach((item) => next.delete(item.placeId));
        return next;
      });
      setSaveMessage(
        `${unsavedItems.length} ${
          unsavedItems.length === 1 ? "place" : "places"
        } added to your itinerary.`,
      );
      await onItinerarySaved();
    } catch (error) {
      console.error("Error saving chat recommendations:", error);
      setSaveError(error.message);
    } finally {
      setSavingIds(new Set());
    }
  };

  const selectedItems = (data.items || []).filter(
    (item) => selectedIds.has(item.placeId) && !savedPlaceIds.has(item.placeId),
  );

  return (
    <div className="chat-recommendations">
      <div className="chat-recommendations-toolbar">
        <div>
          <strong>
            {data.mode === "plan" ? "Your suggested plan" : "Places worth exploring"}
          </strong>
          <span>
            Within {data.radiusKm || 5} km · {data.items?.length || 0} results
          </span>
        </div>
        <label>
          <span>Date</span>
          <input
            type="date"
            value={itineraryDate}
            onChange={(event) => setItineraryDate(event.target.value)}
          />
        </label>
      </div>

      <div className="chat-recommendation-grid">
        {(data.items || []).map((item) => (
          <RecommendationCard
            key={item.placeId}
            item={item}
            checked={selectedIds.has(item.placeId)}
            disabled={savingIds.size > 0}
            saved={savedPlaceIds.has(item.placeId)}
            saving={savingIds.has(item.placeId)}
            onToggle={toggleItem}
            onSave={saveItems}
          />
        ))}
      </div>

      <div className="chat-save-row">
        <div aria-live="polite">
          {saveError && <p className="chat-inline-error">{saveError}</p>}
          {saveMessage && <p className="chat-inline-success">{saveMessage}</p>}
        </div>
        <button
          className="btn btn-primary"
          type="button"
          disabled={selectedItems.length === 0 || savingIds.size > 0}
          onClick={() => saveItems(selectedItems)}
        >
          {savingIds.size > 0
            ? "Adding..."
            : `Add selected (${selectedItems.length})`}
        </button>
      </div>

      <p className="chat-disclaimer">{data.disclaimer}</p>
    </div>
  );
}

function Chatbot({ trip, itineraries = [], onItinerarySaved }) {
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    messages,
    loadingSessions,
    loadingMessages,
    sending,
    error,
    setError,
    startNewConversation,
    sendMessage,
    removeConversation,
  } = useChatbot(trip.id);

  const [message, setMessage] = useState("");
  const [mode, setMode] = useState("auto");
  const [radiusKm, setRadiusKm] = useState(5);
  const [manualLocation, setManualLocation] = useState("");
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("");
  const [requestingLocation, setRequestingLocation] = useState(false);
  const messagesEndRef = useRef(null);

  const savedPlaceIds = useMemo(
    () =>
      new Set(
        itineraries
          .map((item) => item.place_id)
          .filter(Boolean),
      ),
    [itineraries],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, sending]);

  const getDeviceLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Location is not supported by this browser."));
        return;
      }

      setRequestingLocation(true);
      setLocationStatus("Requesting device location...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setDeviceLocation(coordinates);
          setLocationStatus("Using your current location");
          setRequestingLocation(false);
          resolve(coordinates);
        },
        () => {
          setLocationStatus("Location access was unavailable. Enter a place below.");
          setRequestingLocation(false);
          reject(new Error("Enter a location or allow device location access."));
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
      );
    });

  const handleUseLocation = async () => {
    try {
      setError("");
      await getDeviceLocation();
      setManualLocation("");
    } catch (locationError) {
      setError(locationError.message);
    }
  };

  const handleSubmit = async (event) => {
    event?.preventDefault();
    const cleanMessage = message.trim();
    if (!cleanMessage || sending) return;

    let location = deviceLocation;
    if (!manualLocation.trim() && !location) {
      try {
        location = await getDeviceLocation();
      } catch (locationError) {
        setError(locationError.message);
        return;
      }
    }

    try {
      await sendMessage({
        message: cleanMessage,
        mode,
        ...(manualLocation.trim()
          ? { manual_location: manualLocation.trim() }
          : { location }),
        timezone:
          Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        radius_km: Number(radiusKm),
      });
      setMessage("");
    } catch {
      // The hook exposes the backend message in the assistant error state.
    }
  };

  const handleDeleteConversation = async () => {
    if (!activeSessionId) return;
    const shouldDelete = window.confirm(
      "Delete this conversation and its messages?",
    );
    if (!shouldDelete) return;

    try {
      await removeConversation(activeSessionId);
    } catch {
      // The hook exposes the backend message in the assistant error state.
    }
  };

  const hasConversation = messages.length > 0;

  return (
    <section className="chatbot-shell" aria-labelledby="chatbot-title">
      <div className="chatbot-header">
        <div className="chatbot-title-group">
          <span className="chatbot-mark">
            <Icon name="sparkle" size={24} />
          </span>
          <div>
            <p className="chatbot-eyebrow">Planova AI</p>
            <h2 id="chatbot-title">Explore around your trip</h2>
            <p>Discover real nearby places or shape them into a four-hour plan.</p>
          </div>
        </div>

        <div className="chatbot-session-actions">
          {sessions.length > 0 && (
            <label className="chat-session-picker">
              <span className="sr-only">Conversation</span>
              <select
                value={activeSessionId || ""}
                disabled={loadingSessions || sending}
                onChange={(event) => setActiveSessionId(event.target.value)}
              >
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            className="chat-icon-button"
            type="button"
            title="New conversation"
            disabled={sending}
            onClick={() => startNewConversation().catch(() => {})}
          >
            <Icon name="plus" />
            <span>New chat</span>
          </button>
          {activeSessionId && (
            <button
              className="chat-icon-button chat-delete-button"
              type="button"
              title="Delete conversation"
              disabled={sending}
              onClick={handleDeleteConversation}
            >
              <Icon name="trash" />
              <span className="sr-only">Delete conversation</span>
            </button>
          )}
        </div>
      </div>

      <div className="chatbot-conversation" aria-live="polite">
        {(loadingSessions || loadingMessages) && (
          <div className="chat-loading-state">
            <span className="chat-typing-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            Loading your conversation...
          </div>
        )}

        {!loadingSessions && !loadingMessages && !hasConversation && (
          <div className="chat-welcome">
            <span className="chat-welcome-icon">
              <Icon name="sparkle" size={28} />
            </span>
            <h3>Where should we explore?</h3>
            <p>
              I’ll use your location only for this search and match nearby places
              with the details of {trip.title}.
            </p>
            <div className="chat-suggestions">
              {promptSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setMessage(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {!loadingMessages &&
          messages.map((chatMessage) => {
            const responseData =
              chatMessage.response_data || chatMessage.responseData;
            return (
              <div
                className={`chat-message chat-message-${chatMessage.role}`}
                key={chatMessage.id}
              >
                <div className="chat-message-label">
                  {chatMessage.role === "assistant" ? "Planova AI" : "You"}
                </div>
                <div className="chat-bubble">
                  <p>{chatMessage.content}</p>
                </div>
                {chatMessage.role === "assistant" && responseData?.items && (
                  <RecommendationGroup
                    data={responseData}
                    trip={trip}
                    savedPlaceIds={savedPlaceIds}
                    onItinerarySaved={onItinerarySaved}
                  />
                )}
              </div>
            );
          })}

        {sending && (
          <div className="chat-message chat-message-assistant">
            <div className="chat-message-label">Planova AI</div>
            <div className="chat-bubble chat-bubble-loading">
              <span className="chat-typing-dots" aria-label="Finding places">
                <i />
                <i />
                <i />
              </span>
              Finding places and checking routes...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chatbot-composer" onSubmit={handleSubmit}>
        <div className="chatbot-options">
          <div className="chat-mode-picker" aria-label="Recommendation mode">
            {[
              ["auto", "Auto"],
              ["discover", "Discover"],
              ["plan", "Plan"],
            ].map(([value, label]) => (
              <button
                className={mode === value ? "is-active" : ""}
                key={value}
                type="button"
                disabled={sending}
                onClick={() => setMode(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="chat-radius">
            <span>Radius</span>
            <select
              value={radiusKm}
              disabled={sending}
              onChange={(event) => setRadiusKm(event.target.value)}
            >
              {[2, 5, 10, 15, 25].map((radius) => (
                <option key={radius} value={radius}>
                  {radius} km
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="chat-location-row">
          <button
            className={`chat-location-button ${deviceLocation ? "is-active" : ""}`}
            type="button"
            disabled={requestingLocation || sending}
            onClick={handleUseLocation}
          >
            <Icon name={deviceLocation ? "check" : "location"} size={16} />
            {requestingLocation
              ? "Locating..."
              : deviceLocation
                ? "Current location"
                : "Use my location"}
          </button>
          <span>or</span>
          <input
            type="text"
            value={manualLocation}
            maxLength={250}
            disabled={sending}
            placeholder={`Enter a place, e.g. ${trip.destination}`}
            aria-label="Manual search location"
            onChange={(event) => {
              setManualLocation(event.target.value);
              if (event.target.value) {
                setDeviceLocation(null);
                setLocationStatus("");
              }
            }}
          />
        </div>
        {locationStatus && <p className="chat-location-status">{locationStatus}</p>}

        <div className="chat-message-input">
          <textarea
            value={message}
            maxLength={1000}
            rows={2}
            disabled={sending}
            placeholder="Ask for nearby ideas or a plan..."
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSubmit(event);
              }
            }}
          />
          <button
            className="chat-send-button"
            type="submit"
            disabled={!message.trim() || sending || requestingLocation}
            aria-label="Send message"
          >
            <Icon name="send" size={20} />
          </button>
        </div>

        <div className="chatbot-composer-footer">
          <span>{message.length}/1000</span>
          <span>
            Place data ©{" "}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
            >
              OpenStreetMap contributors
            </a>
          </span>
        </div>

        {error && (
          <div className="chat-error-banner" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")}>
              Dismiss
            </button>
          </div>
        )}
      </form>
    </section>
  );
}

export default Chatbot;
