import { useCallback, useEffect, useState } from "react";
import {
  createChatSession,
  deleteChatSession,
  getChatMessages,
  getChatSessions,
  sendChatMessage,
} from "../api/chatApi";

function useChatbot(tripId) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const loadSessions = useCallback(async () => {
    if (!tripId) return [];

    try {
      setLoadingSessions(true);
      setError("");
      const data = await getChatSessions();
      const tripSessions = (Array.isArray(data) ? data : []).filter(
        (session) => String(session.trip_id) === String(tripId),
      );

      setSessions(tripSessions);
      setActiveSessionId((currentId) => {
        const stillExists = tripSessions.some(
          (session) => String(session.id) === String(currentId),
        );
        return stillExists ? currentId : tripSessions[0]?.id || null;
      });
      return tripSessions;
    } catch (loadError) {
      console.error("Error loading chat sessions:", loadError);
      setError(loadError.message);
      return [];
    } finally {
      setLoadingSessions(false);
    }
  }, [tripId]);

  useEffect(() => {
    let ignore = false;

    const loadInitialSessions = async () => {
      try {
        const data = await getChatSessions();
        if (ignore) return;

        const tripSessions = (Array.isArray(data) ? data : []).filter(
          (session) => String(session.trip_id) === String(tripId),
        );
        setSessions(tripSessions);
        setActiveSessionId(tripSessions[0]?.id || null);
      } catch (loadError) {
        if (!ignore) {
          console.error("Error loading chat sessions:", loadError);
          setError(loadError.message);
        }
      } finally {
        if (!ignore) setLoadingSessions(false);
      }
    };

    loadInitialSessions();
    return () => {
      ignore = true;
    };
  }, [tripId]);

  useEffect(() => {
    if (!activeSessionId) return;

    let ignore = false;

    const loadMessages = async () => {
      try {
        setLoadingMessages(true);
        setError("");
        const data = await getChatMessages(activeSessionId);
        if (!ignore) {
          setMessages(Array.isArray(data?.messages) ? data.messages : []);
        }
      } catch (loadError) {
        if (!ignore) {
          console.error("Error loading chat messages:", loadError);
          setError(loadError.message);
          setMessages([]);
        }
      } finally {
        if (!ignore) setLoadingMessages(false);
      }
    };

    loadMessages();
    return () => {
      ignore = true;
    };
  }, [activeSessionId]);

  const startNewConversation = async () => {
    try {
      setError("");
      const session = await createChatSession({ tripId });
      setSessions((current) => [session, ...current]);
      setActiveSessionId(session.id);
      setMessages([]);
      return session;
    } catch (createError) {
      console.error("Error creating chat session:", createError);
      setError(createError.message);
      throw createError;
    }
  };

  const sendMessage = async (messageData) => {
    let sessionId = activeSessionId;

    try {
      setSending(true);
      setError("");

      if (!sessionId) {
        const session = await startNewConversation();
        sessionId = session.id;
      }

      const optimisticMessage = {
        id: `pending-${Date.now()}`,
        role: "user",
        content: messageData.message,
        created_at: new Date().toISOString(),
      };
      setMessages((current) => [...current, optimisticMessage]);

      try {
        const assistantMessage = await sendChatMessage(sessionId, messageData);
        try {
          const conversation = await getChatMessages(sessionId);
          setMessages(
            Array.isArray(conversation?.messages)
              ? conversation.messages
              : [optimisticMessage, assistantMessage],
          );
        } catch {
          setMessages((current) =>
            current.some((item) => item.id === optimisticMessage.id)
              ? [...current, assistantMessage]
              : [optimisticMessage, assistantMessage],
          );
        }
        await loadSessions();
        setActiveSessionId(sessionId);
        return assistantMessage;
      } catch (sendError) {
        setMessages((current) =>
          current.filter((message) => message.id !== optimisticMessage.id),
        );
        throw sendError;
      }
    } catch (sendError) {
      console.error("Error sending chat message:", sendError);
      const retryMessage = sendError.retryAfter
        ? ` Try again in ${sendError.retryAfter} seconds.`
        : "";
      setError(`${sendError.message}${retryMessage}`);
      throw sendError;
    } finally {
      setSending(false);
    }
  };

  const removeConversation = async (sessionId) => {
    try {
      setError("");
      await deleteChatSession(sessionId);
      const remaining = sessions.filter(
        (session) => String(session.id) !== String(sessionId),
      );
      setSessions(remaining);

      if (String(activeSessionId) === String(sessionId)) {
        setActiveSessionId(remaining[0]?.id || null);
        setMessages([]);
      }
    } catch (deleteError) {
      console.error("Error deleting chat session:", deleteError);
      setError(deleteError.message);
      throw deleteError;
    }
  };

  return {
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
  };
}

export default useChatbot;
