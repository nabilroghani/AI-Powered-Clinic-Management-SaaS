import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../utils/api.js";

const rolePrompts = {
  doctor: [
    "Summary of my patients & appointments today",
    "Which of my patients has high risk diagnosis?",
    "What prescriptions did I issue recently?",
    "Explain in Urdu (اردو) care tips for dengue fever"
  ],
  patient: [
    "What medicines did my doctor prescribe for me?",
    "Explain my prescription in Urdu (🇵🇰 اردو)",
    "When is my appointment scheduled?"
  ],
  admin: [
    "Give me a live clinic summary report",
    "How many total patients & prescriptions in DB?",
    "How does SaaS Doctor & Receptionist onboarding work?"
  ],
  receptionist: [
    "Give me a live clinic summary report",
    "How does 1-click patient portal onboarding work?"
  ]
};

const AntigravityAiWidget = () => {
  const { user } = useAuth();
  const role = user?.role || "doctor";
  const quickPrompts = rolePrompts[role] || rolePrompts.doctor;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: `👋 Hi ${user?.name || "there"}! I am Antigravity AI, connected live to your MedPulse Clinic Database. Ask me about your patients, prescriptions, appointments, or clinical guidance!`
    }
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (textToSend) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) {
      return;
    }

    const userMsg = { sender: "user", text: query };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) {
      setInputQuery("");
    }
    setLoading(true);

    try {
      const response = await api.post("/prescriptions/ai-assistant", {
        prompt: query
      });

      const aiReply = response.data?.data?.reply || "Antigravity AI responded.";
      setMessages((prev) => [...prev, { sender: "ai", text: aiReply }]);
    } catch (error) {
      console.error("Antigravity AI Assistant error:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text:
            error.response?.data?.message ||
            "Antigravity AI is currently processing. Please verify your connection or try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 rounded-full bg-gradient-to-r from-indigo-600 via-teal-500 to-emerald-500 px-5 py-3 text-xs font-bold text-white shadow-2xl shadow-indigo-500/40 glow-indigo transition-all duration-300 hover:scale-105"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-sm">
            ⚡
          </span>
          <span>Antigravity AI Help</span>
        </button>
      )}

      {isOpen && (
        <div className="flex h-[520px] w-[380px] flex-col overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900/95 shadow-2xl backdrop-blur-2xl transition-all duration-300 sm:w-[420px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30 text-sm">
                ⚡
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">Antigravity AI</h3>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    DB Grounded
                  </span>
                </div>
                <p className="text-[10px] text-teal-400 font-medium uppercase tracking-wider mt-0.5">
                  Live Clinic RAG Intelligence
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Quick Suggestions */}
          <div className="border-b border-slate-800/80 bg-slate-950/60 p-3 overflow-x-auto">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Quick Suggestions:
            </p>
            <div className="flex gap-2">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  disabled={loading}
                  className="whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] font-medium text-slate-300 hover:border-indigo-500 hover:text-white transition-all disabled:opacity-50"
                >
                  ⚡ {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-none shadow-md"
                      : "border border-slate-800 bg-slate-950/80 text-slate-200 rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-xs text-teal-400">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
                  <span>Antigravity AI is thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 border-t border-slate-800 bg-slate-950/90 p-3"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask Antigravity AI anything..."
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-teal-500 px-4 py-2.5 text-xs font-bold text-white transition-all hover:brightness-110 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AntigravityAiWidget;
