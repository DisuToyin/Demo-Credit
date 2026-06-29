export type WalletRecord = {
  id: string;
  user_id: string;
  account_number: string;
  balance: number;
  currency: string;
  created_at: Date;
  updated_at: Date;
};

export type CreateWalletData = {
  id: string;
  user_id: string;
  account_number: string;
  balance: number;
  currency: string;
};

export type FundWalletRequestBody = {
  amount: number;
  description?: string | undefined;
};

export type WithdrawWalletRequestBody = {
  amount: number;
  description?: string | undefined;
};

export type UpdateWalletBalanceData = {
  walletId: string;
  balance: number;
};

type WalletOperationResult<TType extends "fund" | "withdrawal"> = {
  wallet: {
    id: string;
    account_number: string;
    balance: number;
    currency: string;
  };
  transaction: {
    id: string;
    type: TType;
    amount: number;
    balance_before: number;
    balance_after: number;
    reference: string;
    status: "successful";
    description: string | null;
  };
};

export type FundWalletResult = WalletOperationResult<"fund">;

export type WithdrawWalletResult = WalletOperationResult<"withdrawal">;
