/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admissions from "../admissions.js";
import type * as auditLogs from "../auditLogs.js";
import type * as auth from "../auth.js";
import type * as departments from "../departments.js";
import type * as diagnoses from "../diagnoses.js";
import type * as doctorActions from "../doctorActions.js";
import type * as doctors from "../doctors.js";
import type * as http from "../http.js";
import type * as lib_audit from "../lib/audit.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_format from "../lib/format.js";
import type * as myFunctions from "../myFunctions.js";
import type * as patients from "../patients.js";
import type * as staff from "../staff.js";
import type * as stats from "../stats.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admissions: typeof admissions;
  auditLogs: typeof auditLogs;
  auth: typeof auth;
  departments: typeof departments;
  diagnoses: typeof diagnoses;
  doctorActions: typeof doctorActions;
  doctors: typeof doctors;
  http: typeof http;
  "lib/audit": typeof lib_audit;
  "lib/auth": typeof lib_auth;
  "lib/format": typeof lib_format;
  myFunctions: typeof myFunctions;
  patients: typeof patients;
  staff: typeof staff;
  stats: typeof stats;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
