import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  ArrowLeft, Check, CheckCheck, Copy, Download, Edit3, FileText,
  Image as ImageIcon, MessageCircle, MoreVertical, Paperclip, Search,
  Send, Smile, Trash2, UserRound, X, Reply, ChevronDown
} from "lucide-react";
import api, { getFileUrl, SERVER_URL } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../styles/messages.css";

const EMOJIS = ["😀","😂","🤣","😊","😍","🥰","😘","😉","😎","🤝","👍","👏","🙏","❤️","🔥","🎉","💯","🙌","✨","🚀","😅","😄","🤔","😮","😢","😡","👋","✅","❌","⭐","💪","🎯"];

const formatTime = (date) => date ? new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";
const formatConversationTime = (date) => {
  if (!date) return "";
  const value = new Date(date);
  const now = new Date();
  return value.toDateString() === now.toDateString() ? formatTime(date) : value.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};
const dateLabel = (date) => {
  const d = new Date(date), now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
};
const initials = (name) => name?.trim()?.charAt(0)?.toUpperCase() || "U";
const getUserId = (v) => typeof v === "object" ? String(v?._id || v?.id || v?.user?._id || v?.user?.id || "") : String(v || "");
const fileSize = (bytes = 0) => bytes < 1024 ? `${bytes} B` : bytes < 1024*1024 ? `${(bytes/1024).toFixed(1)} KB` : `${(bytes/1024/1024).toFixed(1)} MB`;
const isImage = (a) => a?.mimeType?.startsWith("image/");

