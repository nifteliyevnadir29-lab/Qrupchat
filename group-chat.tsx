import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "qrupchat_v2";

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { groups: {}, messages: {} };
  } catch { return { groups: {}, messages: {} }; }
}
function saveData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

const EMOJIS = [
  "😀","😂","🥰","😎","😭","😡","🤔","😴","🥳","😇",
  "👍","👎","❤️","🔥","🎉","✅","💯","🙏","👏","💪",
  "😮","😱","🤣","😜","🫡","🤩","😏","🥺","😤","🤗",
  "🍕","🍔","☕","🎵","⚽","🎮","🚀","🌙","⭐","🌈",
  "💀","👻","🤖","🦋","🐶","🐱","🌺","🍀","💎","🎁",
];

const COLORS = ["#6C63FF","#FF6584","#43C6AC","#F7971E","#ee0979","#1FA2FF","#A64DB6","#E96C5A","#56CCF2","#2ecc71"];
function getColor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}
function getInitial(str) { return str ? str[0].toUpperCase() : "?"; }

function Avatar({ name, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: getColor(name),
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 700, color: "#fff", flexShrink: 0,
    }}>{getInitial(name)}</div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [error, setError] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (screen !== "chat" || !currentGroup) return;
    const interval = setInterval(() => {
      const data = loadData();
      const gk = btoa(currentGroup);
      setMessages(data.messages[gk] || []);
      setMembers(data.groups[gk]?.members || []);
    }, 1500);
    return () => clearInterval(interval);
  }, [screen, currentGroup]);

  function handleJoin() {
    setError("");
    if (!name.trim()) return setError("Ad daxil edin");
    if (!password.trim()) return setError("Parol daxil edin");
    const data = loadData();
    const gk = btoa(password.trim());
    if (!data.groups[gk]) data.groups[gk] = { members: [], createdAt: Date.now() };
    if (!data.messages[gk]) data.messages[gk] = [];
    const already = data.groups[gk].members.find(m => m.name === name.trim());
    if (!already) {
      data.groups[gk].members.push({ name: name.trim(), joinedAt: Date.now() });
      data.messages[gk].push({
        id: Date.now(), sender: "sistem", type: "system",
        text: `${name.trim()} qrupa qoşuldu 👋`,
        time: new Date().toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" }),
      });
    }
    saveData(data);
    setCurrentUser(name.trim());
    setCurrentGroup(password.trim());
    setMessages(data.messages[gk]);
    setMembers(data.groups[gk].members);
    setScreen("chat");
  }

  function sendMessage(text, image) {
    const data = loadData();
    const gk = btoa(currentGroup);
    const msg = {
      id: Date.now(), sender: currentUser,
      type: image ? "image" : "text",
      text: text || "",
      image: image || null,
      time: new Date().toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" }),
    };
    data.messages[gk].push(msg);
    saveData(data);
    setMessages([...data.messages[gk]]);
  }

  function handleSend() {
    if (imagePreview) {
      sendMessage(newMsg, imagePreview);
      setImagePreview(null);
      setNewMsg("");
      setShowEmoji(false);
      return;
    }
    if (!newMsg.trim()) return;
    sendMessage(newMsg.trim(), null);
    setNewMsg("");
    setShowEmoji(false);
    inputRef.current?.focus();
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleLeave() {
    const data = loadData();
    const gk = btoa(currentGroup);
    data.groups[gk].members = data.groups[gk].members.filter(m => m.name !== currentUser);
    data.messages[gk].push({
      id: Date.now(), sender: "sistem", type: "system",
      text: `${currentUser} qrupdan çıxdı`,
      time: new Date().toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" }),
    });
    saveData(data);
    setScreen("home"); setName(""); setPassword("");
    setCurrentUser(null); setCurrentGroup(null);
    setShowMembers(false); setImagePreview(null);
  }

  // ── HOME SCREEN ──
  if (screen === "home") return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0d1117 0%, #161b22 60%, #0d2137 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Segoe UI', system-ui, sans-serif"
    }}>
      <div style={{
        background: "rgba(255,255,255,0.04)", backdropFilter: "blur(24px)",
        borderRadius: 28, padding: "44px 38px", width: 340,
        border: "1px solid rgba(255,255,255,0.09)",
        boxShadow: "0 30px 60px rgba(0,0,0,0.6)"
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 52, marginBottom: 6 }}>💬</div>
          <h1 style={{ color: "#fff", margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>QrupChat</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", margin: "8px 0 0", fontSize: 13 }}>
            Eyni parolu bilənlər eyni qrupda olur
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: "Adınız", val: name, set: setName, ph: "Məsələn: Əli", type: "text" },
            { label: "Qrup Parolu", val: password, set: setPassword, ph: "Gizli parol", type: "password" },
          ].map(({ label, val, set, ph, type }) => (
            <div key={label}>
              <label style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, display: "block", marginBottom: 5, fontWeight: 600 }}>
                {label}
              </label>
              <input
                value={val} onChange={e => set(e.target.value)} placeholder={ph} type={type}
                onKeyDown={e => e.key === "Enter" && handleJoin()}
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)",
                  color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box",
                  transition: "border 0.2s"
                }}
                onFocus={e => e.target.style.border = "1px solid rgba(108,99,255,0.6)"}
                onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.1)"}
              />
            </div>
          ))}
          {error && <p style={{ color: "#FF6584", fontSize: 13, margin: 0, textAlign: "center" }}>{error}</p>}
          <button onClick={handleJoin} style={{
            padding: "13px", borderRadius: 14, border: "none",
            background: "linear-gradient(135deg, #6C63FF 0%, #43C6AC 100%)",
            color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 4,
            boxShadow: "0 4px 20px rgba(108,99,255,0.4)", transition: "transform 0.1s"
          }}
            onMouseDown={e => e.target.style.transform = "scale(0.97)"}
            onMouseUp={e => e.target.style.transform = "scale(1)"}
          >
            Qrupa Qoşul →
          </button>
        </div>
        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, textAlign: "center", marginTop: 20, marginBottom: 0, lineHeight: 1.6 }}>
          Parol = Qrup açarı. Eyni parol → eyni qrup.
        </p>
      </div>
    </div>
  );

  // ── CHAT SCREEN ──
  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: "#0d1117", fontFamily: "'Segoe UI', system-ui, sans-serif",
      position: "relative"
    }}>

      {/* HEADER */}
      <div style={{
        background: "rgba(22,27,34,0.97)", borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "10px 16px", display: "flex", alignItems: "center", gap: 12,
        backdropFilter: "blur(10px)", zIndex: 10
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: "50%",
          background: "linear-gradient(135deg, #6C63FF, #43C6AC)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
        }}>🔐</div>
        <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setShowMembers(!showMembers)}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Gizli Qrup</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 1 }}>
            {members.length} üzv · tap üzvlərə bax
          </div>
        </div>
        {/* member avatars */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {members.slice(0, 4).map((m, i) => (
            <div key={i} title={m.name} style={{ marginLeft: i > 0 ? -10 : 0, border: "2px solid #0d1117", borderRadius: "50%" }}>
              <Avatar name={m.name} size={28} />
            </div>
          ))}
          {members.length > 4 && (
            <div style={{
              marginLeft: -10, width: 28, height: 28, borderRadius: "50%",
              background: "#333", border: "2px solid #0d1117",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, color: "#fff"
            }}>+{members.length - 4}</div>
          )}
        </div>
        <button onClick={handleLeave} style={{
          background: "rgba(255,80,80,0.12)", border: "1px solid rgba(255,80,80,0.25)",
          color: "#ff6b6b", padding: "6px 12px", borderRadius: 8,
          fontSize: 12, cursor: "pointer", fontWeight: 600, flexShrink: 0
        }}>Çıx</button>
      </div>

      {/* MEMBERS PANEL */}
      {showMembers && (
        <div style={{
          position: "absolute", top: 63, left: 0, right: 0, zIndex: 20,
          background: "rgba(22,27,34,0.98)", borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "12px 16px", backdropFilter: "blur(20px)"
        }}>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
            Üzvlər ({members.length})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {members.map((m, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 7,
                background: "rgba(255,255,255,0.05)", borderRadius: 20,
                padding: "4px 12px 4px 4px"
              }}>
                <Avatar name={m.name} size={24} />
                <span style={{ color: m.name === currentUser ? "#43C6AC" : "#fff", fontSize: 13, fontWeight: 600 }}>
                  {m.name}{m.name === currentUser ? " (sən)" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MESSAGES */}
      <div
        style={{ flex: 1, overflowY: "auto", padding: "16px 12px", display: "flex", flexDirection: "column", gap: 10 }}
        onClick={() => { setShowEmoji(false); setShowMembers(false); }}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 13, marginTop: 40 }}>
            Hələ mesaj yoxdur. Birinci sən yaz! 👋
          </div>
        )}
        {messages.map((msg) => {
          if (msg.type === "system") return (
            <div key={msg.id} style={{ textAlign: "center" }}>
              <span style={{
                background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)",
                fontSize: 12, padding: "3px 14px", borderRadius: 20
              }}>{msg.text}</span>
            </div>
          );
          const isMe = msg.sender === currentUser;
          return (
            <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-end" }}>
              {!isMe && <Avatar name={msg.sender} size={32} />}
              <div style={{ maxWidth: "72%" }}>
                {!isMe && (
                  <div style={{ color: getColor(msg.sender), fontSize: 11, marginBottom: 3, fontWeight: 700, paddingLeft: 2 }}>
                    {msg.sender}
                  </div>
                )}
                <div style={{
                  background: isMe ? "linear-gradient(135deg,#6C63FF,#43C6AC)" : "rgba(255,255,255,0.07)",
                  color: "#fff", padding: msg.type === "image" ? "4px" : "9px 13px",
                  borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  fontSize: 15, lineHeight: 1.5, wordBreak: "break-word",
                  boxShadow: isMe ? "0 2px 12px rgba(108,99,255,0.3)" : "none"
                }}>
                  {msg.type === "image" && (
                    <img src={msg.image} alt="img" style={{
                      maxWidth: 220, maxHeight: 220, borderRadius: 14,
                      display: "block", objectFit: "cover"
                    }} />
                  )}
                  {msg.text && <div style={{ marginTop: msg.type === "image" ? 4 : 0, padding: msg.type === "image" ? "0 6px 4px" : 0 }}>{msg.text}</div>}
                </div>
                <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, marginTop: 3, textAlign: isMe ? "right" : "left" }}>
                  {msg.time}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* IMAGE PREVIEW */}
      {imagePreview && (
        <div style={{
          background: "rgba(22,27,34,0.97)", borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "10px 16px", display: "flex", alignItems: "center", gap: 12
        }}>
          <img src={imagePreview} alt="preview" style={{ height: 60, borderRadius: 8, objectFit: "cover" }} />
          <div style={{ flex: 1, color: "rgba(255,255,255,0.5)", fontSize: 13 }}>Şəkil göndəriləcək</div>
          <button onClick={() => setImagePreview(null)} style={{
            background: "rgba(255,80,80,0.15)", border: "none", color: "#ff6b6b",
            borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 13
          }}>✕ Sil</button>
        </div>
      )}

      {/* EMOJI PICKER */}
      {showEmoji && (
        <div style={{
          background: "rgba(22,27,34,0.99)", borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "12px", display: "flex", flexWrap: "wrap", gap: 4,
          maxHeight: 180, overflowY: "auto"
        }}>
          {EMOJIS.map(em => (
            <button key={em} onClick={() => { setNewMsg(p => p + em); inputRef.current?.focus(); }}
              style={{
                background: "none", border: "none", fontSize: 24, cursor: "pointer",
                padding: "4px 6px", borderRadius: 8, transition: "background 0.1s",
                lineHeight: 1
              }}
              onMouseOver={e => e.target.style.background = "rgba(255,255,255,0.1)"}
              onMouseOut={e => e.target.style.background = "none"}
            >{em}</button>
          ))}
        </div>
      )}

      {/* INPUT BAR */}
      <div style={{
        padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(22,27,34,0.97)", display: "flex", alignItems: "center", gap: 8
      }}>
        {/* Camera */}
        <button onClick={() => cameraInputRef.current?.click()} title="Kamera"
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.45)", fontSize: 22, cursor: "pointer", padding: "6px", borderRadius: 8, flexShrink: 0, transition: "color 0.15s" }}
          onMouseOver={e => e.target.style.color = "#43C6AC"}
          onMouseOut={e => e.target.style.color = "rgba(255,255,255,0.45)"}
        >📷</button>
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFile} />

        {/* Gallery */}
        <button onClick={() => fileInputRef.current?.click()} title="Şəkil"
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.45)", fontSize: 22, cursor: "pointer", padding: "6px", borderRadius: 8, flexShrink: 0, transition: "color 0.15s" }}
          onMouseOver={e => e.target.style.color = "#6C63FF"}
          onMouseOut={e => e.target.style.color = "rgba(255,255,255,0.45)"}
        >🖼️</button>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />

        {/* Text input */}
        <input
          ref={inputRef}
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="Mesaj yazın..."
          style={{
            flex: 1, padding: "11px 14px", borderRadius: 22,
            border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.06)",
            color: "#fff", fontSize: 15, outline: "none"
          }}
          onFocus={e => e.target.style.border = "1px solid rgba(108,99,255,0.5)"}
          onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.09)"}
        />

        {/* Emoji toggle */}
        <button onClick={() => setShowEmoji(p => !p)} title="Emoji"
          style={{
            background: showEmoji ? "rgba(108,99,255,0.2)" : "none",
            border: "none", color: showEmoji ? "#6C63FF" : "rgba(255,255,255,0.45)",
            fontSize: 22, cursor: "pointer", padding: "6px", borderRadius: 8, flexShrink: 0, transition: "all 0.15s"
          }}
        >😊</button>

        {/* Send */}
        <button onClick={handleSend} style={{
          width: 42, height: 42, borderRadius: "50%", border: "none",
          background: (newMsg.trim() || imagePreview)
            ? "linear-gradient(135deg,#6C63FF,#43C6AC)"
            : "rgba(255,255,255,0.08)",
          color: "#fff", fontSize: 18, cursor: "pointer", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.2s, transform 0.1s",
          boxShadow: (newMsg.trim() || imagePreview) ? "0 2px 12px rgba(108,99,255,0.4)" : "none"
        }}
          onMouseDown={e => e.currentTarget.style.transform = "scale(0.9)"}
          onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
        >➤</button>
      </div>
    </div>
  );
}
