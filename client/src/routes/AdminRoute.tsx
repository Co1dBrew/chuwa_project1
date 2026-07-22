/*
 * AdminRoute guards pages that only administrators may use (creating, editing
 * and deleting products).
 *
 * The checks happen in order:
 *   1. Not signed in at all?        -> send to the sign-in page.
 *   2. Signed in but not an admin?  -> send back to the product list.
 *   3. Signed-in admin?             -> show the page.
 *
 * This is what stops a regular user from reaching an admin page by typing the
 * URL directly.
 */

import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import {
  selectIsAdmin,
  selectIsAuthenticated,
} from "../features/auth/authSelectors";

interface AdminRouteProps {
  children: ReactNode;
}

function AdminRoute({ children }: AdminRouteProps) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isAdmin = useAppSelector(selectIsAdmin);

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/products" replace />;
  }

  return <>{children}</>;
}

export default AdminRoute;
