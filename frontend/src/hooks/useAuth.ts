export function useAuth() {
  const sessionId = localStorage.getItem("sessionId");
  const userName = localStorage.getItem("userName");
  return { sessionId, userName, isAuthenticated: !!sessionId };
}
