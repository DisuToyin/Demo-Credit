import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    table.string("id", 36).primary();
    table.string("first_name", 100).notNullable();
    table.string("last_name", 100).notNullable();
    table.string("email", 255).notNullable().unique();
    table.string("phone_number", 30).notNullable().unique();
    table.string("bvn", 20).notNullable().unique();
    table.string("password_hash", 255).notNullable();
    table.string("auth_token", 80).notNullable().unique();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.specificType(
      "updated_at",
      "timestamp not null default current_timestamp on update current_timestamp"
    );
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("users");
}
