import type { WalletStatus } from "@/modules/wallets/wallets.types";

export type AuthenticatedUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
};

export type UserRecord = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  bvn: string;
  password_hash: string;
  auth_token: string;
  created_at: Date;
  updated_at: Date;
};

export type CreateUserData = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  bvn: string;
  password_hash: string;
  auth_token: string;
};

export type SigninRequestBody = {
  email: string;
  password: string;
};

export type SignupRequestBody = {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  bvn: string;
  password: string;
};

export type UpdateAuthTokenData = {
  userId: string;
  authToken: string;
};

export type SigninResult = {
  user: AuthenticatedUser;
  token: string;
};

export type SignupResult = {
  user: AuthenticatedUser;
  wallet: {
    id: string;
    account_number: string;
    balance: number;
    currency: string;
    status: WalletStatus;
  };
  token: string;
};
