import { env } from "@/config/env";
import { AppError } from "@/utils/app.error";
import type { KarmaLookupResult } from "@/modules/karma/karma.types";

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const hasKarmaData = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    "karma_identity" in value ||
    "default_date" in value ||
    "reason" in value ||
    Object.keys(value).length > 0
  );
};

const isBlacklistedResponse = (responseBody: Record<string, unknown>): boolean => {
  if (!("data" in responseBody)) {
    return false;
  }

  return hasKarmaData(responseBody.data);
};

export class KarmaService {
  public async checkIdentity(identityValue: string): Promise<KarmaLookupResult> {
    if (!env.adjutor.apiKey) {
      throw new AppError(
        "Blacklist check is not configured.",
        503,
        "KARMA_CHECK_NOT_CONFIGURED"
      );
    }

    const response = await fetch(
      `${env.adjutor.baseUrl}/verification/karma/${encodeURIComponent(identityValue)}`,
      {
        headers: {
          Authorization: `Bearer ${env.adjutor.apiKey}`,
          Accept: "application/json",
        },
      }
    );

    if (response.status === 404) {
      return {
        isBlacklisted: false,
      };
    }

    const responseBody: unknown = await response.json();
    const responseBodyRecord = isRecord(responseBody) ? responseBody : null;

    if (!response.ok) {
      throw new AppError(
        "Unable to complete blacklist check at this time.",
        502,
        "KARMA_CHECK_FAILED"
      );
    }

    return {
      isBlacklisted: responseBodyRecord ? isBlacklistedResponse(responseBodyRecord) : false,
    };
  }
}
