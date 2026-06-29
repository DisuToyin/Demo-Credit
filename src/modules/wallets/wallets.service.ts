import { randomUUID } from "node:crypto";

import { db } from "@/database/knex";
import { TransactionsRepository } from "@/modules/transactions/transactions.repository";
import type { CreateWalletTransactionData } from "@/modules/transactions/transactions.types";
import { WalletsRepository } from "@/modules/wallets/wallets.repository";
import type {
  FundWalletRequestBody,
  FundWalletResult,
  TransferFundsRequestBody,
  TransferFundsResult,
  WalletRecord,
  WithdrawWalletRequestBody,
  WithdrawWalletResult,
} from "@/modules/wallets/wallets.types";
import { AppError } from "@/utils/app.error";

export class WalletsService {
  public constructor(
    private readonly walletsRepository = new WalletsRepository(),
    private readonly transactionsRepository = new TransactionsRepository()
  ) {}

  public async fundWallet(
    userId: string,
    payload: FundWalletRequestBody
  ): Promise<FundWalletResult> {
    return db.transaction(async (trx) => {
      const wallet = await this.walletsRepository.findByUserIdForUpdate(trx, userId);

      if (!wallet) {
        throw new AppError("Wallet not found.", 404, "WALLET_NOT_FOUND");
      }

      const balanceBefore = Number(wallet.balance);
      const balanceAfter = balanceBefore + payload.amount;
      const transaction = this.buildFundTransaction(
        wallet,
        payload.amount,
        balanceBefore,
        balanceAfter,
        payload.description ?? null
      );

      await this.walletsRepository.updateBalance(trx, {
        walletId: wallet.id,
        balance: balanceAfter,
      });
      await this.transactionsRepository.create(trx, transaction);

      return {
        wallet: {
          id: wallet.id,
          account_number: wallet.account_number,
          balance: balanceAfter,
          currency: wallet.currency,
        },
        transaction: {
          id: transaction.id,
          type: "fund",
          amount: transaction.amount,
          balance_before: transaction.balance_before,
          balance_after: transaction.balance_after,
          reference: transaction.reference,
          status: "successful",
          description: transaction.description,
        },
      };
    });
  }

  public async withdrawFunds(
    userId: string,
    payload: WithdrawWalletRequestBody
  ): Promise<WithdrawWalletResult> {
    return db.transaction(async (trx) => {
      const wallet = await this.walletsRepository.findByUserIdForUpdate(trx, userId);

      if (!wallet) {
        throw new AppError("Wallet not found.", 404, "WALLET_NOT_FOUND");
      }

      const balanceBefore = Number(wallet.balance);

      if (balanceBefore < payload.amount) {
        throw new AppError("Insufficient wallet balance.", 400, "INSUFFICIENT_FUNDS");
      }

      const balanceAfter = balanceBefore - payload.amount;
      const transaction = this.buildWithdrawalTransaction(
        wallet,
        payload.amount,
        balanceBefore,
        balanceAfter,
        payload.description ?? null
      );

      await this.walletsRepository.updateBalance(trx, {
        walletId: wallet.id,
        balance: balanceAfter,
      });
      await this.transactionsRepository.create(trx, transaction);

      return {
        wallet: {
          id: wallet.id,
          account_number: wallet.account_number,
          balance: balanceAfter,
          currency: wallet.currency,
        },
        transaction: {
          id: transaction.id,
          type: "withdrawal",
          amount: transaction.amount,
          balance_before: transaction.balance_before,
          balance_after: transaction.balance_after,
          reference: transaction.reference,
          status: "successful",
          description: transaction.description,
        },
      };
    });
  }

