import { randomBytes, randomInt, randomUUID } from "node:crypto";

import { db } from "@/database/knex";
import { AuthRepository } from "@/modules/auth/auth.repository";
import { KarmaRepository } from "@/modules/karma/karma.repository";
import { KarmaService } from "@/modules/karma/karma.service";
import type {
  AuthenticatedUser,
  CreateUserData,
  SigninRequestBody,
  SigninResult,
  SignupRequestBody,
  SignupResult,
} from "@/modules/auth/auth.types";
import type { CreateKarmaCheckData } from "@/modules/karma/karma.types";
import { WalletsRepository } from "@/modules/wallets/wallets.repository";
import type { CreateWalletData } from "@/modules/wallets/wallets.types";
import { AppError } from "@/utils/app.error";
import { hashPassword, verifyPassword } from "@/utils/password";

const TOKEN_PREFIX = "demo";
const TOKEN_BYTE_LENGTH = 32;
const ACCOUNT_NUMBER_LENGTH = 10;
const ACCOUNT_NUMBER_RETRY_LIMIT = 10;

const generateAccountNumberCandidate = (): string => {
  let accountNumber = "";

  for (let index = 0; index < ACCOUNT_NUMBER_LENGTH; index += 1) {
    accountNumber += String(randomInt(0, 10));
  }

  return accountNumber;
};

export class AuthService {
  public constructor(
    private readonly authRepository = new AuthRepository(),
    private readonly walletsRepository = new WalletsRepository(),
    private readonly karmaRepository = new KarmaRepository(),
    private readonly karmaService = new KarmaService()
  ) {}

  public generateToken(): string {
    return `${TOKEN_PREFIX}_${randomBytes(TOKEN_BYTE_LENGTH).toString("hex")}`;
  }

  public async signup(payload: SignupRequestBody): Promise<SignupResult> {
    const existingUser = await this.authRepository.findByUniqueFields(
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
        this.buildKarmaCheck(null, payload.bvn, true)
      );

      throw new AppError(
        "This user cannot be onboarded.",
        403,
        "KARMA_BLACKLISTED_USER"
      );
    }

    const passwordHash = await hashPassword(payload.password);
    const authToken = this.generateToken();
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
        auth_token: authToken,
      };

      const wallet: CreateWalletData = {
        id: walletId,
        user_id: userId,
        account_number: accountNumber,
        balance: 0,
        currency: "NGN",
      };

      await this.authRepository.createUser(trx, user);
      await this.walletsRepository.create(trx, wallet);
      await this.karmaRepository.createCheck(
        trx,
        this.buildKarmaCheck(userId, payload.bvn, false)
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
        },
        token: user.auth_token,
      };
    });
  }

  public async signin(payload: SigninRequestBody): Promise<SigninResult> {
    const user = await this.authRepository.findByEmail(payload.email);

    if (!user) {
      throw new AppError("Invalid email or password.", 401, "INVALID_CREDENTIALS");
    }

    const passwordIsValid = await verifyPassword(payload.password, user.password_hash);

    if (!passwordIsValid) {
      throw new AppError("Invalid email or password.", 401, "INVALID_CREDENTIALS");
    }

    const token = this.generateToken();

    await this.authRepository.updateAuthToken(null, {
      userId: user.id,
      authToken: token,
    });

    return {
      user: this.toAuthenticatedUser(user),
      token,
    };
  }

  private toAuthenticatedUser(user: AuthenticatedUser): AuthenticatedUser {
    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone_number: user.phone_number,
    };
  }

  private async generateUniqueAccountNumber(
    trx: Parameters<WalletsRepository["findByAccountNumber"]>[0]
  ): Promise<string> {
    for (let attempt = 0; attempt < ACCOUNT_NUMBER_RETRY_LIMIT; attempt += 1) {
      const accountNumber = generateAccountNumberCandidate();
      const existingWallet = await this.walletsRepository.findByAccountNumber(
        trx,
        accountNumber
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
    isBlacklisted: boolean
  ): CreateKarmaCheckData {
    return {
      id: randomUUID(),
      user_id: userId,
      identity_type: "bvn",
      identity_value: bvn,
      is_blacklisted: isBlacklisted,
    };
  }
}
