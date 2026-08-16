export const ROLES = ["viewer", "reviewer", "approver", "admin"] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  roles: Role[];
};
