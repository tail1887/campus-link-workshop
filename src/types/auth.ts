export type AuthRole = "student" | "admin";

export type AuthStoredUser = {
  id: string;
  loginId: string;
  name: string;
  campus: string;
  password: string;
  role: AuthRole;
  createdAt: string;
};

export type AuthSession = {
  userId: string;
  loginId: string;
  name: string;
  campus: string;
  role: AuthRole;
  signedInAt: string;
};

export type LoginInput = {
  loginId: string;
  password: string;
};

export type SignupInput = {
  loginId: string;
  name: string;
  campus: string;
  password: string;
};
