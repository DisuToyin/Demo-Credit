import { vi } from "vitest";
import type { MockedFunction } from "vitest";

export const identityValue = "12345678901";
export const adjutorBaseUrl = "https://adjutor.test/v2";
export const adjutorApiKey = "test-adjutor-api-key";

export type FetchMock = MockedFunction<typeof fetch>;

type FetchResponse = Awaited<ReturnType<typeof fetch>>;

export const createFetchResponse = (
  status: number,
  body: unknown
): FetchResponse =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  }) as unknown as FetchResponse;

export const createFetchMock = (): FetchMock => vi.fn() as unknown as FetchMock;
