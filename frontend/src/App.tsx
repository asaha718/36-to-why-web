import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import RequireAuth from "./components/RequireAuth";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import QuestionsPage from "./pages/QuestionsPage";
import LinkPartnerPage from "./pages/LinkPartnerPage";
import PartnerAnswersPage from "./pages/PartnerAnswersPage";

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
        <Route path="/questions" element={<RequireAuth><QuestionsPage /></RequireAuth>} />
        <Route path="/partner" element={<RequireAuth><LinkPartnerPage /></RequireAuth>} />
        <Route path="/partner/:partnerId" element={<RequireAuth><PartnerAnswersPage /></RequireAuth>} />
      </Routes>
    </>
  );
}
