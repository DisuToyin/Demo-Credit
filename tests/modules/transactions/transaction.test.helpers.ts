import { vi } from "vitest";
import type { MockedFunction } from "vitest";

import { TransactionRepository } from "@/modules/transactions/transaction.repository";
import type {
  ListTransactionsRequestQuery,
  WalletTransactionRecord,
} from "@/modules/transactions/transaction.types";
import { WalletRepository } from "@/modules/wallets/wallet.repository";
import type { WalletRecord } from "@/modules/wallets/wallet.types";

export type TransactionRepositoryMock = {
  listByWalletId: MockedFunction<TransactionRepository["listByWalletId"]>;
  countByWalletId: MockedFunction<TransactionRepository["countByWalletId"]>;
};

export type WalletRepositoryMock = {
  findByUserId: MockedFunction<WalletRepository["findByUserId"]>;
};

export const userId = "user-id";

export const listTransactionsQuery: ListTransactionsRequestQuery = {
  page: 2,
  limit: 10,
};

export const buildWalletRecord = (
  overrides: Partial<WalletRecord> = {}
): WalletRecord => ({
  id: "wallet-id",
  user_id: userId,
  account_number: "1234567890",
  balance: 500000,
  currency: "NGN",
  created_at: new Date("2026-06-30T00:00:00.000Z"),
  updated_at: new Date("2026-06-30T00:00:00.000Z"),
  ...overrides,
});

export const buildWalletTransactionRecord = (
  overrides: Partial<WalletTransactionRecord> = {}
): WalletTransactionRecord => ({
  id: "transaction-id",
  wallet_id: "wallet-id",
  type: "fund",
  amount: 500000,
  balance_before: 0,
  balance_after: 500000,
  reference: "FND_transaction-id",
  related_transaction_id: null,
  counterparty_wallet_id: null,
  status: "successful",
  description: "Test funding",
  created_at: new Date("2026-06-30T00:00:00.000Z"),
  ...overrides,
});

export const createTransactionRepositoryMock = (): TransactionRepositoryMock => ({
  listByWalletId: vi.fn(),
  countByWalletId: vi.fn(),
});

export const createWalletRepositoryMock = (): WalletRepositoryMock => ({
  findByUserId: vi.fn(),
});
