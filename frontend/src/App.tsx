import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";

interface Question {
  id: number;
  set: number;
  text: string;
}

function HomePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    fetch("/api/questions")
      .then((r) => r.json())
      .then((data) => {
        setQuestions(data);
        setStatus("ok");
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-16 px-4">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">36 to Why</h1>
      <p className="text-gray-500 mb-10">Questions that bring people closer.</p>

      {status === "loading" && <p className="text-gray-400">Loading questions…</p>}
      {status === "error" && (
        <p className="text-red-500">Could not reach the backend. Is it running?</p>
      )}
      {status === "ok" && questions.length === 0 && (
        <p className="text-gray-400">No questions yet. Seed the database!</p>
      )}
      {status === "ok" && questions.length > 0 && (
        <ul className="w-full max-w-xl space-y-3">
          {questions.map((q) => (
            <li
              key={q.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-4"
            >
              <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">
                Set {q.set}
              </span>
              <p className="mt-1 text-gray-800">{q.text}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}
