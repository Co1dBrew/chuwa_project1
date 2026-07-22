/*
 * Typed versions of the two Redux hooks we use everywhere.
 *
 * react-redux gives us useDispatch and useSelector. On their own they do not
 * know the shape of OUR store. These wrappers add that knowledge once, so every
 * component gets full autocomplete and type-checking for free:
 *
 *   - useAppDispatch() : dispatch actions and thunks with correct types.
 *   - useAppSelector(fn): read a value from the state with correct types.
 *
 * Always import these instead of the plain react-redux hooks.
 */

import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";
import type { AppDispatch, RootState } from "./store";

/** Like useDispatch, but it knows about our thunks. */
export const useAppDispatch: () => AppDispatch = useDispatch;

/** Like useSelector, but it knows the shape of our state. */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
