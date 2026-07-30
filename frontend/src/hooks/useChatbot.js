import { useCallback, useEffect, useState } from "react";
import {
  createChatSession,
  deleteChatSession,
  getChatMessages,
  getChatSessions,
  sendChatMessage,
} from "../api/chatApi";

function useChatbot() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const loadSessions = useCallback(async () => {
    try {
      setLoadingSessions(true);
      setError("");
      const data = await getChatSessions();
      const allSessions = Array.isArray(data) ? data : [];

      setSessions(allSessions);
      setActiveSessionId((currentId) => {
        const stillExists = allSessions.some(
          (session) => String(session.id) === String(currentId),
        );
        return stillExists ? currentId : allSessions[0]?.id || null;
      });
      return allSessions;
    } catch (loadError) {
      console.error("Error loading chat sessions:", loadError);
      setError(loadError.message);
      return [];
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadInitialSessions = async () => {
      try {
        const data = await getChatSessions();
        if (ignore) return;

        const allSessions = Array.isArray(data) ? data : [];
        setSessions(allSessions);
        setActiveSessionId(allSessions[0]?.id || null);
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
  }, []);

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

  useEffect(() => {
    const handleHistoryCleared = () => {
      setSessions([]);
      setActiveSessionId(null);
      setMessages([]);
    };
    window.addEventListener("planova:chat-history-cleared", handleHistoryCleared);
    return () =>
      window.removeEventListener(
        "planova:chat-history-cleared",
        handleHistoryCleared,
      );
  }, []);

  const startNewConversation = async (tripId = null) => {
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

  const sendMessage = async (messageData, newSessionTripId = null) => {
    let sessionId = activeSessionId;

    try {
      setSending(true);
      setError("");

      if (!sessionId) {
        const session = await startNewConversation(newSessionTripId);
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
