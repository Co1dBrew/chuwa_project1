/*
 * NotFoundPage is shown when the URL does not match any known route (a 404).
 */

import { Link } from "react-router-dom";
import { Button, Result } from "antd";

function NotFoundPage() {
  return (
    <Result
      status="404"
      title="404"
      subTitle="Sorry, the page you visited does not exist."
      extra={
        <Link to="/products">
          <Button type="primary">Back to products</Button>
        </Link>
      }
    />
  );
}

export default NotFoundPage;
