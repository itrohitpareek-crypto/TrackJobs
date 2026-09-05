import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { io } from "socket.io-client";

import {
  ArrowLeft,
  Check,
  CheckCheck,
  MessageCircle,
  Search,
  Send,
  UserRound,
  X,
} from "lucide-react";

import api, {
  getFileUrl,
  SERVER_URL,
} from "../services/api";

import {
  useAuth,
} from "../context/AuthContext";

import "../styles/messages.css";

// =========================================================
// TIME FORMAT
// =========================================================

const formatTime = (
  date
) => {
  if (!date) return "";

  return new Date(
    date
  ).toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

const formatConversationTime =
  (date) => {
    if (!date) return "";

    const value =
      new Date(date);

    const now =
      new Date();

    if (
      value.toDateString() ===
      now.toDateString()
    ) {
      return formatTime(
        date
      );
    }

    return value.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
      }
    );
  };

// =========================================================
// INITIALS
// =========================================================

const initials = (
  name
) =>
  name
    ?.trim()
    ?.charAt(0)
    ?.toUpperCase() ||
  "U";

const getUserId = (value) => {
  if (!value) return "";

  if (typeof value === "object") {
    return String(
      value._id ||
        value.id ||
        value.user?._id ||
        value.user?.id ||
        ""
    );
  }

  return String(value);
};

// =========================================================
// AVATAR
// =========================================================

function Avatar({
  user,
  large = false,
}) {
  const [
    failed,
    setFailed,
  ] = useState(false);

  const url =
    getFileUrl(
      user?.avatar
    );

  useEffect(() => {
    setFailed(false);
  }, [url]);

  return (
    <span
      className={`messages-avatar ${
        large
          ? "large"
          : ""
      }`}
    >
      {url &&
      !failed ? (
        <img
          src={url}
          alt={
            user?.name ||
            "User"
          }
          onError={() =>
            setFailed(
              true
            )
          }
        />
      ) : (
        initials(
          user?.name
        )
      )}
    </span>
  );
}

// =========================================================
// MAIN
// =========================================================

