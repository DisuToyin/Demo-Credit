import type { Knex } from "knex";
import { vi } from "vitest";
import type { MockedFunction } from "vitest";

import { AuthRepository } from "@/modules/auth/auth.repository";
import type {
  SigninRequestBody,
  SignupRequestBody,
  UserRecord,
} from "@/modules/auth/auth.types";
import { KarmaRepository } from "@/modules/karma/karma.repository";
import { KarmaService } from "@/modules/karma/karma.service";
import { WalletRepository } from "@/modules/wallets/wallet.repository";
import type { WalletRecord } from "@/modules/wallets/wallet.types";
import { hashPassword } from "@/utils/password";

export type TransactionCallback<T> = (trx: Knex.Transaction) => Promise<T>;

export type DbTransactionMock = MockedFunction<
  <T>(callback: TransactionCallback<T>) => Promise<T>
>;

export type AuthRepositoryMock = {
  findByUniqueFields: MockedFunction<AuthRepository["findByUniqueFields"]>;
  createUser: MockedFunction<AuthRepository["createUser"]>;
  findByEmail: MockedFunction<AuthRepository["findByEmail"]>;
  updateAuthToken: MockedFunction<AuthRepository["updateAuthToken"]>;
};

export type WalletRepositoryMock = {
  findByAccountNumber: MockedFunction<WalletRepository["findByAccountNumber"]>;
  create: MockedFunction<WalletRepository["create"]>;
};

export type KarmaRepositoryMock = {
  createCheck: MockedFunction<KarmaRepository["createCheck"]>;
};

export type KarmaServiceMock = {
  checkIdentity: MockedFunction<KarmaService["checkIdentity"]>;
};

export const fakeTrx = {
  name: "fake-transaction",
} as unknown as Knex.Transaction;

export const signupPayload: SignupRequestBody = {
  first_name: "Ada",
  last_name: "Okafor",
  email: "ada.okafor@example.com",
  phone_number: "08012345678",
  bvn: "12345678901",
  password: "Password123",
};

export const signinPayload: SigninRequestBody = {
  email: signupPayload.email,
  password: signupPayload.password,
};

export const buildUserRecord = async (
  overrides: Partial<UserRecord> = {}
): Promise<UserRecord> => ({
  id: "user-id",
  first_name: signupPayload.first_name,
  last_name: signupPayload.last_name,
  email: signupPayload.email,
  phone_number: signupPayload.phone_number,
  bvn: signupPayload.bvn,
  password_hash: await hashPassword(signupPayload.password),
  auth_token: "demo_existing_token",
  created_at: new Date("2026-06-30T00:00:00.000Z"),
  updated_at: new Date("2026-06-30T00:00:00.000Z"),
  ...overrides,
});

export const buildWalletRecord = (
  overrides: Partial<WalletRecord> = {}
): WalletRecord => ({
  id: "wallet-id",
  user_id: "user-id",
  account_number: "1234567890",
  balance: 0,
  currency: "NGN",
  created_at: new Date("2026-06-30T00:00:00.000Z"),
  updated_at: new Date("2026-06-30T00:00:00.000Z"),
  ...overrides,
});

export const createAuthRepositoryMock = (): AuthRepositoryMock => ({
  findByUniqueFields: vi.fn(),
  createUser: vi.fn(),
  findByEmail: vi.fn(),
  updateAuthToken: vi.fn(),
});

export const createWalletRepositoryMock = (): WalletRepositoryMock => ({
  findByAccountNumber: vi.fn(),
  create: vi.fn(),
});

export const createKarmaRepositoryMock = (): KarmaRepositoryMock => ({
  createCheck: vi.fn(),
});

export const createKarmaServiceMock = (): KarmaServiceMock => ({
  checkIdentity: vi.fn(),
});
