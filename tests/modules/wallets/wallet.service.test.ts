import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { db } from "@/database/knex";
import type { CreateWalletTransactionData } from "@/modules/transactions/transaction.types";
import { TransactionRepository } from "@/modules/transactions/transaction.repository";
import { WalletRepository } from "@/modules/wallets/wallet.repository";
import { WalletService } from "@/modules/wallets/wallet.service";
import { AppError } from "@/utils/app.error";

import {
  buildRecipientWalletRecord,
  buildWalletRecord,
  createTransactionRepositoryMock,
  createWalletRepositoryMock,
  fakeTrx,
  fundWalletPayload,
  transferFundsPayload,
  userId,
  withdrawWalletPayload,
} from "./wallet.test.helpers";
import type {
  DbTransactionMock,
  TransactionCallback,
  TransactionRepositoryMock,
  WalletRepositoryMock,
} from "./wallet.test.helpers";

vi.mock("@/database/knex", () => ({
  db: {
    transaction: vi.fn(),
  },
  closeDatabase: vi.fn(),
}));

describe("WalletService", () => {
  let walletRepository: WalletRepositoryMock;
  let transactionRepository: TransactionRepositoryMock;
  let service: WalletService;
  let transactionMock: DbTransactionMock;

  beforeEach(() => {
    walletRepository = createWalletRepositoryMock();
    transactionRepository = createTransactionRepositoryMock();

    transactionMock = db.transaction as unknown as DbTransactionMock;
    transactionMock.mockImplementation(<T>(callback: TransactionCallback<T>) =>
      callback(fakeTrx)
    );

    service = new WalletService(
      walletRepository as unknown as WalletRepository,
      transactionRepository as unknown as TransactionRepository
    );
  });

  it("funds a wallet and creates a fund transaction", async () => {
    const wallet = buildWalletRecord({ balance: 100000 });
    walletRepository.findByUserIdForUpdate.mockResolvedValue(wallet);

    const result = await service.fundWallet(userId, fundWalletPayload);

    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(walletRepository.findByUserIdForUpdate).toHaveBeenCalledWith(
      fakeTrx,
      userId
    );
    expect(walletRepository.updateBalance).toHaveBeenCalledWith(fakeTrx, {
      walletId: wallet.id,
      balance: 600000,
    });
    expect(transactionRepository.create).toHaveBeenCalledWith(
      fakeTrx,
      expect.objectContaining({
        wallet_id: wallet.id,
        type: "fund",
        amount: fundWalletPayload.amount,
        balance_before: 100000,
        balance_after: 600000,
        reference: expect.stringMatching(/^FND_/),
        related_transaction_id: null,
        counterparty_wallet_id: null,
        status: "successful",
        description: fundWalletPayload.description,
      })
    );
    expect(result.wallet).toEqual({
      id: wallet.id,
      account_number: wallet.account_number,
      balance: 600000,
      currency: wallet.currency,
    });
    expect(result.transaction).toMatchObject({
      type: "fund",
      amount: fundWalletPayload.amount,
      balance_before: 100000,
      balance_after: 600000,
      status: "successful",
      description: fundWalletPayload.description,
    });
  });

  it("rejects funding when the wallet does not exist", async () => {
    walletRepository.findByUserIdForUpdate.mockResolvedValue(null);

    await expect(service.fundWallet(userId, fundWalletPayload)).rejects.toMatchObject({
      statusCode: 404,
      errorCode: "WALLET_NOT_FOUND",
    } satisfies Partial<AppError>);

    expect(walletRepository.updateBalance).not.toHaveBeenCalled();
    expect(transactionRepository.create).not.toHaveBeenCalled();
  });

  it("propagates balance update failures during funding", async () => {
    const updateError = new Error("Failed to update balance");
    walletRepository.findByUserIdForUpdate.mockResolvedValue(buildWalletRecord());
    walletRepository.updateBalance.mockRejectedValue(updateError);

    await expect(service.fundWallet(userId, fundWalletPayload)).rejects.toBe(
      updateError
    );

    expect(transactionRepository.create).not.toHaveBeenCalled();
  });

  it("propagates transaction creation failures during funding", async () => {
    const transactionError = new Error("Failed to create transaction");
    walletRepository.findByUserIdForUpdate.mockResolvedValue(buildWalletRecord());
    transactionRepository.create.mockRejectedValue(transactionError);

    await expect(service.fundWallet(userId, fundWalletPayload)).rejects.toBe(
      transactionError
    );

    expect(walletRepository.updateBalance).toHaveBeenCalledTimes(1);
    expect(transactionRepository.create).toHaveBeenCalledTimes(1);
  });

  it("withdraws funds and creates a withdrawal transaction", async () => {
    const wallet = buildWalletRecord({ balance: 500000 });
    walletRepository.findByUserIdForUpdate.mockResolvedValue(wallet);

    const result = await service.withdrawFunds(userId, withdrawWalletPayload);

    expect(walletRepository.updateBalance).toHaveBeenCalledWith(fakeTrx, {
      walletId: wallet.id,
      balance: 300000,
    });
    expect(transactionRepository.create).toHaveBeenCalledWith(
      fakeTrx,
      expect.objectContaining({
        wallet_id: wallet.id,
        type: "withdrawal",
        amount: withdrawWalletPayload.amount,
        balance_before: 500000,
        balance_after: 300000,
        reference: expect.stringMatching(/^WDR_/),
        related_transaction_id: null,
        counterparty_wallet_id: null,
        status: "successful",
        description: withdrawWalletPayload.description,
      })
    );
    expect(result.wallet.balance).toBe(300000);
    expect(result.transaction).toMatchObject({
      type: "withdrawal",
      amount: withdrawWalletPayload.amount,
      balance_before: 500000,
      balance_after: 300000,
    });
  });

  it("rejects withdrawal when the wallet does not exist", async () => {
    walletRepository.findByUserIdForUpdate.mockResolvedValue(null);

    await expect(
      service.withdrawFunds(userId, withdrawWalletPayload)
    ).rejects.toMatchObject({
      statusCode: 404,
      errorCode: "WALLET_NOT_FOUND",
    } satisfies Partial<AppError>);

    expect(walletRepository.updateBalance).not.toHaveBeenCalled();
    expect(transactionRepository.create).not.toHaveBeenCalled();
  });

  it("rejects withdrawal when balance is insufficient", async () => {
    walletRepository.findByUserIdForUpdate.mockResolvedValue(
      buildWalletRecord({ balance: 100000 })
    );

    await expect(
      service.withdrawFunds(userId, withdrawWalletPayload)
    ).rejects.toMatchObject({
      statusCode: 400,
      errorCode: "INSUFFICIENT_FUNDS",
    } satisfies Partial<AppError>);

    expect(walletRepository.updateBalance).not.toHaveBeenCalled();
    expect(transactionRepository.create).not.toHaveBeenCalled();
  });

  it("transfers funds between wallets and creates linked ledger records", async () => {
    const senderWallet = buildWalletRecord({ balance: 500000 });
    const recipientWallet = buildRecipientWalletRecord({ balance: 100000 });
    walletRepository.findTransferWalletsForUpdate.mockResolvedValue([
      senderWallet,
      recipientWallet,
    ]);

    const result = await service.transferFunds(userId, transferFundsPayload);

    expect(walletRepository.findTransferWalletsForUpdate).toHaveBeenCalledWith(
      fakeTrx,
      {
        senderUserId: userId,
        recipientAccountNumber: transferFundsPayload.recipient_account_number,
      }
    );
    expect(walletRepository.updateBalance).toHaveBeenNthCalledWith(1, fakeTrx, {
      walletId: senderWallet.id,
      balance: 300000,
    });
    expect(walletRepository.updateBalance).toHaveBeenNthCalledWith(2, fakeTrx, {
      walletId: recipientWallet.id,
      balance: 300000,
    });

    const debitTransaction = transactionRepository.create.mock.calls[0]?.[1];
    const creditTransaction = transactionRepository.create.mock.calls[1]?.[1];

    expect(debitTransaction).toMatchObject({
      wallet_id: senderWallet.id,
      type: "transfer_out",
      amount: transferFundsPayload.amount,
      balance_before: 500000,
      balance_after: 300000,
      reference: expect.stringMatching(/^TRO_/),
      related_transaction_id: null,
      counterparty_wallet_id: recipientWallet.id,
      status: "successful",
      description: transferFundsPayload.description ?? null,
    } satisfies Partial<CreateWalletTransactionData>);
    expect(creditTransaction).toMatchObject({
      wallet_id: recipientWallet.id,
      type: "transfer_in",
      amount: transferFundsPayload.amount,
      balance_before: 100000,
      balance_after: 300000,
      reference: expect.stringMatching(/^TRI_/),
      related_transaction_id: debitTransaction?.id ?? null,
      counterparty_wallet_id: senderWallet.id,
      status: "successful",
      description: transferFundsPayload.description ?? null,
    } satisfies Partial<CreateWalletTransactionData>);
    expect(transactionRepository.updateRelatedTransactionId).toHaveBeenCalledWith(
      fakeTrx,
      {
        transactionId: debitTransaction?.id,
        relatedTransactionId: creditTransaction?.id,
      }
    );
    expect(result.sender_wallet.balance).toBe(300000);
    expect(result.recipient_wallet).toEqual({
      id: recipientWallet.id,
      account_number: recipientWallet.account_number,
      currency: recipientWallet.currency,
    });
    expect(result.transactions.debit).toMatchObject({
      id: debitTransaction?.id,
      type: "transfer_out",
      balance_before: 500000,
      balance_after: 300000,
    });
    expect(result.transactions.credit).toMatchObject({
      id: creditTransaction?.id,
      type: "transfer_in",
      balance_before: 100000,
      balance_after: 300000,
    });
  });

  it("rejects transfer when the sender wallet does not exist", async () => {
    walletRepository.findTransferWalletsForUpdate.mockResolvedValue([
      buildRecipientWalletRecord(),
    ]);

    await expect(
      service.transferFunds(userId, transferFundsPayload)
    ).rejects.toMatchObject({
      statusCode: 404,
      errorCode: "WALLET_NOT_FOUND",
    } satisfies Partial<AppError>);

    expect(walletRepository.updateBalance).not.toHaveBeenCalled();
    expect(transactionRepository.create).not.toHaveBeenCalled();
  });

  it("rejects transfer when the recipient wallet does not exist", async () => {
    walletRepository.findTransferWalletsForUpdate.mockResolvedValue([
      buildWalletRecord(),
    ]);

    await expect(
      service.transferFunds(userId, transferFundsPayload)
    ).rejects.toMatchObject({
      statusCode: 404,
      errorCode: "RECIPIENT_WALLET_NOT_FOUND",
    } satisfies Partial<AppError>);

    expect(walletRepository.updateBalance).not.toHaveBeenCalled();
    expect(transactionRepository.create).not.toHaveBeenCalled();
  });

  it("rejects self-transfer", async () => {
    const wallet = buildWalletRecord({
      account_number: transferFundsPayload.recipient_account_number,
    });
    walletRepository.findTransferWalletsForUpdate.mockResolvedValue([wallet]);

    await expect(
      service.transferFunds(userId, transferFundsPayload)
    ).rejects.toMatchObject({
      statusCode: 400,
      errorCode: "SELF_TRANSFER_NOT_ALLOWED",
    } satisfies Partial<AppError>);

    expect(walletRepository.updateBalance).not.toHaveBeenCalled();
    expect(transactionRepository.create).not.toHaveBeenCalled();
  });

  it("rejects transfer when sender balance is insufficient", async () => {
    walletRepository.findTransferWalletsForUpdate.mockResolvedValue([
      buildWalletRecord({ balance: 100000 }),
      buildRecipientWalletRecord(),
    ]);

    await expect(
      service.transferFunds(userId, transferFundsPayload)
    ).rejects.toMatchObject({
      statusCode: 400,
      errorCode: "INSUFFICIENT_FUNDS",
    } satisfies Partial<AppError>);

    expect(walletRepository.updateBalance).not.toHaveBeenCalled();
    expect(transactionRepository.create).not.toHaveBeenCalled();
  });

  it("propagates sender balance update failures during transfer", async () => {
    const updateError = new Error("Failed to debit sender");
    walletRepository.findTransferWalletsForUpdate.mockResolvedValue([
      buildWalletRecord(),
      buildRecipientWalletRecord(),
    ]);
    walletRepository.updateBalance.mockRejectedValueOnce(updateError);

    await expect(service.transferFunds(userId, transferFundsPayload)).rejects.toBe(
      updateError
    );

    expect(walletRepository.updateBalance).toHaveBeenCalledTimes(1);
    expect(transactionRepository.create).not.toHaveBeenCalled();
  });

  it("propagates transfer transaction creation failures", async () => {
    const transactionError = new Error("Failed to create transfer transaction");
    walletRepository.findTransferWalletsForUpdate.mockResolvedValue([
      buildWalletRecord(),
      buildRecipientWalletRecord(),
    ]);
    transactionRepository.create.mockRejectedValueOnce(transactionError);

    await expect(service.transferFunds(userId, transferFundsPayload)).rejects.toBe(
      transactionError
    );

    expect(walletRepository.updateBalance).toHaveBeenCalledTimes(2);
    expect(transactionRepository.create).toHaveBeenCalledTimes(1);
    expect(transactionRepository.updateRelatedTransactionId).not.toHaveBeenCalled();
  });
});
