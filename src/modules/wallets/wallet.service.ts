import { randomUUID } from "node:crypto";

import { db } from "@/database/knex";
import { TransactionRepository } from "@/modules/transactions/transaction.repository";
import type { CreateWalletTransactionData } from "@/modules/transactions/transaction.types";
import { WalletRepository } from "@/modules/wallets/wallet.repository";
import type {
  FundWalletRequestBody,
  FundWalletResult,
  TransferFundsRequestBody,
  TransferFundsResult,
  WalletRecord,
  WithdrawWalletRequestBody,
  WithdrawWalletResult,
} from "@/modules/wallets/wallet.types";
import { AppError } from "@/utils/app.error";

export class WalletService {
  public constructor(
    private readonly walletRepository = new WalletRepository(),
    private readonly transactionRepository = new TransactionRepository()
  ) {}

  public async fundWallet(
    userId: string,
    payload: FundWalletRequestBody
  ): Promise<FundWalletResult> {
    return db.transaction(async (trx) => {
      const wallet = await this.walletRepository.findByUserIdForUpdate(trx, userId);

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

      await this.walletRepository.updateBalance(trx, {
        walletId: wallet.id,
        balance: balanceAfter,
      });
      await this.transactionRepository.create(trx, transaction);

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
      const wallet = await this.walletRepository.findByUserIdForUpdate(trx, userId);

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

      await this.walletRepository.updateBalance(trx, {
        walletId: wallet.id,
        balance: balanceAfter,
      });
      await this.transactionRepository.create(trx, transaction);

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
      const wallets = await this.walletRepository.findTransferWalletsForUpdate(trx, {
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

      await this.walletRepository.updateBalance(trx, {
        walletId: senderWallet.id,
        balance: senderBalanceAfter,
      });
      await this.walletRepository.updateBalance(trx, {
        walletId: recipientWallet.id,
        balance: recipientBalanceAfter,
      });
      await this.transactionRepository.create(trx, debitTransaction);
      await this.transactionRepository.create(trx, creditTransaction);
      await this.transactionRepository.updateRelatedTransactionId(trx, {
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
