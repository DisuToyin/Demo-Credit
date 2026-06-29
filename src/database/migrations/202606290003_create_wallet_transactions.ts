import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("wallet_transactions", (table) => {
    table.string("id", 36).primary();
    table.string("wallet_id", 36).notNullable();
    table
      .enu("type", ["fund", "withdrawal", "transfer_in", "transfer_out"])
      .notNullable();
    table.bigInteger("amount").unsigned().notNullable();
    table.bigInteger("balance_before").unsigned().notNullable();
    table.bigInteger("balance_after").unsigned().notNullable();
    table.string("reference", 80).notNullable().unique();
    table.string("related_transaction_id", 36).nullable();
    table.string("counterparty_wallet_id", 36).nullable();
    table
      .enu("status", ["pending", "successful", "failed", "reversed"])
      .notNullable()
      .defaultTo("successful");
    table.string("description", 255).nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table.index("wallet_id", "idx_wallet_transactions_wallet_id");
    table.index("type", "idx_wallet_transactions_type");
    table.index("status", "idx_wallet_transactions_status");
    table.index("created_at", "idx_wallet_transactions_created_at");

    table
      .foreign("wallet_id", "fk_wallet_transactions_wallet_id")
      .references("id")
      .inTable("wallets")
      .onUpdate("CASCADE")
      .onDelete("RESTRICT");

    table
      .foreign("counterparty_wallet_id", "fk_wallet_transactions_counterparty_wallet_id")
      .references("id")
      .inTable("wallets")
      .onUpdate("CASCADE")
      .onDelete("SET NULL");

    table
      .foreign("related_transaction_id", "fk_wallet_transactions_related_transaction_id")
      .references("id")
      .inTable("wallet_transactions")
      .onUpdate("CASCADE")
      .onDelete("SET NULL");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("wallet_transactions");
}
