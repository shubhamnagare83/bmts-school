/**
 * Application roles.
 *
 * Declared as a const object plus a matching union type rather than a TypeScript
 * `enum`. Enum members are nominally typed, so `authorize('ADMIN')` was rejected
 * even though the string is correct. With this shape both styles type-check:
 *
 *   authorize('ADMIN')          // plain string literal
 *   authorize(UserRole.ADMIN)   // named constant
 */
export const UserRole = {
  ADMIN: 'ADMIN',
  FACULTY: 'FACULTY',
  STUDENT: 'STUDENT',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
