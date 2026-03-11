export type AuthRole = "student" | "admin";

export type AuthStoredUser = {
  id: string;
  name: string;
  email: string;
  campus: string;
  password: string;
  role: AuthRole;
  createdAt: string;
};

export type AuthSession = {
  userId: string;
  name: string;
  email: string;
  campus: string;
  role: AuthRole;
  signedInAt: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type SignupInput = {
  name: string;
  email: string;
  campus: string;
  password: string;
};
