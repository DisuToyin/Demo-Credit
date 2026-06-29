import type { Knex } from "knex";

import { db } from "@/database/knex";
import type {
  CreateWalletTransactionData,
  ListWalletTransactionsData,
  WalletTransactionRecord,
} from "@/modules/transactions/transactions.types";

export class TransactionsRepository {
  public constructor(private readonly knexInstance: Knex = db) {}

  public async create(
    trx: Knex.Transaction,
    transaction: CreateWalletTransactionData
  ): Promise<void> {
    await trx<WalletTransactionRecord>("wallet_transactions").insert(transaction);
  }

  public async listByWalletId(
    trx: Knex.Transaction | null,
    data: ListWalletTransactionsData
  ): Promise<WalletTransactionRecord[]> {
    const query = trx
      ? trx<WalletTransactionRecord>("wallet_transactions")
      : this.knexInstance<WalletTransactionRecord>("wallet_transactions");

    return query
      .where("wallet_id", data.walletId)
      .orderBy("created_at", "desc")
      .limit(data.limit)
      .offset(data.offset);
  }

  public async countByWalletId(
    trx: Knex.Transaction | null,
    walletId: string
  ): Promise<number> {
    const query = trx
      ? trx<WalletTransactionRecord>("wallet_transactions")
      : this.knexInstance<WalletTransactionRecord>("wallet_transactions");

    const result = await query.where("wallet_id", walletId).count({ total: "id" }).first();
    const total = result?.total;

    return typeof total === "number" ? total : Number(total ?? 0);
  }
}
