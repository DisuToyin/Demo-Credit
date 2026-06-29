import { randomUUID } from "node:crypto";

import { db } from "@/database/knex";
import { TransactionsRepository } from "@/modules/transactions/transactions.repository";
import type { CreateWalletTransactionData } from "@/modules/transactions/transactions.types";
import { WalletsRepository } from "@/modules/wallets/wallets.repository";
import type {
  FundWalletRequestBody,
  FundWalletResult,
  WalletRecord,
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

      if (wallet.status !== "active") {
        throw new AppError("Wallet is not active.", 403, "WALLET_NOT_ACTIVE");
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
          status: wallet.status,
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
}
