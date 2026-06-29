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

export type TransferFundsRequestBody = {
  recipient_account_number: string;
  amount: number;
  description?: string | undefined;
};

export type UpdateWalletBalanceData = {
  walletId: string;
  balance: number;
};

export type FindTransferWalletsData = {
  senderUserId: string;
  recipientAccountNumber: string;
};

type WalletOperationResult<TType extends "fund" | "withdrawal" | "transfer_out"> = {
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

export type TransferFundsResult = {
  sender_wallet: {
    id: string;
    account_number: string;
    balance: number;
    currency: string;
  };
  recipient_wallet: {
    id: string;
    account_number: string;
    currency: string;
  };
  transactions: {
    debit: WalletOperationResult<"transfer_out">["transaction"];
    credit: {
      id: string;
      type: "transfer_in";
      amount: number;
      balance_before: number;
      balance_after: number;
      reference: string;
      status: "successful";
      description: string | null;
    };
  };
};
