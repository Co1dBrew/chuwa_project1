// App route definitions. All pages render inside MainLayout via its <Outlet />.

import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";
import ProductListPage from "../pages/ProductListPage";
import ProductDetailPage from "../pages/ProductDetailPage";
import ProductFormPage from "../pages/ProductFormPage";
import CartPage from "../pages/CartPage";
import SignInPage from "../pages/SignInPage";
import SignUpPage from "../pages/SignUpPage";
import UpdatePasswordPage from "../pages/UpdatePasswordPage";
import NotFoundPage from "../pages/NotFoundPage";

function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Navigate to="/products" replace />} />

        <Route path="products" element={<ProductListPage />} />

        {/* Must precede products/:productId so "new" matches before the id param. */}
        <Route
          path="products/new"
          element={
            <AdminRoute>
              <ProductFormPage />
            </AdminRoute>
          }
        />

        <Route path="products/:productId" element={<ProductDetailPage />} />

        <Route
          path="products/:productId/edit"
          element={
            <AdminRoute>
              <ProductFormPage />
            </AdminRoute>
          }
        />

        <Route
          path="cart"
          element={
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          }
        />

        <Route path="signin" element={<SignInPage />} />
        <Route path="signup" element={<SignUpPage />} />
        <Route
          path="update-password"
          element={
            <ProtectedRoute>
              <UpdatePasswordPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
