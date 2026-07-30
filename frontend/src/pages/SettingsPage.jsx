import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteChatSession, getChatSessions } from "../api/chatApi";
import Icon from "../components/ui/Icon";
import { useConfirmDialog } from "../components/ui/confirmDialogContext";
import {
  defaultPreferences,
  getPreferences,
  savePreferences,
} from "../utils/preferences";

const avatarColours = [
  { value: "#eea083", label: "Peach" },
  { value: "#7b68c9", label: "Lavender" },
  { value: "#82c7aa", label: "Mint" },
  { value: "#91c6dd", label: "Sky" },
  { value: "#d88faa", label: "Rose" },
];

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("user")) || {};
  } catch {
    return {};
  }
}

function SettingRow({ title, description, children }) {
  return (
    <div className="setting-row">
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="setting-control">{children}</div>
    </div>
  );
}

function SettingsPage() {
  const confirm = useConfirmDialog();
  const [user, setUser] = useState(readUser);
  const [profileForm, setProfileForm] = useState(() => ({
    name: readUser().name || "",
    email: readUser().email || "",
    avatar_color: readUser().avatar_color || avatarColours[0].value,
  }));
  const [preferences, setPreferences] = useState(getPreferences);
  const [profileStatus, setProfileStatus] = useState("");
  const [settingsStatus, setSettingsStatus] = useState("");
  const [historyStatus, setHistoryStatus] = useState("");
  const [clearingHistory, setClearingHistory] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (event) => setPrefersReducedMotion(event.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const handleProfileSubmit = (event) => {
    event.preventDefault();
    const name = profileForm.name.trim();
    if (!name) {
      setProfileStatus("Please enter a display name.");
      return;
    }

    const nextUser = {
      ...user,
      name,
      avatar_color: profileForm.avatar_color,
    };
    localStorage.setItem("user", JSON.stringify(nextUser));
    setUser(nextUser);
    window.dispatchEvent(new CustomEvent("planova:user-updated"));
    setProfileStatus("Profile updated on this device.");
  };

  const handlePreferenceChange = (event) => {
    const { name, value, checked, type } = event.target;
    setPreferences((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
    setSettingsStatus("");
  };

  const handlePreferencesSubmit = (event) => {
    event.preventDefault();
    savePreferences({
      ...preferences,
      defaultRadiusKm: Number(preferences.defaultRadiusKm),
    });
    setSettingsStatus("Preferences saved on this device.");
  };

  const handleResetPreferences = async () => {
    const shouldReset = await confirm({
      title: "Reset your preferences?",
      description:
        "Currency, distance, date, assistant radius, and confirmation settings will return to their defaults.",
      confirmLabel: "Reset preferences",
    });
    if (!shouldReset) return;
    setPreferences(defaultPreferences);
    savePreferences(defaultPreferences);
    setSettingsStatus("Preferences reset.");
  };

  const handleClearHistory = async () => {
    const shouldClear = await confirm({
      title: "Clear all AI conversations?",
      description:
        "Every saved assistant conversation and its messages will be permanently deleted.",
      confirmLabel: "Clear history",
      destructive: true,
    });
    if (!shouldClear) return;

    try {
      setClearingHistory(true);
      setHistoryStatus("");
      const sessions = await getChatSessions();
      await Promise.all(
        (Array.isArray(sessions) ? sessions : []).map((session) =>
          deleteChatSession(session.id),
        ),
      );
      window.dispatchEvent(new CustomEvent("planova:chat-history-cleared"));
      setHistoryStatus("Your AI conversation history has been cleared.");
    } catch (error) {
      console.error("Error clearing chat history:", error);
      setHistoryStatus("We couldn’t clear the history. Please try again.");
    } finally {
      setClearingHistory(false);
    }
  };

  const profileInitial = (profileForm.name || profileForm.email || "P")
    .charAt(0)
    .toUpperCase();

  return (
    <main className="settings-page">
      <Link className="settings-back-link" to="/">
        <Icon name="arrowLeft" size={17} />
        Back to trips
      </Link>

      <header className="settings-hero">
        <span className="settings-hero-icon">
          <Icon name="settings" size={27} />
        </span>
        <div>
          <p className="page-eyebrow">Make Planova yours</p>
          <h1>Profile & settings</h1>
          <p>
            Set up the little details that make planning feel more natural.
          </p>
        </div>
      </header>

      <div className="settings-layout">
        <aside className="settings-sidebar">
          <a href="#profile"><Icon name="profile" size={17} /> Profile</a>
          <a href="#travel"><Icon name="map" size={17} /> Travel</a>
          <a href="#assistant"><Icon name="sparkle" size={17} /> AI assistant</a>
          <a href="#experience"><Icon name="overview" size={17} /> Experience</a>
        </aside>

        <div className="settings-content">
          <section className="settings-card" id="profile">
            <div className="settings-card-heading">
              <span className="settings-card-icon">
                <Icon name="profile" size={21} />
              </span>
              <div>
                <p>Personal details</p>
                <h2>Your profile</h2>
                <span>
                  Profile changes are currently stored on this device.
                </span>
              </div>
            </div>

            <form className="profile-settings-form" onSubmit={handleProfileSubmit}>
              <div className="profile-avatar-preview">
                <span
                  className="profile-avatar-large"
                  style={{ "--profile-colour": profileForm.avatar_color }}
                >
                  {profileInitial}
                </span>
                <div className="profile-avatar-copy">
                  <strong>Your travel avatar</strong>
                  <span>Choose a colour that feels like you.</span>
                </div>
              </div>

              <div className="avatar-colour-picker" aria-label="Avatar colour">
                {avatarColours.map((colour) => (
                  <label key={colour.value} title={colour.label}>
                    <input
                      type="radio"
                      name="avatar_color"
                      value={colour.value}
                      checked={profileForm.avatar_color === colour.value}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          avatar_color: event.target.value,
                        }))
                      }
                    />
                    <span style={{ "--swatch-colour": colour.value }}>
                      {profileForm.avatar_color === colour.value && (
                        <Icon name="check" size={15} />
                      )}
                    </span>
                    <span className="sr-only">{colour.label}</span>
                  </label>
                ))}
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="profile-name">Display name</label>
                  <input
                    id="profile-name"
                    type="text"
                    value={profileForm.name}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    maxLength="80"
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="profile-email">Email address</label>
                  <input
                    id="profile-email"
                    type="email"
                    value={profileForm.email}
                    disabled
                  />
                  <span className="form-help">
                    Email changes need backend account support.
                  </span>
                </div>
              </div>

              <div className="settings-form-footer">
                {profileStatus && <p>{profileStatus}</p>}
                <button className="btn btn-primary" type="submit">
                  <Icon name="check" size={17} />
                  Save profile
                </button>
              </div>
            </form>
          </section>

          <form onSubmit={handlePreferencesSubmit}>
            <section className="settings-card" id="travel">
              <div className="settings-card-heading">
                <span className="settings-card-icon settings-card-icon-peach">
                  <Icon name="map" size={21} />
                </span>
                <div>
                  <p>Your usual choices</p>
                  <h2>Travel preferences</h2>
                  <span>These defaults make creating new plans quicker.</span>
                </div>
              </div>

              <SettingRow
                title="Default currency"
                description="Preselected whenever you create a new trip."
              >
                <select
                  name="defaultCurrency"
                  value={preferences.defaultCurrency}
                  onChange={handlePreferenceChange}
                  aria-label="Default currency"
                >
                  <option value="SGD">SGD — Singapore Dollar</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="GBP">GBP — British Pound</option>
                  <option value="JPY">JPY — Japanese Yen</option>
                  <option value="AUD">AUD — Australian Dollar</option>
                  <option value="MYR">MYR — Malaysian Ringgit</option>
                </select>
              </SettingRow>

              <SettingRow
                title="Distance unit"
                description="Used for assistant searches and nearby itinerary results."
              >
                <select
                  name="distanceUnit"
                  value={preferences.distanceUnit}
                  onChange={handlePreferenceChange}
                  aria-label="Distance unit"
                >
                  <option value="km">Kilometres</option>
                  <option value="mi">Miles</option>
                </select>
              </SettingRow>

              <SettingRow
                title="Date format"
                description="Controls how trip dates are displayed."
              >
                <select
                  name="dateFormat"
                  value={preferences.dateFormat}
                  onChange={handlePreferenceChange}
                  aria-label="Date format"
                >
                  <option value="day-first">30 Jul 2026</option>
                  <option value="month-first">Jul 30, 2026</option>
                  <option value="year-first">2026-07-30</option>
                </select>
              </SettingRow>
            </section>

            <section className="settings-card" id="assistant">
              <div className="settings-card-heading">
                <span className="settings-card-icon settings-card-icon-mint">
                  <Icon name="sparkle" size={21} />
                </span>
                <div>
                  <p>Your travel companion</p>
                  <h2>AI assistant</h2>
                  <span>Control its search defaults and saved conversations.</span>
                </div>
              </div>

              <SettingRow
                title="Default search radius"
                description="The starting area used for nearby recommendations."
              >
                <select
                  name="defaultRadiusKm"
                  value={preferences.defaultRadiusKm}
                  onChange={handlePreferenceChange}
                  aria-label="Default search radius"
                >
                  <option value="2">2 km</option>
                  <option value="5">5 km</option>
                  <option value="10">10 km</option>
                  <option value="15">15 km</option>
                  <option value="25">25 km</option>
                </select>
              </SettingRow>

              <SettingRow
                title="Location access"
                description="Planova only asks for your location when you choose “Use my location”. Browser permissions remain in your control."
              >
                <span className="setting-status-badge">
                  <Icon name="check" size={15} />
                  Ask when needed
                </span>
              </SettingRow>

              <SettingRow
                title="Conversation history"
                description="Permanently remove every saved AI conversation."
              >
                <button
                  className="btn btn-danger"
                  type="button"
                  disabled={clearingHistory}
                  onClick={handleClearHistory}
                >
                  <Icon name="trash" size={16} />
                  {clearingHistory ? "Clearing…" : "Clear history"}
                </button>
              </SettingRow>
              {historyStatus && <p className="settings-inline-status">{historyStatus}</p>}
            </section>

            <section className="settings-card" id="experience">
              <div className="settings-card-heading">
                <span className="settings-card-icon settings-card-icon-sky">
                  <Icon name="overview" size={21} />
                </span>
                <div>
                  <p>Comfort and safety</p>
                  <h2>Experience</h2>
                  <span>Keep navigation comfortable and prevent accidents.</span>
                </div>
              </div>

              <SettingRow
                title="Confirm destructive actions"
                description="Ask before permanently deleting trips, expenses, itinerary entries, members, or chats."
              >
                <label className="toggle-control">
                  <input
                    type="checkbox"
                    name="confirmDeletes"
                    checked={preferences.confirmDeletes}
                    onChange={handlePreferenceChange}
                  />
                  <span />
                  <span className="sr-only">Confirm destructive actions</span>
                </label>
              </SettingRow>

              <SettingRow
                title="Reduced motion"
                description="Planova automatically follows your device accessibility preference."
              >
                <span className="setting-status-badge">
                  <Icon name="check" size={15} />
                  {prefersReducedMotion ? "Motion reduced" : "Standard motion"}
                </span>
              </SettingRow>
            </section>

            <div className="settings-save-bar">
              <div>
                <strong>Device preferences</strong>
                <span>{settingsStatus || "Save when everything feels right."}</span>
              </div>
              <div>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={handleResetPreferences}
                >
                  Reset
                </button>
                <button className="btn btn-primary" type="submit">
                  <Icon name="check" size={17} />
                  Save preferences
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

export default SettingsPage;
