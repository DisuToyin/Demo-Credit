import type { Knex } from "knex";

import { db } from "@/database/knex";
import type {
  CreateWalletData,
  UpdateWalletBalanceData,
  WalletRecord,
} from "@/modules/wallets/wallets.types";

export class WalletsRepository {
  public constructor(private readonly knexInstance: Knex = db) {}

  public async findByAccountNumber(
    trx: Knex.Transaction | null,
    accountNumber: string
  ): Promise<WalletRecord | null> {
    const query = trx
      ? trx<WalletRecord>("wallets")
      : this.knexInstance<WalletRecord>("wallets");

    const wallet = await query.where("account_number", accountNumber).first();

    return wallet ?? null;
  }

  public async findByUserId(
    trx: Knex.Transaction | null,
    userId: string
  ): Promise<WalletRecord | null> {
    const query = trx
      ? trx<WalletRecord>("wallets")
      : this.knexInstance<WalletRecord>("wallets");

    const wallet = await query.where("user_id", userId).first();

    return wallet ?? null;
  }

  public async findByUserIdForUpdate(
    trx: Knex.Transaction,
    userId: string
  ): Promise<WalletRecord | null> {
    const wallet = await trx<WalletRecord>("wallets")
      .where("user_id", userId)
      .forUpdate()
      .first();

    return wallet ?? null;
  }

  public async create(trx: Knex.Transaction, wallet: CreateWalletData): Promise<void> {
    await trx<WalletRecord>("wallets").insert(wallet);
  }

  public async updateBalance(
    trx: Knex.Transaction,
    data: UpdateWalletBalanceData
  ): Promise<void> {
    await trx<WalletRecord>("wallets").where("id", data.walletId).update({
      balance: data.balance,
    });
  }
}
