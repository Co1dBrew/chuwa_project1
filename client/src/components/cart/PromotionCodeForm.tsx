/*
 * PromotionCodeForm lets the shopper apply a promotion (discount) code.
 *
 * It reads the currently applied code and any error message from the store, and
 * dispatches actions to apply or remove a code. Valid demo codes are:
 *   - SAVE10   (10% off)
 *   - WELCOME5 ($5 off)
 *
 * When a valid code is applied we show a success message; when an invalid code
 * is entered we show the error the slice produced.
 */

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

  // Local state: what the user is currently typing.
  const [text, setText] = useState("");

  // From the store: the applied code and any error.
  const appliedCode = useAppSelector(selectPromotionCode);
  const promotionError = useAppSelector(selectPromotionError);

  // When this form opens, clear any leftover "invalid code" error from before,
  // so the user does not see a stale error they did not just cause.
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

  // If a code is already applied, show the success state with a remove button.
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

          {/* Show the error only when there is one. */}
          {promotionError !== null ? (
            <Alert type="error" showIcon message={promotionError} />
          ) : null}
        </Space>
      )}
    </div>
  );
}

export default PromotionCodeForm;
