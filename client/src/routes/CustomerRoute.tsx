// Guards the customer-only cart page: redirects to sign-in if not logged in,
// or to /products if the user is an admin (admins have no cart).

import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import {
  selectIsAdmin,
  selectIsAuthenticated,
} from "../features/auth/authSelectors";

interface CustomerRouteProps {
  children: ReactNode;
}

function CustomerRoute({ children }: CustomerRouteProps) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isAdmin = useAppSelector(selectIsAdmin);

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  if (isAdmin) {
    return <Navigate to="/products" replace />;
  }

  return <>{children}</>;
}

export default CustomerRoute;