function Avatar({ user, large = false }) {
  const [failed, setFailed] = useState(false);
  const url = getFileUrl(user?.avatar);
  useEffect(() => setFailed(false), [url]);
  return <span className={`messages-avatar ${large ? "large" : ""}`}>
    {url && !failed ? <img src={url} alt={user?.name || "User"} onError={() => setFailed(true)} /> : initials(user?.name)}
  </span>;
}

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [people, setPeople] = useState([]);
  const [search, setSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [messageText, setMessageText] = useState("");
  const [files, setFiles] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState(null);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const socketRef = useRef(null);
  const fileRef = useRef(null);
  const typingTimer = useRef(null);
  const messageActionRef = useRef(null);

  const selectedConversation = useMemo(() => conversations.find(x => String(x.user?._id) === String(selectedUser?._id)), [conversations, selectedUser]);
  const filteredConversations = conversations.filter(x => x.user?.name?.toLowerCase().includes(search.toLowerCase()));
  const visibleMessages = messages.filter(m => {
    const q = messageSearch.trim().toLowerCase();
    return !q || m.text?.toLowerCase().includes(q) || m.attachments?.some(a => a.name?.toLowerCase().includes(q));
  });

  const loadConversations = async () => {
    try { const r = await api.get("/messages"); setConversations(r.data || []); }
    catch (e) { setError(e.response?.data?.message || "Unable to load messages."); }
    finally { setLoading(false); }
  };

  const loadThread = async (person) => {
    if (!person?._id) return;
    setSelectedUser(person); setThreadLoading(true); setError(""); setShowMenu(false); setMessageSearch(""); setActiveMessageId(null);
    try {
      const r = await api.get(`/messages/${person._id}`);
      setMessages(r.data?.messages || []);
      setConversations(c => c.map(x => String(x.user?._id) === String(person._id) ? { ...x, unreadCount: 0 } : x));
    } catch (e) { setError(e.response?.data?.message || "Unable to load conversation."); }
    finally { setThreadLoading(false); }
  };

  const searchPeople = async (value = "") => {
    try { const r = await api.get("/messages/people", { params: { search: value.trim() } }); setPeople(r.data || []); }
    catch (e) { setError(e.response?.data?.message || "Unable to find people."); }
  };

  useEffect(() => { loadConversations(); }, []);

  useEffect(() => {
    const token = localStorage.getItem("jt_token");
    if (!token || !user) return undefined;
    const socket = io(SERVER_URL, { auth: { token }, transports: ["websocket", "polling"] });
    socketRef.current = socket;
    socket.on("receive-message", incoming => {
      const senderId = incoming.from?._id || incoming.from;
      const recipientId = incoming.to?._id || incoming.to;
      const otherId = String(senderId) === String(user._id) ? recipientId : senderId;
      const current = String(otherId) === String(selectedUser?._id);
      if (current) {
        setMessages(m => m.some(x => String(x._id) === String(incoming._id)) ? m : [...m, incoming]);
        if (String(recipientId) === String(user._id)) api.patch(`/messages/${otherId}/read`).catch(() => {});
      }
      const otherUser = String(senderId) === String(user._id) ? incoming.to : incoming.from;
      setConversations(c => [{ user: otherUser, lastMessage: incoming, unreadCount: String(recipientId) === String(user._id) && !current ? (c.find(x => String(x.user?._id) === String(otherId))?.unreadCount || 0) + 1 : 0 }, ...c.filter(x => String(x.user?._id) !== String(otherId))]);
    });
    socket.on("message-updated", updated => setMessages(m => m.map(x => String(x._id) === String(updated._id) ? updated : x)));
    socket.on("message-deleted", p => setMessages(m => m.map(x => String(x._id) === String(p.messageId) ? { ...x, text: "", attachments: [], deleted: true } : x)));
    socket.on("chat-cleared", p => { if (String(p.userId) === String(selectedUser?._id)) setMessages([]); loadConversations(); });
    socket.on("messages-read", p => { if (String(p.by) === String(selectedUser?._id)) setMessages(m => m.map(x => getUserId(x.from) === String(user._id) ? { ...x, read: true } : x)); });
    socket.on("user-typing", p => { if (String(p.userId) === String(selectedUser?._id)) { setTyping(Boolean(p.typing)); } });
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [user, selectedUser?._id]);

  useEffect(() => {
    if (!selectedUser?._id) return;
    const refresh = async () => { try { const r = await api.get(`/messages/${selectedUser._id}`); setMessages(r.data?.messages || []); } catch {} };
    const id = setInterval(refresh, 10000);
    return () => clearInterval(id);
  }, [selectedUser?._id]);

  useEffect(() => {
    const el = bottomRef.current?.parentElement;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const notifyTyping = (value) => {
    if (!selectedUser?._id || !socketRef.current) return;
    socketRef.current.emit("typing", { to: selectedUser._id, typing: value });
    clearTimeout(typingTimer.current);
    if (value) typingTimer.current = setTimeout(() => socketRef.current?.emit("typing", { to: selectedUser._id, typing: false }), 1200);
  };

  const send = async (e) => {
    e?.preventDefault();
    if (!selectedUser?._id || sending || (!messageText.trim() && !files.length)) return;
    setSending(true); setError("");
    try {
      if (editing) {
        const r = await api.patch(`/messages/${selectedUser._id}/${editing._id}`, { text: messageText.trim() });
        setMessages(m => m.map(x => String(x._id) === String(editing._id) ? r.data : x));
        setEditing(null); setMessageText("");
      } else {
        const fd = new FormData();
        fd.append("text", messageText.trim());
        if (replyTo?._id) fd.append("replyTo", replyTo._id);
        files.forEach(f => fd.append("attachments", f));
        const r = await api.post(`/messages/${selectedUser._id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        setMessages(m => m.some(x => String(x._id) === String(r.data._id)) ? m : [...m, r.data]);
        setConversations(c => [{ user: selectedUser, lastMessage: r.data, unreadCount: 0 }, ...c.filter(x => String(x.user?._id) !== String(selectedUser._id))]);
        setMessageText(""); setFiles([]); setReplyTo(null); setShowEmoji(false); notifyTyping(false);
      }
    } catch (e) { setError(e.response?.data?.message || "Unable to send message."); }
    finally { setSending(false); }
  };

  const chooseFiles = (e) => {
    const chosen = Array.from(e.target.files || []);
    const valid = chosen.filter(f => f.size <= 10 * 1024 * 1024);
    if (valid.length !== chosen.length) setError("Each attachment must be 10 MB or smaller.");
    setFiles(prev => [...prev, ...valid].slice(0, 10));
    e.target.value = "";
  };

  const deleteMessage = async (item) => {
    setActiveMessageId(null);
    if (!window.confirm("Delete this message for everyone?")) return;
    try { await api.delete(`/messages/${selectedUser._id}/${item._id}`); setMessages(m => m.map(x => String(x._id) === String(item._id) ? { ...x, deleted: true, text: "", attachments: [] } : x)); }
    catch (e) { setError(e.response?.data?.message || "Unable to delete message."); }
  };

  const clearChat = async () => {
    if (!window.confirm("Clear this entire conversation? This cannot be undone.")) return;
    try { await api.delete(`/messages/${selectedUser._id}/clear`); setMessages([]); setShowMenu(false); loadConversations(); }
    catch (e) { setError(e.response?.data?.message || "Unable to clear chat."); }
  };

  const copyMessage = async (text) => { if (!text) return; try { await navigator.clipboard.writeText(text); } catch {} setActiveMessageId(null); };
  const startEdit = item => { setEditing(item); setReplyTo(null); setMessageText(item.text || ""); setShowEmoji(false); setActiveMessageId(null); };
  const startReply = item => { setReplyTo(item); setEditing(null); setActiveMessageId(null); };

  return <main className="container messages-page">
    <div className="messages-head">
      <div><span className="eyebrow">Professional messaging</span><h1>Messages</h1><p>Connect directly with candidates and recruiters.</p></div>
      <button className="btn messages-new-button" type="button" onClick={() => { setShowNewMessage(true); searchPeople(""); }}><MessageCircle size={17}/> New message</button>
    </div>
    {error && <div className="messages-error">{error}<button type="button" onClick={() => setError("")}><X size={14}/></button></div>}
    <section className="messages-shell">
      <aside className={`messages-sidebar ${selectedUser ? "mobile-hidden" : ""}`}>
        <div className="messages-sidebar-head"><strong>Inbox</strong><span>{conversations.length}</span></div>
        <div className="messages-search"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations"/></div>
        <div className="conversation-list">
          {loading ? <div className="messages-empty">Loading conversations...</div> : filteredConversations.length === 0 ? <div className="messages-empty"><MessageCircle size={24}/><strong>No conversations yet</strong><span>Start a conversation with a {user?.role === "candidate" ? "recruiter" : "candidate"}.</span></div> : filteredConversations.map(item => <button type="button" className={`conversation-item ${String(item.user?._id) === String(selectedUser?._id) ? "active" : ""}`} key={item.user?._id} onClick={() => loadThread(item.user)}>
            <Avatar user={item.user}/><span className="conversation-copy"><span className="conversation-topline"><strong>{item.user?.name}</strong><small>{formatConversationTime(item.lastMessage?.createdAt)}</small></span><span className="conversation-preview">{item.lastMessage?.deleted ? "Message deleted" : item.lastMessage?.attachments?.length ? `📎 ${item.lastMessage.attachments.length} attachment${item.lastMessage.attachments.length > 1 ? "s" : ""}` : item.lastMessage?.text || "Start a conversation"}</span></span>{item.unreadCount > 0 && <b className="conversation-unread">{item.unreadCount > 99 ? "99+" : item.unreadCount}</b>}
          </button>)}
        </div>
      </aside>

      <section className={`messages-thread ${!selectedUser ? "thread-empty-state" : ""}`}>
        {!selectedUser ? <div className="messages-welcome"><div className="messages-welcome-icon"><MessageCircle size={30}/></div><h2>Your professional inbox</h2><p>Select a conversation or start a new message to connect with the right person.</p><button className="outline" type="button" onClick={() => { setShowNewMessage(true); searchPeople(""); }}>Start messaging</button></div> : <>
          <header className="thread-head">
            <button type="button" className="thread-back" onClick={() => setSelectedUser(null)}><ArrowLeft size={18}/></button>
            <Avatar user={selectedUser}/><div><strong>{selectedUser.name}</strong><span>{selectedUser.role === "recruiter" ? selectedUser.company || "Recruiter" : selectedUser.headline || "Candidate"}{typing ? " • typing…" : ""}</span></div>
            <div style={{ marginLeft: "auto", position: "relative" }}><button type="button" className="chat-icon-button" onClick={() => setShowMenu(v => !v)} aria-label="Chat options"><MoreVertical size={19}/></button>{showMenu && <div className="chat-menu"><button type="button" onClick={clearChat}><Trash2 size={15}/> Clear chat</button><button type="button" onClick={() => setMessageSearch(v => v ? "" : " ")}><Search size={15}/> Search messages</button></div>}</div>
          </header>
          {messageSearch !== "" && <div className="message-search-bar"><Search size={15}/><input autoFocus value={messageSearch.trim()} onChange={e => setMessageSearch(e.target.value)} placeholder="Search messages..."/><button type="button" onClick={() => setMessageSearch("")}><X size={14}/></button></div>}
          <div className="thread-messages">
            {threadLoading ? <div className="messages-empty">Loading conversation...</div> : visibleMessages.length === 0 ? <div className="messages-empty thread-start"><UserRound size={24}/><strong>{messageSearch ? "No matching messages" : "Start the conversation"}</strong><span>{messageSearch ? "Try another search." : "Introduce yourself and keep the conversation professional."}</span></div> : visibleMessages.map((item, i) => {
              const mine = getUserId(item.from) === getUserId(user);
              const prev = visibleMessages[i-1];
              const showDate = !prev || dateLabel(item.createdAt) !== dateLabel(prev.createdAt);
              return <div key={item._id}>{showDate && <div className="chat-date-separator"><span>{dateLabel(item.createdAt)}</span></div>}<div className={`message-row ${mine ? "mine" : "theirs"} ${activeMessageId === item._id ? "message-active" : ""}`}>
                {!mine && <Avatar user={item.from}/>}<div className="message-bubble-wrap" ref={activeMessageId === item._id ? messageActionRef : null}>
                  {item.replyTo && <div className="reply-preview"><Reply size={13}/><span>{item.replyTo.text || "Attachment"}</span></div>}
                  <div
                    className={`message-bubble ${item.deleted ? "deleted-message" : ""}`}
                    onClick={() => { if (!item.deleted) setActiveMessageId(prev => prev === item._id ? null : item._id); }}
                    role={!item.deleted ? "button" : undefined}
                    tabIndex={!item.deleted ? 0 : undefined}
                    onKeyDown={(e) => { if (!item.deleted && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); setActiveMessageId(prev => prev === item._id ? null : item._id); } }}
                  >
                    {item.deleted ? <em>This message was deleted</em> : <>{item.text && <div className="message-text">{item.text}</div>}{item.attachments?.length > 0 && <div className="attachments-list">{item.attachments.map((a, idx) => isImage(a) ? <button type="button" className="chat-image-attachment" key={`${a.url}-${idx}`} onClick={(e) => { e.stopPropagation(); setPreviewImage(a.url); }}><img src={a.url} alt={a.name}/></button> : <a className="chat-file-attachment" href={a.url} target="_blank" rel="noreferrer" download={a.name} onClick={(e) => e.stopPropagation()}><FileText size={24}/><span><strong>{a.name}</strong><small>{fileSize(a.size)}</small></span><Download size={16}/></a>)}</div>}</>}
                  </div>
                  {activeMessageId === item._id && !item.deleted && <div className={`message-actions-popover ${mine ? "mine-popover" : "theirs-popover"}`} onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={() => startReply(item)}><Reply size={15}/><span>Reply</span></button>
                    {item.text && <button type="button" onClick={() => copyMessage(item.text)}><Copy size={15}/><span>Copy</span></button>}
                    {mine && <button type="button" onClick={() => startEdit(item)}><Edit3 size={15}/><span>Edit</span></button>}
                    {mine && <button type="button" className="danger-action" onClick={() => deleteMessage(item)}><Trash2 size={15}/><span>Delete</span></button>}
                  </div>}
                  <small className="message-meta"><span>{formatTime(item.createdAt)} {item.edited && !item.deleted ? "· edited" : ""}</span>{mine && !item.deleted && <span className={`message-status ${item.read ? "read" : "sent"}`} title={item.read ? "Seen" : "Sent"}>{item.read ? <CheckCheck size={14}/> : <Check size={14}/>}</span>}</small>
                </div>
              </div></div>;
            })}<div ref={bottomRef}/>
          </div>
          {(replyTo || editing || files.length) > 0 && <div className="composer-context">{editing ? <><Edit3 size={15}/><span>Editing message</span><button type="button" onClick={() => { setEditing(null); setMessageText(""); }}><X size={14}/></button></> : replyTo ? <><Reply size={15}/><span>Replying to: {replyTo.text || "Attachment"}</span><button type="button" onClick={() => setReplyTo(null)}><X size={14}/></button></> : <><Paperclip size={15}/><span>{files.length} file{files.length > 1 ? "s" : ""} selected</span><button type="button" onClick={() => setFiles([])}><X size={14}/></button></>}</div>}
          <form className="message-composer" onSubmit={send}>
            <input ref={fileRef} type="file" hidden multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt" onChange={chooseFiles}/>
            <button type="button" className="composer-icon" onClick={() => fileRef.current?.click()} title="Attach files"><Paperclip size={18}/></button>
            <div style={{ flex: 1, position: "relative" }}><textarea value={messageText} onChange={e => { setMessageText(e.target.value); notifyTyping(Boolean(e.target.value)); }} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} placeholder={editing ? "Edit your message..." : `Message ${selectedUser.name}...`} maxLength={5000} rows={1}/>{showEmoji && <div className="emoji-picker">{EMOJIS.map(e => <button type="button" key={e} onClick={() => setMessageText(t => t + e)}>{e}</button>)}</div>}</div>
            <button type="button" className="composer-icon" onClick={() => setShowEmoji(v => !v)} title="Emoji"><Smile size={18}/></button>
            <button type="submit" className="message-send" disabled={sending || (!messageText.trim() && !files.length)}><Send size={17}/></button>
          </form>
          <div className="composer-hint">Enter to send · Shift + Enter for a new line · Files up to 10 MB</div>
        </>}
      </section>
    </section>

    {showNewMessage && <div className="modal-bg messages-new-modal-bg" onClick={() => setShowNewMessage(false)}><div className="messages-new-modal" onClick={e => e.stopPropagation()}><button className="close" type="button" onClick={() => setShowNewMessage(false)}><X size={18}/></button><span className="eyebrow">Start a conversation</span><h2>New message</h2><p className="modal-subtitle">Find a {user?.role === "candidate" ? "recruiter" : "candidate"} and start chatting.</p><div className="messages-search large-search"><Search size={16}/><input autoFocus value={search} onChange={e => { setSearch(e.target.value); searchPeople(e.target.value); }} placeholder="Search by name, company, role..."/></div><div className="people-results">{people.map(person => <button type="button" className="person-result" key={person._id} onClick={() => { setShowNewMessage(false); setSearch(""); loadThread(person); }}><Avatar user={person}/><span><strong>{person.name}</strong><small>{person.role === "recruiter" ? person.company || person.headline || "Recruiter" : person.headline || "Candidate"}</small></span></button>)}{!people.length && <div className="messages-empty">No matching people found.</div>}</div></div></div>}
    {previewImage && <div className="image-lightbox" onClick={() => setPreviewImage(null)}><button type="button" onClick={() => setPreviewImage(null)}><X size={22}/></button><img src={previewImage} alt="Attachment preview" onClick={e => e.stopPropagation()}/></div>}
  </main>;
}
