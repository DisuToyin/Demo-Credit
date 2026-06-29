import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasAuthToken = await knex.schema.hasColumn("users", "auth_token");

  if (hasAuthToken) {
    return;
  }

  await knex.schema.alterTable("users", (table) => {
    table.string("auth_token", 80).nullable().unique();
  });

  await knex("users")
    .whereNull("auth_token")
    .update({
      auth_token: knex.raw("concat('demo_', replace(uuid(), '-', ''))"),
    });

  await knex.schema.alterTable("users", (table) => {
    table.string("auth_token", 80).notNullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  const hasAuthToken = await knex.schema.hasColumn("users", "auth_token");

  if (!hasAuthToken) {
    return;
  }

  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("auth_token");
  });
}
