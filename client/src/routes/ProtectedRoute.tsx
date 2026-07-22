/*
 * ProtectedRoute guards pages that require the user to be signed in.
 *
 * We wrap a page with it like this:
 *   <ProtectedRoute><CartPage /></ProtectedRoute>
 *
 * If nobody is signed in, it sends the user to the sign-in page instead of
 * showing the protected page. Otherwise it simply shows the page (its children).
 */

import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import { selectIsAuthenticated } from "../features/auth/authSelectors";

interface ProtectedRouteProps {
  children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  if (!isAuthenticated) {
    // "replace" swaps the current history entry so the back button behaves well.
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
