import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("wallets", (table) => {
    table.string("id", 36).primary();
    table.string("user_id", 36).notNullable();
    table.string("account_number", 10).notNullable().unique();
    table.bigInteger("balance").unsigned().notNullable().defaultTo(0);
    table.string("currency", 3).notNullable().defaultTo("NGN");
    table.enu("status", ["active", "frozen", "closed"]).notNullable().defaultTo("active");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.specificType(
      "updated_at",
      "timestamp not null default current_timestamp on update current_timestamp"
    );

    table.unique(["user_id"], "uq_wallets_user_id");
    table.index("status", "idx_wallets_status");

    table
      .foreign("user_id", "fk_wallets_user_id")
      .references("id")
      .inTable("users")
      .onUpdate("CASCADE")
      .onDelete("RESTRICT");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("wallets");
}
