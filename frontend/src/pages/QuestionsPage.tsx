import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface Question {
  id: number;
  set: number;
  text: string;
}

interface AnswerRecord {
  questionId: number;
  text: string;
  submittedAt: string | null;
}

const TOTAL = 36;

export default function QuestionsPage() {
  const { sessionId } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answersMap, setAnswersMap] = useState<Map<number, string>>(new Map());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [loadStatus, setLoadStatus] = useState<"loading" | "ok" | "error">("loading");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const headers = { "X-Session-Id": sessionId ?? "" };

    Promise.all([
      fetch("/api/questions").then((r) => r.json()),
      fetch("/api/answers", { headers }).then((r) => r.json()),
    ])
      .then(([qs, ans]: [Question[], AnswerRecord[]]) => {
        setQuestions(qs);

        const map = new Map<number, string>();
        ans.forEach((a) => map.set(a.questionId, a.text));
        setAnswersMap(map);

        const firstUnanswered = qs.findIndex((q) => !map.has(q.id));
        const startIndex = firstUnanswered === -1 ? 0 : firstUnanswered;
        setCurrentIndex(startIndex);
        setDraft(map.get(qs[startIndex]?.id) ?? "");

        setLoadStatus("ok");
      })
      .catch(() => setLoadStatus("error"));
  }, [sessionId]);

  function goTo(index: number) {
    const next = questions[index];
    if (!next) return;
    setCurrentIndex(index);
    setDraft(answersMap.get(next.id) ?? "");
    setSaveStatus("idle");
  }

  async function handleSave() {
    if (!questions[currentIndex]) return;
    const question = questions[currentIndex];
    setSaveStatus("saving");

    try {
      const res = await fetch("/api/answers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-Id": sessionId ?? "",
        },
        body: JSON.stringify({ questionId: question.id, text: draft }),
      });

      if (!res.ok) throw new Error();

      setAnswersMap((prev) => new Map(prev).set(question.id, draft));
      setSaveStatus("saved");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
    }
  }

  if (loadStatus === "loading") {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading questions…</p>
      </main>
    );
  }

  if (loadStatus === "error") {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <p className="text-red-500">Could not load questions. Is the backend running?</p>
      </main>
    );
  }

  const question = questions[currentIndex];
  const progressPct = ((currentIndex + 1) / TOTAL) * 100;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-xl">
        <Link to="/dashboard" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          ← Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mt-6 mb-3">
          <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            {currentIndex + 1} / {TOTAL}
          </span>
        </div>

        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-8">
          <div
            className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-6 py-6 mb-5">
          <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">
            Set {question.set}
          </span>
          <p className="mt-2 text-xl font-medium text-gray-900 leading-relaxed">{question.text}</p>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-1">Your Answer</label>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={5}
          placeholder="Take your time… share what's on your heart"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none mb-3"
        />

        <button
          onClick={handleSave}
          disabled={saveStatus === "saving" || !draft.trim()}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saveStatus === "saving" ? "Saving…" : "Save Answer"}
        </button>

        {saveStatus === "saved" && (
          <p className="text-sm text-green-600 text-center mt-2">Saved!</p>
        )}
        {saveStatus === "error" && (
          <p className="text-sm text-red-600 text-center mt-2">Could not save. Try again.</p>
        )}

        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => goTo(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="px-5 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>
          <button
            onClick={() => goTo(currentIndex + 1)}
            disabled={currentIndex === TOTAL - 1}
            className="px-5 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      </div>
    </main>
  );
}
