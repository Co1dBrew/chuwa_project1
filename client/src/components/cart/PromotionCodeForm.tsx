// PromotionCodeForm lets the shopper apply or remove a discount code.
// Valid demo codes: SAVE10 (10% off), WELCOME5 ($5 off).

import { useEffect, useState } from "react";
import { Alert, Button, Input, Space } from "antd";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  applyPromotionCode,
  clearPromotion,
  clearPromotionError,
} from "../../features/cart/cartSlice";
import {
  selectPromotionCode,
  selectPromotionError,
} from "../../features/cart/cartSelectors";

function PromotionCodeForm() {
  const dispatch = useAppDispatch();

  const [text, setText] = useState("");

  const appliedCode = useAppSelector(selectPromotionCode);
  const promotionError = useAppSelector(selectPromotionError);

  // Clear any leftover error when the form opens so no stale message shows.
  useEffect(
    function () {
      dispatch(clearPromotionError());
    },
    [dispatch],
  );

  function handleApply() {
    dispatch(applyPromotionCode(text));
  }

  function handleRemove() {
    dispatch(clearPromotion());
    setText("");
  }

  const hasAppliedCode = appliedCode !== "";

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
        Promotion code
      </label>

      {hasAppliedCode ? (
        <Space direction="vertical" style={{ width: "100%" }}>
          <Alert
            type="success"
            showIcon
            message={'Code "' + appliedCode + '" applied.'}
          />
          <Button onClick={handleRemove}>Remove code</Button>
        </Space>
      ) : (
        <Space direction="vertical" style={{ width: "100%" }}>
          <Space.Compact style={{ width: "100%" }}>
            <Input
              placeholder="Enter code (try SAVE10)"
              value={text}
              onChange={function (event) {
                setText(event.target.value);
              }}
              onPressEnter={handleApply}
            />
            <Button type="primary" onClick={handleApply}>
              Apply
            </Button>
          </Space.Compact>

          {promotionError !== null ? (
            <Alert type="error" showIcon message={promotionError} />
          ) : null}
        </Space>
      )}
    </div>
  );
}

export default PromotionCodeForm;
