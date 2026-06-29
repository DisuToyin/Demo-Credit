import type { WalletStatus } from "@/modules/wallets/wallets.types";

export type SignupRequestBody = {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  bvn: string;
  password: string;
};

export type UserRecord = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  bvn: string;
  password_hash: string;
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
};

export type SignupResult = {
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  };
  wallet: {
    id: string;
    account_number: string;
    balance: number;
    currency: string;
    status: WalletStatus;
  };
};
