// The footer shown at the bottom of every page.

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{
        textAlign: "center",
        padding: "16px 24px",
        color: "#888",
        borderTop: "1px solid #f0f0f0",
        backgroundColor: "#ffffff",
      }}
    >
      Product Management System &copy; {currentYear}
    </footer>
  );
}

export default Footer;
