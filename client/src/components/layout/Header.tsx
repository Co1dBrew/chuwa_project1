/*
 * The top navigation bar, shown on every page.
 *
 * It adapts to who is looking at it:
 *   - The cart icon shows a live badge with the number of items in the cart.
 *   - If nobody is signed in, it shows "Sign in" and "Sign up" buttons.
 *   - If a user is signed in, it shows their name and a menu with "Update
 *     password" and "Logout". Administrators also get an "Admin" tag.
 *
 * All of these values come from the Redux store through selectors, so the header
 * always matches the rest of the app.
 */

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

  // Read the values we need out of the Redux store.
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isAdmin = useAppSelector(selectIsAdmin);
  const currentUser = useAppSelector(selectCurrentUser);
  const cartItemCount = useAppSelector(selectCartItemCount);

  // Sign the user out, then send them back to the products page.
  function handleLogout() {
    dispatch(logout());
    navigate("/products");
  }

  // The choices shown in the signed-in user's dropdown menu.
  const userMenuItems: MenuProps["items"] = [
    { key: "update-password", label: "Update password" },
    { key: "logout", label: "Logout" },
  ];

  // Runs when the user clicks a choice in the dropdown menu.
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
      {/* The site name, which links back to the product list. */}
      <Link
        to="/products"
        style={{ fontSize: 18, fontWeight: 600, color: "#1677ff" }}
      >
        Product Manager
      </Link>

      <Space size="middle">
        {/* Cart icon with a badge. The badge hides itself when the count is 0. */}
        <Link to="/cart" aria-label="Cart">
          <Badge count={cartItemCount} size="small">
            <ShoppingCartOutlined style={{ fontSize: 22, color: "#333" }} />
          </Badge>
        </Link>

        {isAuthenticated ? (
          // Signed in: show the user's name and a dropdown menu.
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
          // Signed out: show sign in and sign up buttons.
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
