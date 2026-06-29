import type { Knex } from "knex";

import type {
  CreateWalletTransactionData,
  WalletTransactionRecord,
} from "@/modules/transactions/transactions.types";

export class TransactionsRepository {
  public async create(
    trx: Knex.Transaction,
    transaction: CreateWalletTransactionData
  ): Promise<void> {
    await trx<WalletTransactionRecord>("wallet_transactions").insert(transaction);
  }
}