export default function Messages() {
  const {
    user,
  } = useAuth();

  const [
    conversations,
    setConversations,
  ] = useState([]);

  const [
    selectedUser,
    setSelectedUser,
  ] = useState(null);

  const [
    messages,
    setMessages,
  ] = useState([]);

  const [
    people,
    setPeople,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    messageText,
    setMessageText,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    threadLoading,
    setThreadLoading,
  ] = useState(false);

  const [
    sending,
    setSending,
  ] = useState(false);

  const [
    showNewMessage,
    setShowNewMessage,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const bottomRef =
    useRef(null);

  const socketRef =
    useRef(null);

  const selectedConversation =
    useMemo(
      () =>
        conversations.find(
          (item) =>
            String(
              item.user?._id
            ) ===
            String(
              selectedUser?._id
            )
        ),
      [
        conversations,
        selectedUser,
      ]
    );

  // =======================================================
  // LOAD CONVERSATIONS
  // =======================================================

  const loadConversations =
    async () => {
      try {
        const response =
          await api.get(
            "/messages"
          );

        setConversations(
          response.data ||
            []
        );
      } catch (err) {
        setError(
          err.response
            ?.data
            ?.message ||
            "Unable to load messages."
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  // =======================================================
  // LOAD THREAD
  // =======================================================

  const loadThread =
    async (
      person
    ) => {
      if (!person?._id)
        return;

      setSelectedUser(
        person
      );

      setThreadLoading(
        true
      );

      setError("");

      try {
        const response =
          await api.get(
            `/messages/${person._id}`
          );

        setMessages(
          response.data
            ?.messages ||
            []
        );

        setConversations(
          (current) =>
            current.map(
              (item) =>
                String(
                  item.user?._id
                ) ===
                String(
                  person._id
                )
                  ? {
                      ...item,
                      unreadCount: 0,
                    }
                  : item
            )
        );
      } catch (err) {
        setError(
          err.response
            ?.data
            ?.message ||
            "Unable to load conversation."
        );
      } finally {
        setThreadLoading(
          false
        );
      }
    };

  // =======================================================
  // SEARCH PEOPLE
  // =======================================================

  const searchPeople =
    async (
      value = search
    ) => {
      try {
        const response =
          await api.get(
            "/messages/people",
            {
              params: {
                search:
                  value.trim(),
              },
            }
          );

        setPeople(
          response.data ||
            []
        );
      } catch (err) {
        setError(
          err.response
            ?.data
            ?.message ||
            "Unable to find people."
        );
      }
    };

  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {
    loadConversations();
  }, []);

  // =======================================================
  // SOCKET.IO
  // =======================================================

  useEffect(() => {
    const token =
      localStorage.getItem(
        "jt_token"
      );

    if (!token || !user) {
      return undefined;
    }

    const socket =
      io(
        SERVER_URL,
        {
          auth: {
            token,
          },
          transports: [
            "websocket",
            "polling",
          ],
        }
      );

    socketRef.current =
      socket;

    socket.on(
      "receive-message",
      (incoming) => {
        const senderId =
          incoming.from?._id ||
          incoming.from;

        const recipientId =
          incoming.to?._id ||
          incoming.to;

        const otherId =
          String(senderId) ===
          String(user._id)
            ? recipientId
            : senderId;

        const isCurrentThread =
          String(
            otherId
          ) ===
          String(
            selectedUser?._id
          );

        if (
          isCurrentThread
        ) {
          setMessages(
            (current) => {
              if (
                current.some(
                  (item) =>
                    String(
                      item._id
                    ) ===
                    String(
                      incoming._id
                    )
                )
              ) {
                return current;
              }

              return [
                ...current,
                incoming,
              ];
            }
          );

          if (
            String(
              recipientId
            ) ===
            String(
              user._id
            )
          ) {
            api
              .patch(
                `/messages/${otherId}`
              )
              .catch(
                () => {}
              );
          }
        }

        setConversations(
          (current) => {
            const existing =
              current.find(
                (item) =>
                  String(
                    item.user?._id
                  ) ===
                  String(
                    otherId
                  )
              );

            const otherUser =
              String(
                senderId
              ) ===
              String(
                user._id
              )
                ? incoming.to
                : incoming.from;

            if (!existing) {
              return [
                {
                  user:
                    otherUser,
                  lastMessage:
                    incoming,
                  unreadCount:
                    isCurrentThread ||
                    String(
                      recipientId
                    ) ===
                      String(
                        user._id
                      )
                      ? 0
                      : 1,
                },
                ...current,
              ];
            }

            return [
              {
                ...existing,
                user:
                  otherUser ||
                  existing.user,
                lastMessage:
                  incoming,
                unreadCount:
                  String(
                    recipientId
                  ) ===
                    String(
                      user._id
                    ) &&
                  !isCurrentThread
                    ? (existing.unreadCount ||
                        0) +
                      1
                    : existing.unreadCount ||
                      0,
              },
              ...current.filter(
                (item) =>
                  String(
                    item.user?._id
                  ) !==
                  String(
                    otherId
                  )
              ),
            ];
          }
        );
      }
    );

    return () => {
      socket.disconnect();

      socketRef.current =
        null;
    };
  }, [
    user,
    selectedUser?._id,
  ]);

  // =======================================================
  // REFRESH CURRENT THREAD
  // =======================================================
  // The backend already updates `read` when the recipient opens
  // a conversation. Polling the open thread lets the sender see
  // the single tick turn into double blue ticks without a reload.
  // =======================================================

  useEffect(() => {
    if (!selectedUser?._id) return undefined;

    const refreshThread = async () => {
      try {
        const response = await api.get(
          `/messages/${selectedUser._id}`
        );

        setMessages(
          response.data?.messages || []
        );
      } catch {
        // Keep the existing conversation visible if a background
        // refresh fails temporarily.
      }
    };

    const interval = setInterval(
      refreshThread,
      3000
    );

    return () => {
      clearInterval(interval);
    };
  }, [selectedUser?._id]);

  // =======================================================
  // SCROLL TO BOTTOM
  // =======================================================

  useEffect(() => {
    const container =
      bottomRef.current?.parentElement;

    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // =======================================================
  // SYNC READ / SEEN STATUS
  // =======================================================

  useEffect(() => {
    if (!selectedUser?._id) return undefined;

    let cancelled = false;

    const syncThread = async () => {
      try {
        const response = await api.get(
          `/messages/${selectedUser._id}`
        );

        if (cancelled) return;

        const latest =
          response.data?.messages || [];

        setMessages((current) => {
          const currentSignature = current
            .map(
              (item) =>
                `${item._id}:${item.read ? "1" : "0"}`
            )
            .join("|");

          const latestSignature = latest
            .map(
              (item) =>
                `${item._id}:${item.read ? "1" : "0"}`
            )
            .join("|");

          return currentSignature === latestSignature
            ? current
            : latest;
        });
      } catch (err) {
        // Background read-status refresh is non-blocking.
      }
    };

    const interval = window.setInterval(
      syncThread,
      3000
    );

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [selectedUser?._id]);

  // =======================================================
  // NEW MESSAGE MODAL
  // =======================================================

  useEffect(() => {
    if (
      showNewMessage
    ) {
      searchPeople("");
    }
  }, [
    showNewMessage,
  ]);

  // =======================================================
  // SEND MESSAGE
  // =======================================================

  const sendMessage =
    async (
      event
    ) => {
      event.preventDefault();

      if (
        !selectedUser?._id ||
        !messageText.trim() ||
        sending
      ) {
        return;
      }

      setSending(
        true
      );

      setError("");

      try {
        const response =
          await api.post(
            `/messages/${selectedUser._id}`,
            {
              text:
                messageText.trim(),
            }
          );

        const sent =
          response.data;

        setMessages(
          (current) => {
            if (
              current.some(
                (item) =>
                  String(
                    item._id
                  ) ===
                  String(
                    sent._id
                  )
              )
            ) {
              return current;
            }

            return [
              ...current,
              sent,
            ];
          }
        );

        setMessageText(
          ""
        );

        setConversations(
          (current) => {
            const item = {
              user:
                selectedUser,
              lastMessage:
                sent,
              unreadCount: 0,
            };

            return [
              item,
              ...current.filter(
                (
                  conversation
                ) =>
                  String(
                    conversation
                      .user?._id
                  ) !==
                  String(
                    selectedUser._id
                  )
              ),
            ];
          }
        );
      } catch (err) {
        setError(
          err.response
            ?.data
            ?.message ||
            "Unable to send message."
        );
      } finally {
        setSending(
          false
        );
      }
    };

  // =======================================================
  // FILTER CONVERSATIONS
  // =======================================================

  const filteredConversations =
    conversations.filter(
      (item) =>
        item.user?.name
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );

  // =======================================================
  // UI
  // =======================================================

  return (
    <main className="container messages-page">

      <div className="messages-head">

        <div>
          <span className="eyebrow">
            Professional messaging
          </span>

          <h1>
            Messages
          </h1>

          <p>
            Connect directly with candidates and recruiters.
          </p>
        </div>

        <button
          className="btn messages-new-button"
          type="button"
          onClick={() =>
            setShowNewMessage(
              true
            )
          }
        >
          <MessageCircle
            size={17}
          />

          New message
        </button>

      </div>

      {error && (
        <div className="messages-error">
          {error}
        </div>
      )}

      <section className="messages-shell">

        {/* =================================================
            SIDEBAR
        ================================================= */}

        <aside
          className={`messages-sidebar ${
            selectedUser
              ? "mobile-hidden"
              : ""
          }`}
        >

          <div className="messages-sidebar-head">

            <strong>
              Inbox
            </strong>

            <span>
              {
                conversations.length
              }
            </span>

          </div>

          <div className="messages-search">

            <Search
              size={16}
            />

            <input
              value={
                search
              }
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search conversations"
            />

          </div>

          <div className="conversation-list">

            {loading ? (
              <div className="messages-empty">
                Loading conversations...
              </div>
            ) : filteredConversations.length ===
              0 ? (
              <div className="messages-empty">

                <MessageCircle
                  size={24}
                />

                <strong>
                  No conversations yet
                </strong>

                <span>
                  Start a conversation with a{" "}
                  {user?.role ===
                  "candidate"
                    ? "recruiter"
                    : "candidate"}
                  .
                </span>

              </div>
            ) : (
              filteredConversations.map(
                (
                  item
                ) => (
                  <button
                    type="button"
                    className={`conversation-item ${
                      String(
                        item.user?._id
                      ) ===
                      String(
                        selectedUser?._id
                      )
                        ? "active"
                        : ""
                    }`}
                    key={
                      item.user?._id
                    }
                    onClick={() =>
                      loadThread(
                        item.user
                      )
                    }
                  >

                    <Avatar
                      user={
                        item.user
                      }
                    />

                    <span className="conversation-copy">

                      <span className="conversation-topline">

                        <strong>
                          {
                            item.user
                              ?.name
                          }
                        </strong>

                        <small>
                          {formatConversationTime(
                            item
                              .lastMessage
                              ?.createdAt
                          )}
                        </small>

                      </span>

                      <span className="conversation-preview">
                        {
                          item
                            .lastMessage
                            ?.text ||
                          "Start a conversation"
                        }
                      </span>

                    </span>

                    {item.unreadCount >
                      0 && (
                      <b className="conversation-unread">
                        {item.unreadCount >
                        99
                          ? "99+"
                          : item.unreadCount}
                      </b>
                    )}

                  </button>
                )
              )
            )}

          </div>

        </aside>

        {/* =================================================
            CHAT THREAD
        ================================================= */}

        <section
          className={`messages-thread ${
            !selectedUser
              ? "thread-empty-state"
              : ""
          }`}
        >

          {!selectedUser ? (

            <div className="messages-welcome">

              <div className="messages-welcome-icon">
                <MessageCircle
                  size={30}
                />
              </div>

              <h2>
                Your professional inbox
              </h2>

              <p>
                Select a conversation or start a new message to connect with the right person.
              </p>

              <button
                className="outline"
                type="button"
                onClick={() =>
                  setShowNewMessage(
                    true
                  )
                }
              >
                Start messaging
              </button>

            </div>

          ) : (

            <>

              <header className="thread-head">

                <button
                  type="button"
                  className="thread-back"
                  onClick={() =>
                    setSelectedUser(
                      null
                    )
                  }
                >
                  <ArrowLeft
                    size={18}
                  />
                </button>

                <Avatar
                  user={
                    selectedUser
                  }
                />

                <div>

                  <strong>
                    {
                      selectedUser.name
                    }
                  </strong>

                  <span>
                    {selectedUser.role ===
                    "recruiter"
                      ? selectedUser.company ||
                        "Recruiter"
                      : selectedUser.headline ||
                        "Candidate"}
                  </span>

                </div>

              </header>

              <div className="thread-messages">

                {threadLoading ? (

                  <div className="messages-empty">
                    Loading conversation...
                  </div>

                ) : messages.length ===
                  0 ? (

                  <div className="messages-empty thread-start">

                    <UserRound
                      size={24}
                    />

                    <strong>
                      Start the conversation
                    </strong>

                    <span>
                      Introduce yourself and keep the conversation professional.
                    </span>

                  </div>

                ) : (

                  messages.map(
                    (
                      item
                    ) => {

                      const mine =
                        getUserId(item.from) ===
                        getUserId(user);

                      return (
                        <div
                          className={`message-row ${
                            mine
                              ? "mine"
                              : "theirs"
                          }`}
                          key={
                            item._id
                          }
                        >

                          {!mine && (
                            <Avatar
                              user={
                                item.from
                              }
                            />
                          )}

                          <div className="message-bubble-wrap">

                            <div className="message-bubble">
                              {
                                item.text
                              }
                            </div>

                            <small className="message-meta">
                              <span>
                                {formatTime(
                                  item.createdAt
                                )}
                              </span>

                              {mine && (
                                <span
                                  className={`message-status ${
                                    item.read
                                      ? "read"
                                      : "sent"
                                  }`}
                                  title={
                                    item.read
                                      ? "Seen"
                                      : "Sent"
                                  }
                                  aria-label={
                                    item.read
                                      ? "Seen"
                                      : "Sent"
                                  }
                                >
                                  {item.read ? (
                                    <CheckCheck
                                      size={14}
                                      strokeWidth={2.4}
                                    />
                                  ) : (
                                    <Check
                                      size={14}
                                      strokeWidth={2.4}
                                    />
                                  )}
                                </span>
                              )}
                            </small>

                          </div>

                        </div>
                      );
                    }
                  )
                )}

                <div
                  ref={
                    bottomRef
                  }
                />

              </div>

              <form
                className="message-composer"
                onSubmit={
                  sendMessage
                }
              >

                <textarea
                  value={
                    messageText
                  }
                  onChange={(e) =>
                    setMessageText(
                      e.target.value
                    )
                  }
                  placeholder={`Message ${selectedUser.name}...`}
                  maxLength={5000}
                  rows={1}
                  onKeyDown={(e) => {
                    if (
                      e.key ===
                        "Enter" &&
                      !e.shiftKey
                    ) {
                      e.preventDefault();

                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                />

                <button
                  type="submit"
                  className="message-send"
                  disabled={
                    !messageText.trim() ||
                    sending
                  }
                  aria-label="Send message"
                >
                  <Send
                    size={17}
                  />
                </button>

              </form>

            </>
          )}

        </section>

      </section>

      {/* =================================================
          NEW MESSAGE MODAL
      ================================================= */}

      {showNewMessage && (
        <div
          className="modal-bg messages-new-modal-bg"
          onClick={() =>
            setShowNewMessage(
              false
            )
          }
        >

          <div
            className="messages-new-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="close"
              type="button"
              onClick={() =>
                setShowNewMessage(
                  false
                )
              }
            >
              <X
                size={18}
              />
            </button>

            <span className="eyebrow">
              Start a conversation
            </span>

            <h2>
              New message
            </h2>

            <p className="modal-subtitle">
              Find a{" "}
              {user?.role ===
              "candidate"
                ? "recruiter"
                : "candidate"}{" "}
              and start chatting.
            </p>

            <div className="messages-search large-search">

              <Search
                size={16}
              />

              <input
                autoFocus
                value={
                  search
                }
                onChange={(e) => {
                  setSearch(
                    e.target.value
                  );

                  searchPeople(
                    e.target.value
                  );
                }}
                placeholder="Search by name, company, role..."
              />

            </div>

            <div className="people-results">

              {people.map(
                (
                  person
                ) => (
                  <button
                    type="button"
                    className="person-result"
                    key={
                      person._id
                    }
                    onClick={() => {
                      setShowNewMessage(
                        false
                      );

                      setSearch(
                        ""
                      );

                      loadThread(
                        person
                      );
                    }}
                  >

                    <Avatar
                      user={
                        person
                      }
                    />

                    <span>

                      <strong>
                        {
                          person.name
                        }
                      </strong>

                      <small>
                        {person.role ===
                        "recruiter"
                          ? person.company ||
                            person.headline ||
                            "Recruiter"
                          : person.headline ||
                            "Candidate"}
                      </small>

                    </span>

                  </button>
                )
              )}

              {!people.length && (
                <div className="messages-empty">
                  No matching people found.
                </div>
              )}

            </div>

          </div>

        </div>
      )}

    </main>
  );
}