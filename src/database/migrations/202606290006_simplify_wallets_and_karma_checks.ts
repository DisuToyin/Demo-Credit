import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasWalletStatus = await knex.schema.hasColumn("wallets", "status");
  const hasKarmaProvider = await knex.schema.hasColumn("karma_checks", "provider");
  const hasKarmaProviderResponse = await knex.schema.hasColumn(
    "karma_checks",
    "provider_response"
  );

  if (hasWalletStatus) {
    await knex.schema.alterTable("wallets", (table) => {
      table.dropIndex("status", "idx_wallets_status");
      table.dropColumn("status");
    });
  }

  if (hasKarmaProvider || hasKarmaProviderResponse) {
    await knex.schema.alterTable("karma_checks", (table) => {
      if (hasKarmaProvider) {
        table.dropColumn("provider");
      }

      if (hasKarmaProviderResponse) {
        table.dropColumn("provider_response");
      }
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasWalletStatus = await knex.schema.hasColumn("wallets", "status");
  const hasKarmaProvider = await knex.schema.hasColumn("karma_checks", "provider");
  const hasKarmaProviderResponse = await knex.schema.hasColumn(
    "karma_checks",
    "provider_response"
  );

  if (!hasWalletStatus) {
    await knex.schema.alterTable("wallets", (table) => {
      table
        .enu("status", ["active", "frozen", "closed"])
        .notNullable()
        .defaultTo("active");
      table.index("status", "idx_wallets_status");
    });
  }

  if (!hasKarmaProvider || !hasKarmaProviderResponse) {
    await knex.schema.alterTable("karma_checks", (table) => {
      if (!hasKarmaProvider) {
        table.string("provider", 50).notNullable().defaultTo("lendsqr_adjutor");
      }

      if (!hasKarmaProviderResponse) {
        table.json("provider_response").nullable();
      }
    });
  }
}
