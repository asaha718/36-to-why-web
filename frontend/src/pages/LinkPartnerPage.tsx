import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";

interface PartnerLinkRow {
  id: string;
  inviteCode: string;
  linkedAt: string;
  partner: { id: string; name: string } | null;
}

export default function LinkPartnerPage() {
  const { sessionId } = useAuth();

  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const [codeInput, setCodeInput] = useState("");
  const [linkStatus, setLinkStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [linkError, setLinkError] = useState("");

  const [partners, setPartners] = useState<PartnerLinkRow[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  const headers = { "X-Session-Id": sessionId ?? "" };

  function fetchPartners() {
    if (!sessionId) return;
    fetch("/api/partner/links", { headers })
      .then((r) => r.json())
      .then((data: PartnerLinkRow[]) => setPartners(data))
      .catch(() => {});
  }

  useEffect(() => {
    fetchPartners();
  }, [sessionId]);

  useSocket(sessionId, (payload) => {
    setNotification(`${payload.partnerName} just linked with you!`);
    fetchPartners();
  });

  async function handleGenerateCode() {
    if (!sessionId) return;
    setGenerating(true);
    setCopied(false);
    try {
      const res = await fetch("/api/partner/invite", {
        method: "POST",
        headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setGeneratedCode(data.inviteCode);
    } catch {
      // no-op — keep UI functional
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy() {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleLinkPartner() {
    if (!sessionId || !codeInput.trim()) return;
    setLinkStatus("loading");
    setLinkError("");
    try {
      const res = await fetch("/api/partner/link", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: codeInput.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLinkError(data.error ?? "Could not link partner.");
        setLinkStatus("error");
        return;
      }
      setLinkStatus("success");
      setCodeInput("");
      fetchPartners();
    } catch {
      setLinkError("Could not reach the server.");
      setLinkStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-2xl">
        <Link to="/dashboard" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          ← Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mt-6 mb-1">Link with Your Partner</h1>
        <p className="text-gray-500 mb-8">Share your journey by connecting with someone special.</p>

        {notification && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium">{notification}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-green-500 hover:text-green-700 ml-4 text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Left: Share Your Code */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Share Your Code</h2>
            <p className="text-sm text-gray-500 mb-5">Generate an invite code to share with your partner.</p>

            {generatedCode ? (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Your Invite Code</p>
                <div className="bg-gray-100 rounded-xl px-4 py-5 text-center mb-3">
                  <span className="text-3xl font-mono font-bold text-gray-900 tracking-widest">
                    {generatedCode}
                  </span>
                </div>
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center justify-center gap-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  {copied ? "Copied!" : "Copy Code"}
                </button>
                <p className="text-xs text-gray-400 text-center mt-3">Share this code with your partner</p>
              </div>
            ) : (
              <button
                onClick={handleGenerateCode}
                disabled={generating}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mb-4"
              >
                {generating ? "Generating…" : "Generate Invite Code"}
              </button>
            )}

            {generatedCode && (
              <button
                onClick={handleGenerateCode}
                disabled={generating}
                className="w-full text-sm text-indigo-600 hover:text-indigo-700 font-medium py-1 transition-colors"
              >
                Generate new code
              </button>
            )}

            <p className="text-xs text-gray-400 mt-3">
              {partners.length} partner{partners.length !== 1 ? "s" : ""} linked
            </p>
          </div>

          {/* Right: Enter Partner's Code */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Enter Partner's Code</h2>
            <p className="text-sm text-gray-500 mb-5">Have a code? Enter it to connect.</p>

            <label className="block text-sm font-medium text-gray-700 mb-1">Partner's Code</label>
            <input
              value={codeInput}
              onChange={(e) => {
                setCodeInput(e.target.value);
                if (linkStatus !== "idle") {
                  setLinkStatus("idle");
                  setLinkError("");
                }
              }}
              placeholder="Enter code"
              maxLength={6}
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm uppercase font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-3"
            />

            <button
              onClick={handleLinkPartner}
              disabled={linkStatus === "loading" || !codeInput.trim()}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {linkStatus === "loading" ? "Linking…" : "Link Partner"}
            </button>

            {linkStatus === "success" && (
              <p className="mt-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-xl px-3.5 py-2.5">
                Partner linked successfully!
              </p>
            )}
            {linkStatus === "error" && (
              <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                {linkError}
              </p>
            )}
          </div>
        </div>

        {/* Linked partners list */}
        {partners.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Partners</h2>
            <ul className="space-y-3">
              {partners.map((p) => (
                <li key={p.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm flex-shrink-0">
                    {p.partner?.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.partner?.name ?? "Unknown"}</p>
                    <p className="text-xs text-gray-400">
                      Linked {new Date(p.linkedAt).toLocaleDateString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
