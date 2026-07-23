import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import {
  selectIsAuthenticated,
  selectIsMerchant,
} from "../features/auth/authSelectors";

interface MerchantRouteProps {
  children: ReactNode;
}

function MerchantRoute({ children }: MerchantRouteProps) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isMerchant = useAppSelector(selectIsMerchant);

  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  if (!isMerchant) return <Navigate to="/products" replace />;

  return <>{children}</>;
}

export default MerchantRoute;
