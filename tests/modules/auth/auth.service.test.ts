import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { db } from "@/database/knex";
import { AuthRepository } from "@/modules/auth/auth.repository";
import { AuthService } from "@/modules/auth/auth.service";
import type { UpdateAuthTokenData } from "@/modules/auth/auth.types";
import { KarmaRepository } from "@/modules/karma/karma.repository";
import { KarmaService } from "@/modules/karma/karma.service";
import { WalletRepository } from "@/modules/wallets/wallet.repository";
import { AppError } from "@/utils/app.error";

import {
  buildUserRecord,
  buildWalletRecord,
  createAuthRepositoryMock,
  createKarmaRepositoryMock,
  createKarmaServiceMock,
  createWalletRepositoryMock,
  fakeTrx,
  signinPayload,
  signupPayload,
} from "./auth.test.helpers";
import type {
  AuthRepositoryMock,
  DbTransactionMock,
  KarmaRepositoryMock,
  KarmaServiceMock,
  TransactionCallback,
  WalletRepositoryMock,
} from "./auth.test.helpers";

vi.mock("@/database/knex", () => ({
  db: {
    transaction: vi.fn(),
  },
  closeDatabase: vi.fn(),
}));

describe("AuthService", () => {
  let authRepository: AuthRepositoryMock;
  let walletRepository: WalletRepositoryMock;
  let karmaRepository: KarmaRepositoryMock;
  let karmaService: KarmaServiceMock;
  let service: AuthService;
  let transactionMock: DbTransactionMock;

  beforeEach(() => {
    authRepository = createAuthRepositoryMock();
    walletRepository = createWalletRepositoryMock();
    karmaRepository = createKarmaRepositoryMock();
    karmaService = createKarmaServiceMock();

    transactionMock = db.transaction as unknown as DbTransactionMock;
    transactionMock.mockImplementation(<T>(callback: TransactionCallback<T>) =>
      callback(fakeTrx)
    );

    service = new AuthService(
      authRepository as unknown as AuthRepository,
      walletRepository as unknown as WalletRepository,
      karmaRepository as unknown as KarmaRepository,
      karmaService as unknown as KarmaService
    );
  });

  it("signs up a user, creates a wallet, and records a clean Karma check", async () => {
    authRepository.findByUniqueFields.mockResolvedValue(null);
    walletRepository.findByAccountNumber.mockResolvedValue(null);
    karmaService.checkIdentity.mockResolvedValue({ isBlacklisted: false });

    const result = await service.signup(signupPayload);

    expect(authRepository.findByUniqueFields).toHaveBeenCalledWith(
      signupPayload.email,
      signupPayload.phone_number,
      signupPayload.bvn
    );
    expect(karmaService.checkIdentity).toHaveBeenCalledWith(signupPayload.bvn);
    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(walletRepository.findByAccountNumber).toHaveBeenCalledWith(
      fakeTrx,
      expect.stringMatching(/^\d{10}$/)
    );
    expect(authRepository.createUser).toHaveBeenCalledWith(
      fakeTrx,
      expect.objectContaining({
        first_name: signupPayload.first_name,
        last_name: signupPayload.last_name,
        email: signupPayload.email,
        phone_number: signupPayload.phone_number,
        bvn: signupPayload.bvn,
        auth_token: expect.stringMatching(/^demo_[a-f0-9]{64}$/) as string,
      })
    );
    const createdUser = authRepository.createUser.mock.calls[0]?.[1];
    expect(createdUser?.password_hash).toBeDefined();
    expect(createdUser?.password_hash).not.toBe(signupPayload.password);
    expect(createdUser).not.toHaveProperty("password");
    expect(walletRepository.create).toHaveBeenCalledWith(
      fakeTrx,
      expect.objectContaining({
        balance: 0,
        currency: "NGN",
        account_number: expect.stringMatching(/^\d{10}$/) as string,
      })
    );
    expect(karmaRepository.createCheck).toHaveBeenCalledWith(
      fakeTrx,
      expect.objectContaining({
        identity_type: "bvn",
        identity_value: signupPayload.bvn,
        is_blacklisted: false,
      })
    );
    expect(result.user).toMatchObject({
      first_name: signupPayload.first_name,
      last_name: signupPayload.last_name,
      email: signupPayload.email,
      phone_number: signupPayload.phone_number,
    });
    expect(result.wallet).toMatchObject({
      balance: 0,
      currency: "NGN",
    });
    expect(result.wallet.account_number).toMatch(/^\d{10}$/);
    expect(result.token).toMatch(/^demo_[a-f0-9]{64}$/);
  });

  it("generates auth tokens with the expected format", () => {
    expect(service.generateToken()).toMatch(/^demo_[a-f0-9]{64}$/);
  });

  it("generates a different auth token on each call", () => {
    const firstToken = service.generateToken();
    const secondToken = service.generateToken();

    expect(firstToken).not.toBe(secondToken);
  });

  it("rejects signup when a user already exists", async () => {
    authRepository.findByUniqueFields.mockResolvedValue(await buildUserRecord());

    await expect(service.signup(signupPayload)).rejects.toMatchObject({
      statusCode: 409,
      errorCode: "USER_ALREADY_EXISTS",
    } satisfies Partial<AppError>);

    expect(karmaService.checkIdentity).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("rejects blacklisted users and records the failed Karma check outside signup transaction", async () => {
    authRepository.findByUniqueFields.mockResolvedValue(null);
    karmaService.checkIdentity.mockResolvedValue({ isBlacklisted: true });

    await expect(service.signup(signupPayload)).rejects.toMatchObject({
      statusCode: 403,
      errorCode: "KARMA_BLACKLISTED_USER",
    } satisfies Partial<AppError>);

    expect(karmaRepository.createCheck).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        user_id: null,
        identity_type: "bvn",
        identity_value: signupPayload.bvn,
        is_blacklisted: true,
      })
    );
    expect(transactionMock).not.toHaveBeenCalled();
    expect(authRepository.createUser).not.toHaveBeenCalled();
    expect(walletRepository.create).not.toHaveBeenCalled();
  });

  it("propagates Karma service errors during signup", async () => {
    const karmaError = new Error("Karma service unavailable");
    authRepository.findByUniqueFields.mockResolvedValue(null);
    karmaService.checkIdentity.mockRejectedValue(karmaError);

    await expect(service.signup(signupPayload)).rejects.toBe(karmaError);

    expect(transactionMock).not.toHaveBeenCalled();
    expect(karmaRepository.createCheck).not.toHaveBeenCalled();
    expect(authRepository.createUser).not.toHaveBeenCalled();
    expect(walletRepository.create).not.toHaveBeenCalled();
  });

  it("propagates user creation failures and stops the signup transaction flow", async () => {
    const createUserError = new Error("Failed to create user");
    authRepository.findByUniqueFields.mockResolvedValue(null);
    walletRepository.findByAccountNumber.mockResolvedValue(null);
    karmaService.checkIdentity.mockResolvedValue({ isBlacklisted: false });
    authRepository.createUser.mockRejectedValue(createUserError);

    await expect(service.signup(signupPayload)).rejects.toBe(createUserError);

    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(authRepository.createUser).toHaveBeenCalledTimes(1);
    expect(walletRepository.create).not.toHaveBeenCalled();
    expect(karmaRepository.createCheck).not.toHaveBeenCalled();
  });

  it("propagates wallet creation failures and stops before recording the transactional Karma check", async () => {
    const createWalletError = new Error("Failed to create wallet");
    authRepository.findByUniqueFields.mockResolvedValue(null);
    walletRepository.findByAccountNumber.mockResolvedValue(null);
    karmaService.checkIdentity.mockResolvedValue({ isBlacklisted: false });
    walletRepository.create.mockRejectedValue(createWalletError);

    await expect(service.signup(signupPayload)).rejects.toBe(createWalletError);

    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(authRepository.createUser).toHaveBeenCalledTimes(1);
    expect(walletRepository.create).toHaveBeenCalledTimes(1);
    expect(karmaRepository.createCheck).not.toHaveBeenCalled();
  });

  it("propagates transactional Karma check failures after creating the user and wallet", async () => {
    const createKarmaCheckError = new Error("Failed to record Karma check");
    authRepository.findByUniqueFields.mockResolvedValue(null);
    walletRepository.findByAccountNumber.mockResolvedValue(null);
    karmaService.checkIdentity.mockResolvedValue({ isBlacklisted: false });
    karmaRepository.createCheck.mockRejectedValue(createKarmaCheckError);

    await expect(service.signup(signupPayload)).rejects.toBe(createKarmaCheckError);

    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(authRepository.createUser).toHaveBeenCalledTimes(1);
    expect(walletRepository.create).toHaveBeenCalledTimes(1);
    expect(karmaRepository.createCheck).toHaveBeenCalledWith(
      fakeTrx,
      expect.objectContaining({
        identity_type: "bvn",
        identity_value: signupPayload.bvn,
        is_blacklisted: false,
      })
    );
  });

  it("retries account number generation when a generated account number already exists", async () => {
    authRepository.findByUniqueFields.mockResolvedValue(null);
    walletRepository.findByAccountNumber
      .mockResolvedValueOnce(buildWalletRecord())
      .mockResolvedValueOnce(null);
    karmaService.checkIdentity.mockResolvedValue({ isBlacklisted: false });

    const result = await service.signup(signupPayload);

    expect(walletRepository.findByAccountNumber).toHaveBeenCalledTimes(2);
    expect(result.wallet.account_number).toBe(
      walletRepository.findByAccountNumber.mock.calls[1]?.[1]
    );
    expect(result.wallet.account_number).toMatch(/^\d{10}$/);
  });

  it("fails gracefully after the account number retry limit is exhausted", async () => {
    authRepository.findByUniqueFields.mockResolvedValue(null);
    walletRepository.findByAccountNumber.mockResolvedValue(buildWalletRecord());
    karmaService.checkIdentity.mockResolvedValue({ isBlacklisted: false });

    await expect(service.signup(signupPayload)).rejects.toMatchObject({
      statusCode: 500,
      errorCode: "INTERNAL_ERROR",
      message: "Unable to generate wallet account number.",
    } satisfies Partial<AppError>);

    expect(walletRepository.findByAccountNumber).toHaveBeenCalledTimes(10);
    expect(authRepository.createUser).not.toHaveBeenCalled();
    expect(walletRepository.create).not.toHaveBeenCalled();
    expect(karmaRepository.createCheck).not.toHaveBeenCalled();
  });

  it("signs in a user and rotates the auth token", async () => {
    const user = await buildUserRecord();
    authRepository.findByEmail.mockResolvedValue(user);

    const result = await service.signin(signinPayload);

    expect(authRepository.findByEmail).toHaveBeenCalledWith(signinPayload.email);
    expect(authRepository.updateAuthToken).toHaveBeenCalledWith(
      null,
      expect.objectContaining<UpdateAuthTokenData>({
        userId: user.id,
        authToken: expect.stringMatching(/^demo_[a-f0-9]{64}$/) as string,
      })
    );
    expect(result.user).toEqual({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone_number: user.phone_number,
    });
    expect(result.token).toMatch(/^demo_[a-f0-9]{64}$/);
    expect(result.token).not.toBe(user.auth_token);
  });

  it("generates a different token on each signin", async () => {
    const user = await buildUserRecord();
    authRepository.findByEmail.mockResolvedValue(user);

    const firstResult = await service.signin(signinPayload);
    const secondResult = await service.signin(signinPayload);

    expect(firstResult.token).not.toBe(secondResult.token);
    expect(authRepository.updateAuthToken).toHaveBeenCalledTimes(2);
  });

  it("rejects signin when the email does not exist", async () => {
    authRepository.findByEmail.mockResolvedValue(null);

    await expect(service.signin(signinPayload)).rejects.toMatchObject({
      statusCode: 401,
      errorCode: "INVALID_CREDENTIALS",
    } satisfies Partial<AppError>);

    expect(authRepository.updateAuthToken).not.toHaveBeenCalled();
  });

  it("rejects signin when the password is incorrect", async () => {
    authRepository.findByEmail.mockResolvedValue(await buildUserRecord());

    await expect(
      service.signin({
        ...signinPayload,
        password: "WrongPassword123",
      })
    ).rejects.toMatchObject({
      statusCode: 401,
      errorCode: "INVALID_CREDENTIALS",
    } satisfies Partial<AppError>);

    expect(authRepository.updateAuthToken).not.toHaveBeenCalled();
  });

  it("propagates auth token update failures during signin", async () => {
    const updateTokenError = new Error("Failed to update auth token");
    authRepository.findByEmail.mockResolvedValue(await buildUserRecord());
    authRepository.updateAuthToken.mockRejectedValue(updateTokenError);

    await expect(service.signin(signinPayload)).rejects.toBe(updateTokenError);

    expect(authRepository.updateAuthToken).toHaveBeenCalledTimes(1);
  });

  it("propagates repository errors while finding a user by email", async () => {
    const findUserError = new Error("Failed to find user");
    authRepository.findByEmail.mockRejectedValue(findUserError);

    await expect(service.signin(signinPayload)).rejects.toBe(findUserError);

    expect(authRepository.updateAuthToken).not.toHaveBeenCalled();
  });
});
