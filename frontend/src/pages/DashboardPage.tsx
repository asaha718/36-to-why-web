import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const TOTAL = 36;

export default function DashboardPage() {
  const navigate = useNavigate();
  const { sessionId, userName } = useAuth();
  const [answeredCount, setAnsweredCount] = useState(0);
  const [loadStatus, setLoadStatus] = useState<"loading" | "ok" | "error">("loading");

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
      </div>
    </main>
  );
}
