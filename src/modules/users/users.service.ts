import { randomInt, randomUUID } from "node:crypto";

import { db } from "@/database/knex";
import { KarmaRepository } from "@/modules/karma/karma.repository";
import { KarmaService } from "@/modules/karma/karma.service";
import { UsersRepository } from "@/modules/users/users.repository";
import { WalletsRepository } from "@/modules/wallets/wallets.repository";
import { AppError } from "@/utils/app.error";
import { hashPassword } from "@/utils/password";
import type { CreateKarmaCheckData } from "@/modules/karma/karma.types";
import type {
  CreateUserData,
  SignupRequestBody,
  SignupResult,
} from "@/modules/users/users.types";
import type { CreateWalletData } from "@/modules/wallets/wallets.types";

const ACCOUNT_NUMBER_LENGTH = 10;
const ACCOUNT_NUMBER_RETRY_LIMIT = 10;

const generateAccountNumberCandidate = (): string => {
  let accountNumber = "";

  for (let index = 0; index < ACCOUNT_NUMBER_LENGTH; index += 1) {
    accountNumber += String(randomInt(0, 10));
  }

  return accountNumber;
};

export class UsersService {
  public constructor(
    private readonly usersRepository = new UsersRepository(),
    private readonly walletsRepository = new WalletsRepository(),
    private readonly karmaRepository = new KarmaRepository(),
    private readonly karmaService = new KarmaService()
  ) {}

  public async signup(payload: SignupRequestBody): Promise<SignupResult> {
    const existingUser = await this.usersRepository.findByUniqueFields(
      payload.email,
      payload.phone_number,
      payload.bvn
    );

    if (existingUser) {
      throw new AppError(
        "A user with this email, phone number, or BVN already exists.",
        409,
        "USER_ALREADY_EXISTS"
      );
    }

    const karmaResult = await this.karmaService.checkIdentity(payload.bvn);

    if (karmaResult.isBlacklisted) {
      await this.karmaRepository.createCheck(
        null,
        this.buildKarmaCheck(null, payload.bvn, true, karmaResult.providerResponse)
      );

      throw new AppError(
        "This user cannot be onboarded.",
        403,
        "KARMA_BLACKLISTED_USER"
      );
    }

    const passwordHash = await hashPassword(payload.password);
    const userId = randomUUID();
    const walletId = randomUUID();

    return db.transaction(async (trx) => {
      const accountNumber = await this.generateUniqueAccountNumber(trx);

      const user: CreateUserData = {
        id: userId,
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        phone_number: payload.phone_number,
        bvn: payload.bvn,
        password_hash: passwordHash,
      };

      const wallet: CreateWalletData = {
        id: walletId,
        user_id: userId,
        account_number: accountNumber,
        balance: 0,
        currency: "NGN",
        status: "active",
      };

      await this.usersRepository.createUser(trx, user);
      await this.walletsRepository.create(trx, wallet);
      await this.karmaRepository.createCheck(
        trx,
        this.buildKarmaCheck(userId, payload.bvn, false, karmaResult.providerResponse),
      );

      return {
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone_number: user.phone_number,
        },
        wallet: {
          id: wallet.id,
          account_number: wallet.account_number,
          balance: wallet.balance,
          currency: wallet.currency,
          status: wallet.status,
        },
      };
    });
  }

  private async generateUniqueAccountNumber(
    trx: Parameters<WalletsRepository["findByAccountNumber"]>[1]
  ): Promise<string> {
    for (let attempt = 0; attempt < ACCOUNT_NUMBER_RETRY_LIMIT; attempt += 1) {
      const accountNumber = generateAccountNumberCandidate();
      const existingWallet = await this.walletsRepository.findByAccountNumber(
        accountNumber,
        trx
      );

      if (!existingWallet) {
        return accountNumber;
      }
    }

    throw new AppError("Unable to generate wallet account number.", 500);
  }

  private buildKarmaCheck(
    userId: string | null,
    bvn: string,
    isBlacklisted: boolean,
    providerResponse: Record<string, unknown> | null
  ): CreateKarmaCheckData {
    return {
      id: randomUUID(),
      user_id: userId,
      identity_type: "bvn",
      identity_value: bvn,
      is_blacklisted: isBlacklisted,
      provider: "lendsqr_adjutor",
      provider_response: providerResponse,
    };
  }
}
