import { useEffect, useMemo, useRef, useState } from "react";
import { matchPath, useLocation } from "react-router-dom";
import {
  createItineraryBatch,
  getItineraryByTripId,
} from "../../api/itineraryApi";
import { getTripById, getTrips } from "../../api/tripApi";
import useChatbot from "../../hooks/useChatbot";

const promptSuggestions = [
  "Find a good place to eat nearby",
  "Where is the nearest pharmacy or ATM?",
  "Show me shopping and things to do",
  "Plan a relaxed four-hour afternoon",
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
    history: (
      <>
        <path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.6" />
        <path d="M4 4v4.6h4.6M12 8v4l2.5 1.5" />
      </>
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
    chat: (
      <>
        <path d="M5 18.5 3.5 21l3.8-1.1A9 9 0 1 0 5 18.5Z" />
        <path d="M8 12h.01M12 12h.01M16 12h.01" />
      </>
    ),
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
          {saving ? "Saving..." : "Save to trip"}
        </button>
      )}
    </div>
  </article>
);

function RecommendationGroup({
  data,
  trips,
  defaultTripId,
  currentTripId,
  currentItineraries,
}) {
  const [targetTripId, setTargetTripId] = useState(
    defaultTripId ? String(defaultTripId) : "",
  );
  const targetTrip = trips.find(
    (trip) => String(trip.id) === String(targetTripId),
  );
  const existingPlaceIds = useMemo(
    () =>
      String(currentTripId) === String(targetTripId)
        ? new Set(currentItineraries.map((item) => item.place_id).filter(Boolean))
        : new Set(),
    [currentItineraries, currentTripId, targetTripId],
  );
  const [savedByTrip, setSavedByTrip] = useState({});
  const isSaved = (placeId) =>
    existingPlaceIds.has(placeId) ||
    savedByTrip[String(targetTripId)]?.has(placeId);

  const availableItems = (data.items || []).filter(
    (item) => !isSaved(item.placeId),
  );
  const [selectedIds, setSelectedIds] = useState(
    () => new Set(availableItems.map((item) => item.placeId)),
  );
  const [itineraryDate, setItineraryDate] = useState(
    data.planDate ||
      targetTrip?.start_date?.slice(0, 10) ||
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
    if (!targetTripId) {
      setSaveError("Choose a trip before saving these places.");
      return;
    }
    if (!itineraryDate) {
      setSaveError("Choose a date before saving these places.");
      return;
    }

    const unsavedItems = items.filter(
      (item) => !isSaved(item.placeId),
    );
    if (unsavedItems.length === 0) return;

    try {
      setSaveError("");
      setSaveMessage("");
      setSavingIds(new Set(unsavedItems.map((item) => item.placeId)));
      await createItineraryBatch(
        targetTripId,
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
      setSavedByTrip((current) => {
        const next = new Set(current[String(targetTripId)] || []);
        unsavedItems.forEach((item) => next.add(item.placeId));
        return { ...current, [String(targetTripId)]: next };
      });
      setSaveMessage(
        `${unsavedItems.length} ${
          unsavedItems.length === 1 ? "place" : "places"
        } saved to ${targetTrip?.title || "your trip"}.`,
      );
      window.dispatchEvent(
        new CustomEvent("planova:itinerary-updated", {
          detail: { tripId: targetTripId },
        }),
      );
    } catch (error) {
      console.error("Error saving chat recommendations:", error);
      setSaveError(error.message);
    } finally {
      setSavingIds(new Set());
    }
  };

  const selectedItems = (data.items || []).filter(
    (item) => selectedIds.has(item.placeId) && !isSaved(item.placeId),
  );

  return (
    <div className="chat-recommendations">
      <div className="chat-recommendations-toolbar">
        <div>
          <strong>
            {data.mode === "plan" ? "Your suggested plan" : "Nearby recommendations"}
          </strong>
          <span>
            Within {data.radiusKm || 5} km · {data.items?.length || 0} results
          </span>
        </div>
        <div className="chat-save-fields">
          <label>
            <span>Save to</span>
            <select
              value={targetTripId}
              onChange={(event) => {
                const nextTripId = event.target.value;
                const nextTrip = trips.find(
                  (trip) => String(trip.id) === String(nextTripId),
                );
                setTargetTripId(nextTripId);
                setSaveError("");
                if (!data.planDate && nextTrip?.start_date) {
                  setItineraryDate(nextTrip.start_date.slice(0, 10));
                }
              }}
            >
              <option value="">Choose a trip</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Date</span>
            <input
              type="date"
              value={itineraryDate}
              onChange={(event) => setItineraryDate(event.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="chat-recommendation-grid">
        {(data.items || []).map((item) => (
          <RecommendationCard
            key={item.placeId}
            item={item}
            checked={selectedIds.has(item.placeId)}
            disabled={savingIds.size > 0}
            saved={isSaved(item.placeId)}
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
            ? "Saving..."
            : `Save selected (${selectedItems.length})`}
        </button>
      </div>

      <p className="chat-disclaimer">{data.disclaimer}</p>
    </div>
  );
}

const formatSessionDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  return isToday
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString([], { month: "short", day: "numeric" });
};

function Chatbot() {
  const routeLocation = useLocation();
  const tripRoute = matchPath("/trips/:id", routeLocation.pathname);
  const pageTripId = tripRoute?.params.id || null;

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
  } = useChatbot();

  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pageTrip, setPageTrip] = useState(null);
  const [pageItineraries, setPageItineraries] = useState([]);
  const [trips, setTrips] = useState([]);
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState("auto");
  const [radiusKm, setRadiusKm] = useState(5);
  const [manualLocation, setManualLocation] = useState("");
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("");
  const [requestingLocation, setRequestingLocation] = useState(false);
  const messagesEndRef = useRef(null);

  const activeSession = useMemo(
    () =>
      sessions.find(
        (session) => String(session.id) === String(activeSessionId),
      ) || null,
    [activeSessionId, sessions],
  );

  useEffect(() => {
    let ignore = false;

    getTrips()
      .then((data) => {
        if (!ignore) setTrips(Array.isArray(data) ? data : []);
      })
      .catch((tripError) =>
        console.error("Error loading trips for chatbot:", tripError),
      );

    return () => {
      ignore = true;
    };
  }, [isOpen]);

  useEffect(() => {
    let ignore = false;

    const loadPageTrip = async () => {
      if (!pageTripId) {
        await Promise.resolve();
        if (!ignore) {
          setPageTrip(null);
          setPageItineraries([]);
        }
        return;
      }

      try {
        const [tripData, itineraryData] = await Promise.all([
          getTripById(pageTripId),
          getItineraryByTripId(pageTripId),
        ]);
        if (!ignore) {
          setPageTrip(tripData);
          setPageItineraries(Array.isArray(itineraryData) ? itineraryData : []);
        }
      } catch (tripError) {
        if (!ignore) {
          console.error("Error loading chatbot trip context:", tripError);
          setPageTrip(null);
          setPageItineraries([]);
        }
      }
    };

    loadPageTrip();
    return () => {
      ignore = true;
    };
  }, [pageTripId]);

  useEffect(() => {
    const handleItineraryUpdated = (event) => {
      if (String(event.detail?.tripId) !== String(pageTripId)) return;
      getItineraryByTripId(pageTripId)
        .then((data) => setPageItineraries(Array.isArray(data) ? data : []))
        .catch((tripError) =>
          console.error("Error refreshing chatbot itinerary context:", tripError),
        );
    };

    window.addEventListener("planova:itinerary-updated", handleItineraryUpdated);
    return () => {
      window.removeEventListener(
        "planova:itinerary-updated",
        handleItineraryUpdated,
      );
    };
  }, [pageTripId]);

  useEffect(() => {
    if (isOpen && !showHistory) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [isOpen, messages, sending, showHistory]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setShowHistory(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

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
      await sendMessage(
        {
          message: cleanMessage,
          mode,
          ...(manualLocation.trim()
            ? { manual_location: manualLocation.trim() }
            : { location }),
          timezone:
            Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          radius_km: Number(radiusKm),
        },
        pageTripId,
      );
      setMessage("");
    } catch {
      // The hook exposes the backend message in the assistant error state.
    }
  };

  const handleDeleteConversation = async (sessionId) => {
    const shouldDelete = window.confirm(
      "Delete this conversation and its messages?",
    );
    if (!shouldDelete) return;

    try {
      await removeConversation(sessionId);
    } catch {
      // The hook exposes the backend message in the assistant error state.
    }
  };

  const hasConversation = messages.length > 0;
  const sessionContextLabel = activeSession?.trip_title
    ? activeSession.trip_title
    : "General";

  const handleNewConversation = async () => {
    try {
      await startNewConversation(pageTripId);
      setShowHistory(false);
    } catch {
      // The hook exposes the backend message in the assistant error state.
    }
  };

  return (
    <div className="chatbot-widget">
      {!isOpen && (
        <button
          className="chatbot-launcher"
          type="button"
          aria-label="Open Planova AI assistant"
          aria-expanded="false"
          onClick={() => setIsOpen(true)}
        >
          <Icon name="chat" size={27} />
          <span className="chatbot-launcher-sparkle">
            <Icon name="sparkle" size={13} />
          </span>
        </button>
      )}

      {isOpen && (
        <section
          className="chatbot-panel"
          role="dialog"
          aria-label="Planova AI assistant"
        >
          <header className="chatbot-header">
            <div className="chatbot-title-group">
              <span className="chatbot-mark">
                <Icon name="sparkle" size={19} />
              </span>
              <div>
                <h2 id="chatbot-title">Planova AI</h2>
                <p>
                  {activeSession?.title || "New conversation"}
                  <span className="chat-context-badge">{sessionContextLabel}</span>
                </p>
              </div>
            </div>

            <div className="chatbot-session-actions">
              <button
                className={`chat-icon-button ${showHistory ? "is-active" : ""}`}
                type="button"
                title="Conversation history"
                aria-label="Conversation history"
                onClick={() => setShowHistory((current) => !current)}
              >
                <Icon name="history" />
              </button>
              <button
                className="chat-icon-button"
                type="button"
                title={pageTrip ? `New chat for ${pageTrip.title}` : "New general chat"}
                aria-label="New conversation"
                disabled={sending}
                onClick={handleNewConversation}
              >
                <Icon name="plus" />
              </button>
              <button
                className="chat-icon-button"
                type="button"
                title="Minimize assistant"
                aria-label="Minimize assistant"
                onClick={() => {
                  setIsOpen(false);
                  setShowHistory(false);
                }}
              >
                <Icon name="close" />
              </button>
            </div>
          </header>

          {showHistory ? (
            <div className="chat-history-view">
              <div className="chat-history-heading">
                <div>
                  <p className="chatbot-eyebrow">Conversations</p>
                  <h3>Chat history</h3>
                </div>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={handleNewConversation}
                >
                  <Icon name="plus" size={15} />
                  New chat
                </button>
              </div>

              {loadingSessions ? (
                <div className="chat-history-empty">Loading conversations...</div>
              ) : sessions.length === 0 ? (
                <div className="chat-history-empty">
                  <Icon name="history" size={25} />
                  <strong>No conversations yet</strong>
                  <span>Start a chat and it will appear here.</span>
                </div>
              ) : (
                <div className="chat-history-list">
                  {sessions.map((session) => (
                    <div
                      className={`chat-history-item ${
                        String(session.id) === String(activeSessionId)
                          ? "is-active"
                          : ""
                      }`}
                      key={session.id}
                    >
                      <button
                        className="chat-history-select"
                        type="button"
                        onClick={() => {
                          setActiveSessionId(session.id);
                          setShowHistory(false);
                        }}
                      >
                        <span className="chat-history-icon">
                          <Icon name="chat" size={17} />
                        </span>
                        <span className="chat-history-copy">
                          <strong>{session.title}</strong>
                          <small>
                            <span>{session.trip_title || "General"}</span>
                            {formatSessionDate(session.updated_at)}
                          </small>
                        </span>
                      </button>
                      <button
                        className="chat-history-delete"
                        type="button"
                        aria-label={`Delete ${session.title}`}
                        onClick={() => handleDeleteConversation(session.id)}
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="chatbot-panel-main">
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
                      <Icon name="sparkle" size={23} />
                    </span>
                    <h3>What can I find for you?</h3>
                    <p>
                      Search for food, services, shopping, transport, attractions,
                      or build a plan
                      {pageTrip ? ` for ${pageTrip.title}` : ""}.
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
                            trips={trips}
                            defaultTripId={activeSession?.trip_id || pageTripId}
                            currentTripId={pageTripId}
                            currentItineraries={pageItineraries}
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
                    className={`chat-location-button ${
                      deviceLocation ? "is-active" : ""
                    }`}
                    type="button"
                    disabled={requestingLocation || sending}
                    onClick={handleUseLocation}
                  >
                    <Icon
                      name={deviceLocation ? "check" : "location"}
                      size={16}
                    />
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
                    placeholder={`Enter a place, e.g. ${
                      pageTrip?.destination || "Bugis, Singapore"
                    }`}
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
                {locationStatus && (
                  <p className="chat-location-status">{locationStatus}</p>
                )}

                <div className="chat-message-input">
                  <textarea
                    value={message}
                    maxLength={1000}
                    rows={2}
                    disabled={sending}
                    placeholder="Ask for nearby places, help, or a plan..."
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
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default Chatbot;
