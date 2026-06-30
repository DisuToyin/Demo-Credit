import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { TransactionRepository } from "@/modules/transactions/transaction.repository";
import { TransactionService } from "@/modules/transactions/transaction.service";
import { WalletRepository } from "@/modules/wallets/wallet.repository";
import { AppError } from "@/utils/app.error";

import {
  buildWalletRecord,
  buildWalletTransactionRecord,
  createTransactionRepositoryMock,
  createWalletRepositoryMock,
  listTransactionsQuery,
  userId,
} from "./transaction.test.helpers";
import type {
  TransactionRepositoryMock,
  WalletRepositoryMock,
} from "./transaction.test.helpers";

describe("TransactionService", () => {
  let transactionRepository: TransactionRepositoryMock;
  let walletRepository: WalletRepositoryMock;
  let service: TransactionService;

  beforeEach(() => {
    transactionRepository = createTransactionRepositoryMock();
    walletRepository = createWalletRepositoryMock();

    service = new TransactionService(
      transactionRepository as unknown as TransactionRepository,
      walletRepository as unknown as WalletRepository
    );
  });

  it("lists transactions for the authenticated user's wallet with pagination", async () => {
    const wallet = buildWalletRecord();
    const transactions = [
      buildWalletTransactionRecord(),
      buildWalletTransactionRecord({
        id: "transaction-id-2",
        type: "withdrawal",
        amount: 200000,
        balance_before: 500000,
        balance_after: 300000,
        reference: "WDR_transaction-id-2",
        description: "Test withdrawal",
      }),
    ];
    walletRepository.findByUserId.mockResolvedValue(wallet);
    transactionRepository.listByWalletId.mockResolvedValue(transactions);
    transactionRepository.countByWalletId.mockResolvedValue(25);

    const result = await service.listTransactions(userId, listTransactionsQuery);

    expect(walletRepository.findByUserId).toHaveBeenCalledWith(null, userId);
    expect(transactionRepository.listByWalletId).toHaveBeenCalledWith(null, {
      walletId: wallet.id,
      limit: 10,
      offset: 10,
    });
    expect(transactionRepository.countByWalletId).toHaveBeenCalledWith(
      null,
      wallet.id
    );
    expect(result.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      total_pages: 3,
    });
    expect(result.transactions).toEqual([
      {
        id: transactions[0]?.id,
        type: transactions[0]?.type,
        amount: transactions[0]?.amount,
        balance_before: transactions[0]?.balance_before,
        balance_after: transactions[0]?.balance_after,
        reference: transactions[0]?.reference,
        related_transaction_id: transactions[0]?.related_transaction_id,
        counterparty_wallet_id: transactions[0]?.counterparty_wallet_id,
        status: transactions[0]?.status,
        description: transactions[0]?.description,
        created_at: transactions[0]?.created_at,
      },
      {
        id: transactions[1]?.id,
        type: transactions[1]?.type,
        amount: transactions[1]?.amount,
        balance_before: transactions[1]?.balance_before,
        balance_after: transactions[1]?.balance_after,
        reference: transactions[1]?.reference,
        related_transaction_id: transactions[1]?.related_transaction_id,
        counterparty_wallet_id: transactions[1]?.counterparty_wallet_id,
        status: transactions[1]?.status,
        description: transactions[1]?.description,
        created_at: transactions[1]?.created_at,
      },
    ]);
  });

  it("maps numeric transaction fields into number values", async () => {
    const wallet = buildWalletRecord();
    const transaction = buildWalletTransactionRecord({
      amount: "500000" as unknown as number,
      balance_before: "0" as unknown as number,
      balance_after: "500000" as unknown as number,
    });
    walletRepository.findByUserId.mockResolvedValue(wallet);
    transactionRepository.listByWalletId.mockResolvedValue([transaction]);
    transactionRepository.countByWalletId.mockResolvedValue(1);

    const result = await service.listTransactions(userId, {
      page: 1,
      limit: 20,
    });

    expect(result.transactions[0]).toMatchObject({
      amount: 500000,
      balance_before: 0,
      balance_after: 500000,
    });
  });

  it("returns zero total pages when there are no transactions", async () => {
    walletRepository.findByUserId.mockResolvedValue(buildWalletRecord());
    transactionRepository.listByWalletId.mockResolvedValue([]);
    transactionRepository.countByWalletId.mockResolvedValue(0);

    const result = await service.listTransactions(userId, {
      page: 1,
      limit: 20,
    });

    expect(result.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 0,
      total_pages: 0,
    });
    expect(result.transactions).toEqual([]);
  });

  it("rejects listing transactions when the authenticated user has no wallet", async () => {
    walletRepository.findByUserId.mockResolvedValue(null);

    await expect(
      service.listTransactions(userId, listTransactionsQuery)
    ).rejects.toMatchObject({
      statusCode: 404,
      errorCode: "WALLET_NOT_FOUND",
    } satisfies Partial<AppError>);

    expect(transactionRepository.listByWalletId).not.toHaveBeenCalled();
    expect(transactionRepository.countByWalletId).not.toHaveBeenCalled();
  });

  it("propagates wallet repository errors", async () => {
    const walletError = new Error("Failed to fetch wallet");
    walletRepository.findByUserId.mockRejectedValue(walletError);

    await expect(service.listTransactions(userId, listTransactionsQuery)).rejects.toBe(
      walletError
    );

    expect(transactionRepository.listByWalletId).not.toHaveBeenCalled();
    expect(transactionRepository.countByWalletId).not.toHaveBeenCalled();
  });

  it("propagates transaction list repository errors", async () => {
    const listError = new Error("Failed to list transactions");
    walletRepository.findByUserId.mockResolvedValue(buildWalletRecord());
    transactionRepository.listByWalletId.mockRejectedValue(listError);
    transactionRepository.countByWalletId.mockResolvedValue(1);

    await expect(service.listTransactions(userId, listTransactionsQuery)).rejects.toBe(
      listError
    );
  });

  it("propagates transaction count repository errors", async () => {
    const countError = new Error("Failed to count transactions");
    walletRepository.findByUserId.mockResolvedValue(buildWalletRecord());
    transactionRepository.listByWalletId.mockResolvedValue([
      buildWalletTransactionRecord(),
    ]);
    transactionRepository.countByWalletId.mockRejectedValue(countError);

    await expect(service.listTransactions(userId, listTransactionsQuery)).rejects.toBe(
      countError
    );
  });
});
