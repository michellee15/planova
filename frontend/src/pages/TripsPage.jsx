import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createTrip,
  deleteTrip,
  getTrips,
  updateTrip,
} from "../api/tripApi";
import Icon from "../components/ui/Icon";
import Modal from "../components/ui/Modal";
import { useConfirmDialog } from "../components/ui/confirmDialogContext";
import { formatDisplayDate, getPreferences } from "../utils/preferences";
import {
  acceptInvitation,
  declineInvitation,
  getPendingInvitations,
  leaveSharedTrip,
} from "../api/collaborationApi";
import PendingInvitations from "../components/collaboration/PendingInvitations";

const createEmptyForm = () => ({
  title: "",
  destination: "",
  start_date: "",
  end_date: "",
  total_budget: "",
  currency: getPreferences().defaultCurrency,
  num_of_people: 1,
});

const paletteNames = ["lavender", "peach", "mint", "sky"];

function displayDate(date) {
  return formatDisplayDate(date);
}

function TripForm({ formData, onChange, onSubmit, onCancel, error, isEditing }) {
  return (
    <form className="trip-modal-form" onSubmit={onSubmit}>
      <div className="form-grid">
        <div className="form-field full-width">
          <label htmlFor="trip-title">Trip name</label>
          <input
            id="trip-title"
            type="text"
            name="title"
            value={formData.title}
            onChange={onChange}
            placeholder="e.g. Spring in Kyoto"
            required
          />
        </div>

        <div className="form-field full-width">
          <label htmlFor="trip-destination">Destination</label>
          <input
            id="trip-destination"
            type="text"
            name="destination"
            value={formData.destination}
            onChange={onChange}
            placeholder="City or country"
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="trip-start">Start date</label>
          <input
            id="trip-start"
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={onChange}
          />
        </div>

        <div className="form-field">
          <label htmlFor="trip-end">End date</label>
          <input
            id="trip-end"
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={onChange}
            min={formData.start_date || undefined}
          />
        </div>

        <div className="form-field">
          <label htmlFor="trip-budget">Budget</label>
          <input
            id="trip-budget"
            type="number"
            min="0"
            step="0.01"
            name="total_budget"
            value={formData.total_budget}
            onChange={onChange}
            placeholder="Optional"
          />
        </div>

        <div className="form-field">
          <label htmlFor="trip-currency">Currency</label>
          <input
            id="trip-currency"
            type="text"
            maxLength="3"
            name="currency"
            value={formData.currency}
            onChange={onChange}
            placeholder="SGD"
          />
        </div>

        <div className="form-field full-width">
          <label htmlFor="trip-people">Number of travellers</label>
          <input
            id="trip-people"
            type="number"
            min="1"
            name="num_of_people"
            value={formData.num_of_people}
            onChange={onChange}
          />
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="trip-modal-actions">
        <button className="btn btn-secondary" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-primary" type="submit">
          <Icon name={isEditing ? "check" : "plus"} size={17} />
          {isEditing ? "Save changes" : "Create trip"}
        </button>
      </div>
    </form>
  );
}

