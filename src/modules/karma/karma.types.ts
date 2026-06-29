export type KarmaLookupResult = {
  isBlacklisted: boolean;
};

export type CreateKarmaCheckData = {
  id: string;
  user_id: string | null;
  identity_type: string;
  identity_value: string;
  is_blacklisted: boolean;
};
