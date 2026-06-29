import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("karma_checks", (table) => {
    table.string("id", 36).primary();
    table.string("user_id", 36).nullable();
    table.string("identity_type", 30).notNullable();
    table.string("identity_value", 100).notNullable();
    table.boolean("is_blacklisted").notNullable();
    table.string("provider", 50).notNullable().defaultTo("lendsqr_adjutor");
    table.json("provider_response").nullable();
    table.timestamp("checked_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table.index(["identity_type", "identity_value"], "idx_karma_checks_identity");
    table.index("is_blacklisted", "idx_karma_checks_is_blacklisted");
    table.index("checked_at", "idx_karma_checks_checked_at");

    table
      .foreign("user_id", "fk_karma_checks_user_id")
      .references("id")
      .inTable("users")
      .onUpdate("CASCADE")
      .onDelete("SET NULL");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("karma_checks");
}
