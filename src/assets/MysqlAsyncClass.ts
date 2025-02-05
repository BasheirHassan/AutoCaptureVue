/*


Mysql Connection Class


 */

// @ts-ignore
import {collect} from "collect.js";
//@ts-ignore
import config from "../../knexfile";

const knex = require('knex')(config)
const {attachPaginate} = require('knex-paginate');
attachPaginate();
export default class MysqlAsyncClass {


    public async connectionTest() {
        console.log('connectionTest')
        return knex.raw('select 1');
    }

    public async getVersion() {
        try {
            return knex("config").where('key', 'version').first();
        } catch (e) {
            return e;
        }

    }

    public async getConfig() {
        return knex("config").select(['key', 'value'])

    }

    public async getImagesTotal() {

        return knex("images").count({count: "id"}).first();

    }

    public async getImages(totalPage = 10, currentPage = 1) {

        return knex({a: "images"}).select('*').orderBy(`a.id`, 'DESC')
            .paginate({perPage: totalPage, currentPage: currentPage});
    }

    public async getAllImages() {
        return knex({a: "images"}).select('*').orderBy(`a.id`, 'DESC')

    }


    public async insertImage(d: any) {

        return knex('images').insert(d).returning('id');
    }


    public async updateOcrText(d: any, ID: number) {
        return knex('images').where('id', ID).update(d);
    }

  public async searchImage(ocr_text: string,) {
        return knex('images').whereLike('ocr_text', '%' + ocr_text + '%');
    }


    public async deleteImageByID(id: any) {

        return knex('images').where('id', id).del();
    }

    public getImageByID(id: number) {

        return knex('images').where('id', id).first();
    }

    public async deleteAllImages(id: any) {

        return knex('images').truncate();
    }


    /**
     *
     *
     ----------------------- Setting -------------------
     */


    public async saveConfig(s: boolean) {
        await knex.transaction(async trx => {
            return Promise.all([
                await knex('config').truncate().transacting(trx),
                await knex('config').insert(s).returning('*').transacting(trx)
            ]);
        })


    }


    public async saveSettingResolution(s: any) {
        await knex('config').where('key', 'resolution').del();
        return await knex('config').insert({key: 'resolution', value: s});
    }


    public async getSettingSavePth() {
        return knex('config').select('*').where('key', 'path').first();
    }


    public async trncatDB() {
        await knex.schema.dropTableIfExists('config');
        await knex.schema.dropTableIfExists('images');
        await knex.schema.dropTableIfExists('knex_migrations');
        await knex.schema.dropTableIfExists('knex_migrations_lock');
        return true
    }


}


