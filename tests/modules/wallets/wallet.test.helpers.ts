import type { Knex } from "knex";
import { vi } from "vitest";
import type { MockedFunction } from "vitest";

import { TransactionRepository } from "@/modules/transactions/transaction.repository";
import { WalletRepository } from "@/modules/wallets/wallet.repository";
import type {
  FundWalletRequestBody,
  TransferFundsRequestBody,
  WalletRecord,
  WithdrawWalletRequestBody,
} from "@/modules/wallets/wallet.types";

export type TransactionCallback<T> = (trx: Knex.Transaction) => Promise<T>;

export type DbTransactionMock = MockedFunction<
  <T>(callback: TransactionCallback<T>) => Promise<T>
>;

export type WalletRepositoryMock = {
  findByUserIdForUpdate: MockedFunction<WalletRepository["findByUserIdForUpdate"]>;
  findTransferWalletsForUpdate: MockedFunction<
    WalletRepository["findTransferWalletsForUpdate"]
  >;
  updateBalance: MockedFunction<WalletRepository["updateBalance"]>;
};

export type TransactionRepositoryMock = {
  create: MockedFunction<TransactionRepository["create"]>;
  updateRelatedTransactionId: MockedFunction<
    TransactionRepository["updateRelatedTransactionId"]
  >;
};

export const fakeTrx = {
  name: "fake-wallet-transaction",
} as unknown as Knex.Transaction;

export const userId = "user-id";

export const fundWalletPayload: FundWalletRequestBody = {
  amount: 500000,
  description: "Test wallet funding",
};

export const withdrawWalletPayload: WithdrawWalletRequestBody = {
  amount: 200000,
  description: "Test withdrawal",
};

export const transferFundsPayload: TransferFundsRequestBody = {
  recipient_account_number: "1234567891",
  amount: 200000,
  description: "Test transfer",
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

export const buildRecipientWalletRecord = (
  overrides: Partial<WalletRecord> = {}
): WalletRecord =>
  buildWalletRecord({
    id: "recipient-wallet-id",
    user_id: "recipient-user-id",
    account_number: transferFundsPayload.recipient_account_number,
    balance: 100000,
    ...overrides,
  });

export const createWalletRepositoryMock = (): WalletRepositoryMock => ({
  findByUserIdForUpdate: vi.fn(),
  findTransferWalletsForUpdate: vi.fn(),
  updateBalance: vi.fn(),
});

export const createTransactionRepositoryMock = (): TransactionRepositoryMock => ({
  create: vi.fn(),
  updateRelatedTransactionId: vi.fn(),
});
