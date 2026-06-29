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

export type FundWalletRequestBody = {
  amount: number;
  description?: string | undefined;
};

export type UpdateWalletBalanceData = {
  walletId: string;
  balance: number;
};

export type FundWalletResult = {
  wallet: {
    id: string;
    account_number: string;
    balance: number;
    currency: string;
    status: WalletStatus;
  };
  transaction: {
    id: string;
    type: "fund";
    amount: number;
    balance_before: number;
    balance_after: number;
    reference: string;
    status: "successful";
    description: string | null;
  };
};
