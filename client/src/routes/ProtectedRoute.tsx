// Guards pages that require sign-in, redirecting to /signin when not authenticated.

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
