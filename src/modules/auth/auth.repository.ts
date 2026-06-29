import type { Knex } from "knex";

import { db } from "@/database/knex";
import type {
  AuthenticatedUser,
  CreateUserData,
  UpdateAuthTokenData,
  UserRecord,
} from "@/modules/auth/auth.types";

export class AuthRepository {
  public constructor(private readonly knexInstance: Knex = db) {}

  public async findUserByToken(authToken: string): Promise<AuthenticatedUser | null> {
    const user = await this.knexInstance<UserRecord>("users")
      .where("auth_token", authToken)
      .first();

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone_number: user.phone_number,
    };
  }

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

  public async findByEmail(email: string): Promise<UserRecord | null> {
    const user = await this.knexInstance<UserRecord>("users")
      .where("email", email)
      .first();

    return user ?? null;
  }

  public async createUser(trx: Knex.Transaction, user: CreateUserData): Promise<void> {
    await trx<UserRecord>("users").insert(user);
  }

  public async updateAuthToken(
    trx: Knex.Transaction | null,
    data: UpdateAuthTokenData
  ): Promise<void> {
    const query = trx
      ? trx<UserRecord>("users")
      : this.knexInstance<UserRecord>("users");

    await query.where("id", data.userId).update({
      auth_token: data.authToken,
    });
  }
}
