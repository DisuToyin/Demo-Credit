import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { env } from "@/config/env";
import { KarmaService } from "@/modules/karma/karma.service";
import { AppError } from "@/utils/app.error";

import {
  adjutorApiKey,
  adjutorBaseUrl,
  createFetchMock,
  createFetchResponse,
  identityValue,
} from "./karma.test.helpers";
import type { FetchMock } from "./karma.test.helpers";

describe("KarmaService", () => {
  const originalFetch = globalThis.fetch;
  const originalAdjutorBaseUrl = env.adjutor.baseUrl;
  const originalAdjutorApiKey = env.adjutor.apiKey;

  let fetchMock: FetchMock;
  let service: KarmaService;

  beforeEach(() => {
    fetchMock = createFetchMock();
    globalThis.fetch = fetchMock;
    env.adjutor.baseUrl = adjutorBaseUrl;
    env.adjutor.apiKey = adjutorApiKey;
    service = new KarmaService();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    env.adjutor.baseUrl = originalAdjutorBaseUrl;
    env.adjutor.apiKey = originalAdjutorApiKey;
  });

  it("returns blacklisted when Adjutor returns Karma data", async () => {
    fetchMock.mockResolvedValue(
      createFetchResponse(200, {
        data: {
          karma_identity: identityValue,
          reason: "Fraud report",
        },
      })
    );

    const result = await service.checkIdentity(identityValue);

    expect(result).toEqual({ isBlacklisted: true });
  });

  it("returns not blacklisted when Adjutor returns 404", async () => {
    fetchMock.mockResolvedValue(createFetchResponse(404, {}));

    const result = await service.checkIdentity(identityValue);

    expect(result).toEqual({ isBlacklisted: false });
  });

  it("returns not blacklisted when Adjutor returns no Karma data", async () => {
    fetchMock.mockResolvedValue(
      createFetchResponse(200, {
        data: null,
      })
    );

    const result = await service.checkIdentity(identityValue);

    expect(result).toEqual({ isBlacklisted: false });
  });

  it("sends the correct Adjutor URL and authorization headers", async () => {
    fetchMock.mockResolvedValue(createFetchResponse(404, {}));

    await service.checkIdentity("123 456/789");

    expect(fetchMock).toHaveBeenCalledWith(
      `${adjutorBaseUrl}/verification/karma/${encodeURIComponent("123 456/789")}`,
      {
        headers: {
          Authorization: `Bearer ${adjutorApiKey}`,
          Accept: "application/json",
        },
      }
    );
  });

  it("fails closed when the Adjutor API key is missing", async () => {
    env.adjutor.apiKey = "";

    await expect(service.checkIdentity(identityValue)).rejects.toMatchObject({
      statusCode: 503,
      errorCode: "KARMA_CHECK_NOT_CONFIGURED",
    } satisfies Partial<AppError>);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws when Adjutor returns an unexpected non-success response", async () => {
    fetchMock.mockResolvedValue(
      createFetchResponse(500, {
        message: "Internal server error",
      })
    );

    await expect(service.checkIdentity(identityValue)).rejects.toMatchObject({
      statusCode: 502,
      errorCode: "KARMA_CHECK_FAILED",
    } satisfies Partial<AppError>);
  });

  it("propagates network errors from Adjutor", async () => {
    const networkError = new Error("Network unavailable");
    fetchMock.mockRejectedValue(networkError);

    await expect(service.checkIdentity(identityValue)).rejects.toBe(networkError);
  });
});
