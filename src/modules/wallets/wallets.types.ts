export type WalletStatus = "active" | "frozen" | "closed";

export type WalletRecord = {
  id: string;
  user_id: string;
  account_number: string;
  balance: number;
  currency: string;
  status: WalletStatus;
  created_at: Date;
  updated_at: Date;
};

export type CreateWalletData = {
  id: string;
  user_id: string;
  account_number: string;
  balance: number;
  currency: string;
  status: WalletStatus;
};
