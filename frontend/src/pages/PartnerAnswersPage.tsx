import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface PartnerAnswer {
  questionId: number;
  text: string;
  question: { id: number; set: number; text: string };
}

interface PartnerData {
  partnerName: string;
  partnerTotalAnswered: number;
  myTotalAnswered: number;
  lockedCount: number;
  answers: PartnerAnswer[];
}

const TOTAL = 36;

export default function PartnerAnswersPage() {
  const { partnerId } = useParams<{ partnerId: string }>();
  const { sessionId } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<PartnerData | null>(null);
  const [loadStatus, setLoadStatus] = useState<"loading" | "ok" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!sessionId || !partnerId) return;

    fetch(`/api/partner/${partnerId}/answers`, {
      headers: { "X-Session-Id": sessionId },
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) {
          setErrorMsg(body.error ?? "Something went wrong.");
          setLoadStatus("error");
          return;
        }
        setData(body as PartnerData);
        setLoadStatus("ok");
      })
      .catch(() => {
        setErrorMsg("Could not reach the server. Is the backend running?");
        setLoadStatus("error");
      });
  }, [sessionId, partnerId]);

  if (loadStatus === "loading") {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </main>
    );
  }

  if (loadStatus === "error") {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{errorMsg}</p>
          <Link to="/partner" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            ← Back to Partners
          </Link>
        </div>
      </main>
    );
  }

  const { partnerName, partnerTotalAnswered, myTotalAnswered, lockedCount, answers } = data!;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-2xl">
        <Link to="/partner" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          ← Back to Partners
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mt-6 mb-1">{partnerName}'s Answers</h1>
        <p className="text-gray-500 mb-8">
          You've unlocked{" "}
          <span className="font-semibold text-indigo-600">{answers.length}</span>{" "}
          of{" "}
          <span className="font-semibold text-indigo-600">{partnerTotalAnswered}</span>{" "}
          answers
        </p>

        {/* Answer cards */}
        {answers.length === 0 && lockedCount > 0 && (
          <p className="text-gray-400 text-sm mb-6">No answers unlocked yet.</p>
        )}

        {answers.length > 0 && (
          <ul className="space-y-3 mb-8">
            {answers.map((a) => (
              <li
                key={a.questionId}
                className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-4"
              >
                <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">
                  Set {a.question.set}
                </span>
                <p className="mt-1 text-gray-800 font-medium">{a.question.text}</p>
                <p className="mt-2 text-gray-600 text-sm leading-relaxed">{a.text}</p>
              </li>
            ))}
          </ul>
        )}

        {/* Bottom CTA */}
        {lockedCount > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
            <p className="text-gray-600 mb-4">
              Answer{" "}
              <span className="font-semibold text-indigo-600">{lockedCount}</span>{" "}
              more question{lockedCount !== 1 ? "s" : ""} to unlock more of {partnerName}'s answers
            </p>
            <button
              onClick={() => navigate("/questions")}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              Continue Questions →
            </button>
          </div>
        )}

        {lockedCount === 0 && partnerTotalAnswered === 0 && (
          <p className="text-center text-gray-400 mt-4">
            {partnerName} hasn't answered any questions yet.
          </p>
        )}

        {lockedCount === 0 && partnerTotalAnswered > 0 && myTotalAnswered < TOTAL && (
          <div className="text-center mt-6">
            <p className="text-gray-500 mb-3">
              You've seen all of {partnerName}'s answers so far. Keep answering to stay in sync.
            </p>
            <Link
              to="/questions"
              className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
            >
              Continue Questions →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
