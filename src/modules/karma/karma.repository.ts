import type { Knex } from "knex";

import { db } from "@/database/knex";
import type { CreateKarmaCheckData } from "@/modules/karma/karma.types";

export class KarmaRepository {
  public constructor(private readonly knexInstance: Knex = db) {}

  public async createCheck(
    trx: Knex.Transaction | null,
    karmaCheck: CreateKarmaCheckData
  ): Promise<void> {
    const query = trx
      ? trx<CreateKarmaCheckData>("karma_checks")
      : this.knexInstance<CreateKarmaCheckData>("karma_checks");

    await query.insert(karmaCheck);
  }
}