  public async transferFunds(
    userId: string,
    payload: TransferFundsRequestBody
  ): Promise<TransferFundsResult> {
    return db.transaction(async (trx) => {
      const wallets = await this.walletsRepository.findTransferWalletsForUpdate(trx, {
        senderUserId: userId,
        recipientAccountNumber: payload.recipient_account_number,
      });

      const senderWallet = wallets.find((wallet) => wallet.user_id === userId) ?? null;
      const recipientWallet =
        wallets.find(
          (wallet) => wallet.account_number === payload.recipient_account_number
        ) ?? null;

      if (!senderWallet) {
        throw new AppError("Wallet not found.", 404, "WALLET_NOT_FOUND");
      }

      if (!recipientWallet) {
        throw new AppError(
          "Recipient wallet not found.",
          404,
          "RECIPIENT_WALLET_NOT_FOUND"
        );
      }

      if (senderWallet.id === recipientWallet.id) {
        throw new AppError(
          "You cannot transfer funds to the same wallet.",
          400,
          "SELF_TRANSFER_NOT_ALLOWED"
        );
      }

      const senderBalanceBefore = Number(senderWallet.balance);

      if (senderBalanceBefore < payload.amount) {
        throw new AppError("Insufficient wallet balance.", 400, "INSUFFICIENT_FUNDS");
      }

      const recipientBalanceBefore = Number(recipientWallet.balance);
      const senderBalanceAfter = senderBalanceBefore - payload.amount;
      const recipientBalanceAfter = recipientBalanceBefore + payload.amount;
      const description = payload.description ?? null;

      const debitTransaction = this.buildTransferOutTransaction(
        senderWallet,
        recipientWallet,
        payload.amount,
        senderBalanceBefore,
        senderBalanceAfter,
        description
      );
      const creditTransaction = this.buildTransferInTransaction(
        recipientWallet,
        senderWallet,
        debitTransaction.id,
        payload.amount,
        recipientBalanceBefore,
        recipientBalanceAfter,
        description
      );

      await this.walletsRepository.updateBalance(trx, {
        walletId: senderWallet.id,
        balance: senderBalanceAfter,
      });
      await this.walletsRepository.updateBalance(trx, {
        walletId: recipientWallet.id,
        balance: recipientBalanceAfter,
      });
      await this.transactionsRepository.create(trx, debitTransaction);
      await this.transactionsRepository.create(trx, creditTransaction);
      await this.transactionsRepository.updateRelatedTransactionId(trx, {
        transactionId: debitTransaction.id,
        relatedTransactionId: creditTransaction.id,
      });

      return {
        sender_wallet: {
          id: senderWallet.id,
          account_number: senderWallet.account_number,
          balance: senderBalanceAfter,
          currency: senderWallet.currency,
        },
        recipient_wallet: {
          id: recipientWallet.id,
          account_number: recipientWallet.account_number,
          currency: recipientWallet.currency,
        },
        transactions: {
          debit: {
            id: debitTransaction.id,
            type: "transfer_out",
            amount: debitTransaction.amount,
            balance_before: debitTransaction.balance_before,
            balance_after: debitTransaction.balance_after,
            reference: debitTransaction.reference,
            status: "successful",
            description: debitTransaction.description,
          },
          credit: {
            id: creditTransaction.id,
            type: "transfer_in",
            amount: creditTransaction.amount,
            balance_before: creditTransaction.balance_before,
            balance_after: creditTransaction.balance_after,
            reference: creditTransaction.reference,
            status: "successful",
            description: creditTransaction.description,
          },
        },
      };
    });
  }

  private buildFundTransaction(
    wallet: WalletRecord,
    amount: number,
    balanceBefore: number,
    balanceAfter: number,
    description: string | null
  ): CreateWalletTransactionData {
    const transactionId = randomUUID();

    return {
      id: transactionId,
      wallet_id: wallet.id,
      type: "fund",
      amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      reference: `FND_${transactionId}`,
      related_transaction_id: null,
      counterparty_wallet_id: null,
      status: "successful",
      description,
    };
  }

  private buildWithdrawalTransaction(
    wallet: WalletRecord,
    amount: number,
    balanceBefore: number,
    balanceAfter: number,
    description: string | null
  ): CreateWalletTransactionData {
    const transactionId = randomUUID();

    return {
      id: transactionId,
      wallet_id: wallet.id,
      type: "withdrawal",
      amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      reference: `WDR_${transactionId}`,
      related_transaction_id: null,
      counterparty_wallet_id: null,
      status: "successful",
      description,
    };
  }

  private buildTransferOutTransaction(
    senderWallet: WalletRecord,
    recipientWallet: WalletRecord,
    amount: number,
    balanceBefore: number,
    balanceAfter: number,
    description: string | null
  ): CreateWalletTransactionData {
    const transactionId = randomUUID();

    return {
      id: transactionId,
      wallet_id: senderWallet.id,
      type: "transfer_out",
      amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      reference: `TRO_${transactionId}`,
      related_transaction_id: null,
      counterparty_wallet_id: recipientWallet.id,
      status: "successful",
      description,
    };
  }

  private buildTransferInTransaction(
    recipientWallet: WalletRecord,
    senderWallet: WalletRecord,
    relatedTransactionId: string,
    amount: number,
    balanceBefore: number,
    balanceAfter: number,
    description: string | null
  ): CreateWalletTransactionData {
    const transactionId = randomUUID();

    return {
      id: transactionId,
      wallet_id: recipientWallet.id,
      type: "transfer_in",
      amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      reference: `TRI_${transactionId}`,
      related_transaction_id: relatedTransactionId,
      counterparty_wallet_id: senderWallet.id,
      status: "successful",
      description,
    };
  }
}
