import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router";
import WelcomePage from "./pages/WelcomePage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import RootLayout from "./layouts/RootLayout";
import DashboardPage from "./pages/DashboardPage";
import TransactionsPage from "./pages/TransactionsPage";
import NewTransaction from "./pages/NewTransaction";
import CategoriesPage from "./pages/CategoriesPage";
import NotFoundPage from "./pages/NotFoundPage";
import EditTransactionPage from "./pages/EditTransactionPage";

export const API_BASE = import.meta.env.VITE_API_BASE_URL;

function App() {
  return (
    <div className="app-root">
      <BrowserRouter>
        <Routes>
          <Route index element={<WelcomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="app" element={<RootLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="transactions/new" element={<NewTransaction />} />
              <Route path="transactions/:id/edit" element={<EditTransactionPage />} />
              <Route path="categories" element={<CategoriesPage />} />
            </Route>
          </Route>
          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
