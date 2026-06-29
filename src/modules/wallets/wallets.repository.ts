import type { Knex } from "knex";

import { db } from "@/database/knex";
import type {
  CreateWalletData,
  WalletRecord,
} from "@/modules/wallets/wallets.types";

export class WalletsRepository {
  public constructor(private readonly knexInstance: Knex = db) {}

  public async findByAccountNumber(
    accountNumber: string,
    trx?: Knex.Transaction
  ): Promise<WalletRecord | null> {
    const query = trx
      ? trx<WalletRecord>("wallets")
      : this.knexInstance<WalletRecord>("wallets");

    const wallet = await query.where("account_number", accountNumber).first();

    return wallet ?? null;
  }

  public async create(trx: Knex.Transaction, wallet: CreateWalletData): Promise<void> {
    await trx<WalletRecord>("wallets").insert(wallet);
  }
}
