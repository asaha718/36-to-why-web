import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function NavBar() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string | null>(
    () => localStorage.getItem("userName")
  );

  useEffect(() => {
    function syncAuth() {
      setUserName(localStorage.getItem("userName"));
    }
    window.addEventListener("authChange", syncAuth);
    return () => window.removeEventListener("authChange", syncAuth);
  }, []);

  function handleSignOut() {
    localStorage.removeItem("sessionId");
    localStorage.removeItem("userName");
    window.dispatchEvent(new Event("authChange"));
    navigate("/login");
  }

  return (
    <nav className="w-full bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link
        to="/"
        className="text-xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
      >
        36
      </Link>

      <div className="flex items-center gap-4">
        {userName ? (
          <>
            <span className="text-sm text-gray-600">
              Welcome, <span className="font-semibold text-gray-900">{userName}</span>
            </span>
            <button
              onClick={handleSignOut}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              Sign out
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
          >
            Log in
          </Link>
        )}
      </div>
    </nav>
  );
}
