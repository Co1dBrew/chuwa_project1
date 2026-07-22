// The top navigation bar, shown on every page. Adapts to auth and cart state.

import { Link, useNavigate } from "react-router-dom";
import { Badge, Button, Dropdown, Space, Tag } from "antd";
import type { MenuProps } from "antd";
import { ShoppingCartOutlined, UserOutlined } from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectCurrentUser,
  selectIsAdmin,
  selectIsAuthenticated,
} from "../../features/auth/authSelectors";
import { selectCartItemCount } from "../../features/cart/cartSelectors";
import { logout } from "../../features/auth/authSlice";

function Header() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isAdmin = useAppSelector(selectIsAdmin);
  const currentUser = useAppSelector(selectCurrentUser);
  const cartItemCount = useAppSelector(selectCartItemCount);

  function handleLogout() {
    dispatch(logout());
    navigate("/products");
  }

  const userMenuItems: MenuProps["items"] = [
    { key: "update-password", label: "Update password" },
    { key: "logout", label: "Logout" },
  ];

  function handleUserMenuClick(info: { key: string }) {
    if (info.key === "logout") {
      handleLogout();
    } else if (info.key === "update-password") {
      navigate("/update-password");
    }
  }

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        height: 64,
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #f0f0f0",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <Link
        to="/products"
        style={{ fontSize: 18, fontWeight: 600, color: "#1677ff" }}
      >
        Product Manager
      </Link>

      <Space size="middle">
        <Link to="/cart" aria-label="Cart">
          <Badge count={cartItemCount} size="small">
            <ShoppingCartOutlined style={{ fontSize: 22, color: "#333" }} />
          </Badge>
        </Link>

        {isAuthenticated ? (
          <Dropdown
            menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
            placement="bottomRight"
          >
            <Button icon={<UserOutlined />}>
              {currentUser !== null ? currentUser.username : "Account"}
              {isAdmin ? (
                <Tag color="gold" style={{ marginLeft: 8 }}>
                  Admin
                </Tag>
              ) : null}
            </Button>
          </Dropdown>
        ) : (
          <Space size="small">
            <Link to="/signin">
              <Button>Sign in</Button>
            </Link>
            <Link to="/signup">
              <Button type="primary">Sign up</Button>
            </Link>
          </Space>
        )}
      </Space>
    </header>
  );
}

export default Header;
