const $ = id => document.getElementById(id);

// Fixed demo credentials requested by the site owner.
// IMPORTANT: This is front-end-only and can be bypassed by editing the page/source.
const ALLOWED_USERNAME = "ETUSER";
const ALLOWED_PASSWORD = "SIR.RIAZ";

// Optional interface sound effects generated in-browser (no external audio files).
let soundsEnabled = true;
let audioContext = null;
function playSound(kind = "click") {
  if (!soundsEnabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    audioContext ||= new AudioCtx();
    if (audioContext.state === "suspended") audioContext.resume();
    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const frequencies = { click: 520, success: 760, error: 220, logout: 420 };
    osc.type = "sine";
    osc.frequency.setValueAtTime(frequencies[kind] || 520, now);
    if (kind === "success") osc.frequency.exponentialRampToValueAtTime(1040, now + 0.12);
    if (kind === "error") osc.frequency.exponentialRampToValueAtTime(140, now + 0.16);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.11, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "success" ? 0.22 : 0.14));
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start(now);
    osc.stop(now + 0.24);
  } catch (_) {
    // Sound is optional; the page still works if audio is unavailable.
  }
}
function syncSoundButtons() {
  const label = soundsEnabled ? "🔊 Sound: On" : "🔇 Sound: Off";
  ["soundToggle", "soundToggleApp"].forEach(id => {
    const btn = $(id);
    if (btn) {
      btn.textContent = id === "soundToggleApp" && soundsEnabled ? "🔊 Sound" : label;
      btn.setAttribute("aria-pressed", String(soundsEnabled));
    }
  });
}
function toggleSounds() {
  soundsEnabled = !soundsEnabled;
  syncSoundButtons();
  if (soundsEnabled) playSound("success");
}
["soundToggle", "soundToggleApp"].forEach(id => {
  const btn = $(id);
  if (btn) btn.addEventListener("click", toggleSounds);
});
document.addEventListener("click", event => {
  if (event.target.closest("button") && !event.target.closest("#soundToggle, #soundToggleApp")) {
    playSound("click");
  }
});


function setMessage(message, success = false) {
  const el = $("authMessage");
  el.textContent = message;
  el.classList.toggle("success", success);
}
function openApp(username) {
  $("authScreen").classList.add("hidden");
  $("app").classList.remove("hidden");
  $("welcomeUser").textContent = "Hi, " + username;
  $("status").textContent = "";
  setTodayIfEmpty();
}
function closeApp() {
  playSound("logout");
  $("app").classList.add("hidden");
  $("authScreen").classList.remove("hidden");
  $("loginForm").reset();
  setMessage("");
}
function setTodayIfEmpty() {
  if (!$("date").value) {
    const d = new Date();
    $("date").value = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0,10);
  }
}

$("loginForm").addEventListener("submit", event => {
  event.preventDefault();
  const username = $("loginUsername").value.trim();
  const password = $("loginPassword").value;
  if (username === ALLOWED_USERNAME && password === ALLOWED_PASSWORD) {
    setMessage("");
    playSound("success");
    openApp(ALLOWED_USERNAME);
  } else {
    playSound("error");
    setMessage("Access denied. Only the authorized username and password are accepted.");
  }
});

$("logoutBtn").addEventListener("click", closeApp);

function calculateTotal() {
  const total = ["registration", "monthly", "balance"].reduce((sum, id) => {
    return sum + Math.max(0, Number($(id).value) || 0);
  }, 0);
  $("total").textContent = total.toLocaleString("en-PK", { maximumFractionDigits: 2 });
}
["registration", "monthly", "balance"].forEach(id => $(id).addEventListener("input", calculateTotal));
$("printBtn").addEventListener("click", () => window.print());
$("clearBtn").addEventListener("click", () => {
  if (!confirm("Clear all student and fee information?")) return;
  document.querySelectorAll("#app input, #app select").forEach(field => {
    if (["registration", "monthly", "balance"].includes(field.id)) field.value = "0";
    else field.value = "";
  });
  setTodayIfEmpty();
  calculateTotal();
  $("status").textContent = "Form cleared.";
});
$("cloudBtn").addEventListener("click", () => {
  $("status").textContent = "Cloud saving is not configured. Connect a secure backend first.";
});

const savedSession = localStorage.getItem(SESSION_KEY);
const savedUser = savedSession && getUsers()[savedSession.toLowerCase()];
if (savedUser) openApp(savedUser.username);
else showAuth(Object.keys(getUsers()).length ? "login" : "signup");
calculateTotal();
