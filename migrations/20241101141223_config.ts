
exports.up = async function (knex) {
    await knex.schema
        .createTable('config', function (table) {
            table.increments('id').primary();
            table.datetime('date').defaultTo(knex.fn.now());
            table.string('key');
            table.string('value');
        })


    return  knex.insert([
        {key:"version",value:1},
        {key:"hotkey",value:"F3"},
        {key:"image_type",value:"png"},
        {key:"time_late_take_picture",value:"2000"},
        {key:"path_folder_to_save_image",value:""},
        {key:"save_db",value:true},
        {key:"resolution",value:2},
        {key:"video_brights",value:100},
    ]).into('config');

};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function(knex) {
    return  knex.schema.dropTableIfExists('config')
};
