import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import { LangProvider } from "./LangContext";
import Layout from "./Layout";
import RequireAuth from "./RequireAuth";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Forgot from "./pages/Forgot";
import ResetPassword from "./pages/ResetPassword";
import CropCities from "./pages/CropCities";
import CityDirectory from "./pages/CityDirectory";
import Submit from "./pages/Submit";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";

function Page({ children }) {
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Page><Home /></Page>} />
            <Route path="/login" element={<Page><Login /></Page>} />
            <Route path="/register" element={<Page><Register /></Page>} />
            <Route path="/forgot" element={<Page><Forgot /></Page>} />
            <Route path="/reset-password" element={<Page><ResetPassword /></Page>} />
            <Route path="/crops/:crop" element={<Page><RequireAuth><CropCities /></RequireAuth></Page>} />
            <Route path="/crops/:crop/cities/:city" element={<Page><RequireAuth><CityDirectory /></RequireAuth></Page>} />
            <Route path="/submit" element={<Page><RequireAuth><Submit /></RequireAuth></Page>} />
            <Route path="/profile" element={<Page><RequireAuth><Profile /></RequireAuth></Page>} />
            <Route path="/dashboard" element={<Page><RequireAuth><Dashboard /></RequireAuth></Page>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LangProvider>
  );
}
