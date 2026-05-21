import { useState, ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getZodiacSign, ZODIAC_EMOJIS } from "../utils/zodiac";

type RelationshipType = "FRIEND" | "LOVER";

interface FormState {
  name: string;
  username: string;
  email: string;
  password: string;
  dateOfBirth: string;
  relationshipType: RelationshipType;
}

const INITIAL: FormState = {
  name: "",
  username: "",
  email: "",
  password: "",
  dateOfBirth: "",
  relationshipType: "FRIEND",
};

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [zodiac, setZodiac] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "dateOfBirth" && value) {
      const date = new Date(value + "T00:00:00");
      if (!isNaN(date.getTime())) {
        setZodiac(getZodiacSign(date));
      }
    }
  }

  function setRelationship(type: RelationshipType) {
    setForm((prev) => ({ ...prev, relationshipType: type }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const sessionId = localStorage.getItem("sessionId") ?? undefined;

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          zodiacSign: zodiac,
          sessionId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }

      localStorage.setItem("sessionId", data.sessionId);
      localStorage.setItem("userName", data.user.name);
      window.dispatchEvent(new Event("authChange"));
      setStatus("success");
    } catch {
      setErrorMsg("Could not reach the server. Is the backend running?");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">
            {zodiac ? ZODIAC_EMOJIS[zodiac] ?? "✨" : "✨"}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {form.name}!</h2>
          <p className="text-gray-500 mb-1">Your account has been created.</p>
          {zodiac && (
            <p className="text-indigo-600 font-medium mb-6">
              {zodiac} {ZODIAC_EMOJIS[zodiac]}
            </p>
          )}
          <button
            onClick={() => navigate("/")}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            Start exploring
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
        <p className="text-gray-500 text-sm mb-6">
          Already have one?{" "}
          <Link to="/login" className="text-indigo-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="Your full name"
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              placeholder="@handle"
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 8 characters"
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of birth</label>
            <input
              name="dateOfBirth"
              type="date"
              required
              value={form.dateOfBirth}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {zodiac && (
              <p className="mt-1.5 text-sm text-indigo-600 font-medium">
                {ZODIAC_EMOJIS[zodiac]} {zodiac}
              </p>
            )}
          </div>

          {/* Relationship type toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Creating With
            </label>
            <div className="flex rounded-xl border border-gray-300 overflow-hidden">
              <button
                type="button"
                onClick={() => setRelationship("FRIEND")}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  form.relationshipType === "FRIEND"
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                Friend
              </button>
              <button
                type="button"
                onClick={() => setRelationship("LOVER")}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors border-l border-gray-300 ${
                  form.relationshipType === "LOVER"
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                Lover
              </button>
            </div>
          </div>

          {status === "error" && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {status === "loading" ? "Creating account…" : "Create account"}
          </button>
        </form>
      </div>
    </main>
  );
}
