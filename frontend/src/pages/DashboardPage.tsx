import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const TOTAL = 36;

export default function DashboardPage() {
  const navigate = useNavigate();
  const { sessionId, userName } = useAuth();
  const [answeredCount, setAnsweredCount] = useState(0);
  const [loadStatus, setLoadStatus] = useState<"loading" | "ok" | "error">("loading");
  const [partnerCount, setPartnerCount] = useState(0);

  useEffect(() => {
    fetch("/api/answers", {
      headers: { "X-Session-Id": sessionId ?? "" },
    })
      .then((r) => r.json())
      .then((data: unknown[]) => {
        setAnsweredCount(data.length);
        setLoadStatus("ok");
      })
      .catch(() => setLoadStatus("error"));
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    fetch("/api/partner/links", { headers: { "X-Session-Id": sessionId } })
      .then((r) => r.json())
      .then((data: unknown[]) => setPartnerCount(data.length))
      .catch(() => {});
  }, [sessionId]);

  const remaining = TOTAL - answeredCount;
  const progressPct = (answeredCount / TOTAL) * 100;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          Welcome back, {userName}
        </h1>
        <p className="text-gray-500 mb-10">Pick up where you left off.</p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Question Progress</h2>

          {loadStatus === "loading" && (
            <p className="text-gray-400 text-sm">Loading your progress…</p>
          )}

          {loadStatus === "error" && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
              Could not load progress. Is the backend running?
            </p>
          )}

          {loadStatus === "ok" && (
            <>
              <p className="text-4xl font-bold text-indigo-600 mb-1">{answeredCount} of {TOTAL}</p>
              <p className="text-sm text-gray-500 mb-5">questions answered</p>

              <div className="w-full bg-gray-100 rounded-full h-2.5 mb-5">
                <div
                  className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <p className="text-sm text-gray-500 mb-6">{remaining} questions remaining</p>

              <button
                onClick={() => navigate("/questions")}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
              >
                {answeredCount === 0 ? "Start Questions" : "Continue Questions"}
              </button>
            </>
          )}
        </div>

        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.1m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-800 mb-1">Connect with Your Partner</h2>
              <p className="text-sm text-gray-500 mb-4">
                Share your answers and discover each other's perspectives.
                {partnerCount > 0 && (
                  <span className="ml-1 text-indigo-600 font-medium">
                    {partnerCount} partner{partnerCount !== 1 ? "s" : ""} linked.
                  </span>
                )}
              </p>
              <button
                onClick={() => navigate("/partner")}
                className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors"
              >
                Link Partner
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
