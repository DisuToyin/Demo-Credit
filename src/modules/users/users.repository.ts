import type { Knex } from "knex";

import { db } from "@/database/knex";
import type {
  CreateUserData,
  UserRecord,
} from "@/modules/users/users.types";

export class UsersRepository {
  public constructor(private readonly knexInstance: Knex = db) {}

  public async findByUniqueFields(
    email: string,
    phoneNumber: string,
    bvn: string
  ): Promise<UserRecord | null> {
    const user = await this.knexInstance<UserRecord>("users")
      .where("email", email)
      .orWhere("phone_number", phoneNumber)
      .orWhere("bvn", bvn)
      .first();

    return user ?? null;
  }

  public async createUser(trx: Knex.Transaction, user: CreateUserData): Promise<void> {
    await trx<UserRecord>("users").insert(user);
  }
}
