import type { Knex } from "knex";

import { db } from "@/database/knex";
import type {
  CreateKarmaCheckData,
  CreateKarmaCheckInsert,
} from "@/modules/karma/karma.types";

export class KarmaRepository {
  public constructor(private readonly knexInstance: Knex = db) {}

  public async createCheck(
    trx: Knex.Transaction | null,
    karmaCheck: CreateKarmaCheckData
  ): Promise<void> {
    const insertData: CreateKarmaCheckInsert = {
      ...karmaCheck,
      provider_response: karmaCheck.provider_response
        ? JSON.stringify(karmaCheck.provider_response)
        : null,
    };

    const query = trx
      ? trx<CreateKarmaCheckInsert>("karma_checks")
      : this.knexInstance<CreateKarmaCheckInsert>("karma_checks");

    await query.insert(insertData);
  }
}
