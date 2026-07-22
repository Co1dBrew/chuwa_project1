/*
 * AppRoutes defines every URL in the application and which page each one shows.
 *
 * All pages sit inside MainLayout (the shared header/footer frame), which is set
 * up as a "layout route": the parent <Route element={<MainLayout />}> renders
 * the frame, and each child page appears inside its <Outlet />.
 *
 * Guards:
 *   - <ProtectedRoute> wraps pages that require sign-in (cart, update password).
 *   - <AdminRoute> wraps admin-only pages (create and edit product).
 */

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
        {/* The home URL "/" just redirects to the product list. */}
        <Route index element={<Navigate to="/products" replace />} />

        {/* Public product pages. */}
        <Route path="products" element={<ProductListPage />} />

        {/*
         * Create must be listed as its own route. React Router is smart enough
         * to match the fixed word "new" before treating it as a product id.
         */}
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

        {/* Cart requires the user to be signed in. */}
        <Route
          path="cart"
          element={
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          }
        />

        {/* Authentication pages. */}
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

        {/* Anything else shows the 404 page. */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
