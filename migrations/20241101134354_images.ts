



exports.up = async function (knex) {
    await  knex.schema
        .createTable('images', function (table) {
            table.increments('id').primary();
            table.datetime('date').defaultTo(knex.fn.now());
            table.binary('image');

        })

};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function(knex) {
    return  knex.schema.dropTableIfExists('images')
};