function TripsPage() {
  const confirm = useConfirmDialog();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [formData, setFormData] = useState(createEmptyForm);
  const [formError, setFormError] = useState("");
  const [invitations, setInvitations] = useState([]);
  const [invitationsLoading, setInvitationsLoading] = useState(true);
  const [invitationError, setInvitationError] = useState("");
  const [busyInvitationId, setBusyInvitationId] = useState(null);

  const loadTrips = useCallback(async () => {
    try {
      const data = await getTrips();
      setTrips(Array.isArray(data) ? data : []);
    } catch (loadError) {
      console.error("Error loading trips:", loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadInitialData = async () => {
      const [tripsResult, invitationsResult] = await Promise.allSettled([
        getTrips(),
        getPendingInvitations(),
      ]);
      if (ignore) return;

      if (tripsResult.status === "fulfilled") {
        setTrips(Array.isArray(tripsResult.value) ? tripsResult.value : []);
      } else {
        console.error("Error loading trips:", tripsResult.reason);
      }

      if (invitationsResult.status === "fulfilled") {
        setInvitations(
          Array.isArray(invitationsResult.value)
            ? invitationsResult.value
            : [],
        );
      } else {
        console.error(
          "Error loading trip invitations:",
          invitationsResult.reason,
        );
        setInvitationError(invitationsResult.reason.message);
      }

      setLoading(false);
      setInvitationsLoading(false);
    };

    loadInitialData();
    return () => {
      ignore = true;
    };
  }, []);

  const upcomingTrips = useMemo(
    () =>
      trips.filter(
        (trip) => !trip.end_date || new Date(trip.end_date) >= new Date(),
      ).length,
    [trips],
  );

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingTrip(null);
    setFormData(createEmptyForm());
    setFormError("");
  };

  const openCreateModal = () => {
    setFormData(createEmptyForm());
    setFormError("");
    setShowCreateModal(true);
  };

  const openEditModal = (trip) => {
    setFormData({
      title: trip.title || "",
      destination: trip.destination || "",
      start_date: trip.start_date?.slice(0, 10) || "",
      end_date: trip.end_date?.slice(0, 10) || "",
      total_budget: trip.total_budget ?? "",
      currency: trip.currency || "SGD",
      num_of_people: trip.num_of_people || 1,
    });
    setFormError("");
    setEditingTrip(trip);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const normaliseForm = () => ({
    ...formData,
    currency: formData.currency.trim().toUpperCase() || "SGD",
    total_budget:
      formData.total_budget === "" ? null : Number(formData.total_budget),
    num_of_people: Number(formData.num_of_people) || 1,
    start_date: formData.start_date || null,
    end_date: formData.end_date || null,
  });

  const handleCreate = async (event) => {
    event.preventDefault();
    setFormError("");
    try {
      const newTrip = await createTrip(normaliseForm());
      setTrips((current) => [
        { ...newTrip, access_role: "owner" },
        ...current,
      ]);
      closeModal();
    } catch (error) {
      console.error("Error creating trip:", error);
      setFormError("We couldn’t create this trip. Please try again.");
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    setFormError("");
    try {
      const updatedTrip = await updateTrip(editingTrip.id, normaliseForm());
      setTrips((current) =>
        current.map((trip) =>
          String(trip.id) === String(editingTrip.id)
            ? { ...updatedTrip, access_role: trip.access_role }
            : trip,
        ),
      );
      closeModal();
    } catch (error) {
      console.error("Error updating trip:", error);
      setFormError("We couldn’t save these changes. Please try again.");
    }
  };

  const handleAcceptInvitation = async (invitation) => {
    try {
      setBusyInvitationId(invitation.id);
      setInvitationError("");
      await acceptInvitation(invitation.id);
      setInvitations((current) =>
        current.filter(
          (item) => String(item.id) !== String(invitation.id),
        ),
      );
      await loadTrips();
    } catch (acceptError) {
      console.error("Error accepting invitation:", acceptError);
      setInvitationError(acceptError.message);
    } finally {
      setBusyInvitationId(null);
    }
  };

  const handleDeclineInvitation = async (invitation) => {
    try {
      setBusyInvitationId(invitation.id);
      setInvitationError("");
      await declineInvitation(invitation.id);
      setInvitations((current) =>
        current.filter(
          (item) => String(item.id) !== String(invitation.id),
        ),
      );
    } catch (declineError) {
      console.error("Error declining invitation:", declineError);
      setInvitationError(declineError.message);
    } finally {
      setBusyInvitationId(null);
    }
  };

  const handleLeaveTrip = async (trip) => {
    const confirmed = await confirm({
      title: `Leave “${trip.title}”?`,
      description:
        "You will lose access to this shared trip. Your private AI conversations will remain in your account without this trip attached.",
      confirmLabel: "Leave trip",
      destructive: true,
    });
    if (!confirmed) return;

    try {
      await leaveSharedTrip(trip.id);
      setTrips((current) =>
        current.filter((item) => String(item.id) !== String(trip.id)),
      );
    } catch (leaveError) {
      console.error("Error leaving shared trip:", leaveError);
    }
  };

  const handleDelete = async (trip) => {
    const confirmed = await confirm({
      title: `Delete “${trip.title}”?`,
      description:
        "The trip, its itinerary, expenses, and member information will be permanently removed.",
      confirmLabel: "Delete trip",
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await deleteTrip(trip.id);
      setTrips((current) =>
        current.filter((item) => String(item.id) !== String(trip.id)),
      );
    } catch (error) {
      console.error("Error deleting trip:", error);
    }
  };

  return (
    <main className="trips-page">
      <section className="trips-hero">
        <div>
          <p className="page-eyebrow">
            <Icon name="sparkle" size={15} />
            Your little travel world
          </p>
          <h1>Where are we going next?</h1>
          <p className="trips-hero-copy">
            Keep every plan, shared cost, and happy idea in one cosy place.
          </p>
          <div className="trip-summary-pills">
            <span>
              <strong>{trips.length}</strong> total trips
            </span>
            <span>
              <strong>{upcomingTrips}</strong> upcoming
            </span>
          </div>
        </div>
        <button className="btn btn-primary trips-create-button" type="button" onClick={openCreateModal}>
          <Icon name="plus" size={18} />
          Plan a new trip
        </button>
      </section>

      <PendingInvitations
        invitations={invitations}
        loading={invitationsLoading}
        busyInvitationId={busyInvitationId}
        error={invitationError}
        onAccept={handleAcceptInvitation}
        onDecline={handleDeclineInvitation}
      />

      <section className="trips-content" aria-labelledby="trips-heading">
        <div className="trips-section-heading">
          <div>
            <p className="page-eyebrow">Your journeys</p>
            <h2 id="trips-heading">My trips</h2>
          </div>
          {trips.length > 0 && <span>{trips.length} saved</span>}
        </div>

        {loading ? (
          <div className="trip-loading">
            <span className="trip-loading-dot" />
            Gathering your travel plans…
          </div>
        ) : trips.length === 0 ? (
          <div className="trips-empty">
            <span className="trips-empty-icon">
              <Icon name="map" size={34} />
            </span>
            <h3>Your travel journal is waiting</h3>
            <p>Start with a destination you’ve been daydreaming about.</p>
            <button className="btn btn-primary" type="button" onClick={openCreateModal}>
              <Icon name="plus" size={17} />
              Create your first trip
            </button>
          </div>
        ) : (
          <div className="trip-grid">
            {trips.map((trip, index) => {
              const startDate = displayDate(trip.start_date);
              const endDate = displayDate(trip.end_date);
              const palette = paletteNames[index % paletteNames.length];
              const isOwner = trip.access_role !== "editor";

              return (
                <article className={`trip-card trip-card-${palette}`} key={trip.id}>
                  <div className="trip-card-visual">
                    <span className="trip-card-sun" />
                    <span className="trip-card-hill trip-card-hill-back" />
                    <span className="trip-card-hill trip-card-hill-front" />
                    <span className="trip-card-pin">
                      <Icon name="pin" size={18} />
                    </span>
                    <details className="trip-card-menu">
                      <summary aria-label={`Actions for ${trip.title}`}>
                        <Icon name="more" size={19} />
                      </summary>
                      <div>
                        <button type="button" onClick={() => openEditModal(trip)}>
                          <Icon name="edit" size={16} />
                          Edit trip
                        </button>
                        {isOwner ? (
                          <button className="danger" type="button" onClick={() => handleDelete(trip)}>
                            <Icon name="trash" size={16} />
                            Delete
                          </button>
                        ) : (
                          <button className="danger" type="button" onClick={() => handleLeaveTrip(trip)}>
                            <Icon name="arrowLeft" size={16} />
                            Leave trip
                          </button>
                        )}
                      </div>
                    </details>
                  </div>

                  <div className="trip-card-body">
                    <div className="trip-card-kicker">
                      <span className="trip-destination">
                        <Icon name="pin" size={14} />
                        {trip.destination}
                      </span>
                      <span
                        className={`trip-access-badge ${
                          isOwner ? "is-owner" : "is-shared"
                        }`}
                      >
                        {isOwner ? "Owner" : "Shared"}
                      </span>
                    </div>
                    <h3>{trip.title}</h3>

                    <div className="trip-card-meta">
                      <span>
                        <Icon name="calendar" size={16} />
                        {startDate && endDate
                          ? `${startDate} – ${endDate}`
                          : startDate || "Dates to be decided"}
                      </span>
                      <span>
                        <Icon name="users" size={16} />
                        {trip.num_of_people || 1} traveller
                        {Number(trip.num_of_people) === 1 ? "" : "s"}
                      </span>
                      <span>
                        <Icon name="wallet" size={16} />
                        {trip.total_budget
                          ? `${trip.currency || "SGD"} ${Number(trip.total_budget).toLocaleString()}`
                          : "Budget not set"}
                      </span>
                    </div>

                    <Link className="trip-card-link" to={`/trips/${trip.id}`}>
                      View trip
                      <Icon name="arrowRight" size={17} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {showCreateModal && (
        <Modal
          title="Create a new trip"
          subtitle="Add the basics now—you can fill in the lovely details later."
          onClose={closeModal}
        >
          <TripForm
            formData={formData}
            onChange={handleFormChange}
            onSubmit={handleCreate}
            onCancel={closeModal}
            error={formError}
          />
        </Modal>
      )}

      {editingTrip && (
        <Modal
          title="Edit trip"
          subtitle={`Make a few changes to ${editingTrip.title}.`}
          onClose={closeModal}
        >
          <TripForm
            formData={formData}
            onChange={handleFormChange}
            onSubmit={handleUpdate}
            onCancel={closeModal}
            error={formError}
            isEditing
          />
        </Modal>
      )}
    </main>
  );
}

export default TripsPage;
