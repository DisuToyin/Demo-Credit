export type WalletTransactionType =
  | "fund"
  | "withdrawal"
  | "transfer_in"
  | "transfer_out";

export type WalletTransactionStatus =
  | "pending"
  | "successful"
  | "failed"
  | "reversed";

export type WalletTransactionRecord = {
  id: string;
  wallet_id: string;
  type: WalletTransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  reference: string;
  related_transaction_id: string | null;
  counterparty_wallet_id: string | null;
  status: WalletTransactionStatus;
  description: string | null;
  created_at: Date;
};

export type CreateWalletTransactionData = {
  id: string;
  wallet_id: string;
  type: WalletTransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  reference: string;
  related_transaction_id: string | null;
  counterparty_wallet_id: string | null;
  status: WalletTransactionStatus;
  description: string | null;
};
