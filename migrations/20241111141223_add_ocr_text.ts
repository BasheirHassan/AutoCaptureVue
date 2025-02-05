exports.up = function (knex) {
    return knex.schema.table('images', table => {
        table.text('ocr_text').default(1);
    })
};

exports.down = function (knex) {
    return knex.schema.table('images', table => {
        table.dropColumn('images');
    })
};
