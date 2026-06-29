export type KarmaLookupResult = {
  isBlacklisted: boolean;
  providerResponse: Record<string, unknown> | null;
};

export type CreateKarmaCheckData = {
  id: string;
  user_id: string | null;
  identity_type: string;
  identity_value: string;
  is_blacklisted: boolean;
  provider: string;
  provider_response: Record<string, unknown> | null;
};

export type CreateKarmaCheckInsert = Omit<CreateKarmaCheckData, "provider_response"> & {
  provider_response: string | null;
};
