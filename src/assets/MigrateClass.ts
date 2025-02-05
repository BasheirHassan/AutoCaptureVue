// @ts-ignore
import path from "path";
// @ts-ignore
import knex, {migrate} from "knex";

import fs from "fs";
import MysqlAsyncClass from "./MysqlAsyncClass";
import {getDBFolder, getDBName, getDBVersion, postErrorLog} from "./ipcHandel";
import config from "../../knexfile";
const knex = require('knex')(config)


interface updateInfo {
    status: boolean
    versionNow: number
    versionOld: number
}


export default class MigrateClass  {
    private mysqlClass: MysqlAsyncClass;


    constructor() {
        this.mysqlClass = new MysqlAsyncClass();
    }


    private async checkFileExists() {
        let dbFolder = await getDBFolder();
        let DataBaseName = await getDBName();
        let join = path.join(dbFolder,DataBaseName);
        return fs.promises.access(join, fs.constants.F_OK)
            .then(() => true)
            .catch(() => false)
    }

    /**
     * التحقق من وجود مجلد قاعدة البيانات
     * @private
     */
    private async checkFolderDBExists() {
        let path = await getDBFolder();
        if (!fs.existsSync(path)){    //check if folder already exists
            fs.mkdirSync(path);    //creating folder
        }
    }

    public async checkNeedUpdate() {

        let info:updateInfo = {versionNow:0,versionOld:0,status:false};
        info.versionOld = await this.compareVersion();
        info.status = !await this.checkFileExists() ;
        info.versionNow = await getDBVersion();
        console.log(info,'Infoooo')
        if (parseInt(String(info.versionNow)) > parseInt(String(info.versionOld)) ){
            info.status = true;
        }
        return info;
    }

    async compareVersion() {
        let exists = await this.checkFileExists();
        let version = 0;
        if (exists) {
            await this.mysqlClass.getVersion().then(row => {
                console.log(row,'compareVersion')
                    version = row.value
            }).catch(err => {
                version = 0;
            })
            return version;
        } else {
            return version;
        }
    }


    public async getVersion() {

        let exists = await this.checkFileExists();
        let info: updateInfo = {versionNow: 0, status: true,versionOld:0};
        if (!exists) {
            return info;
        } else {
            try {
                // @ts-ignore
                let v = await this.knexConnection().select('version').from("config").first('version');
                console.log(v, 'getVersion')
                info = {versionOld: v.version, status: true,versionNow:0}
            } catch (e) {
                info = {versionOld: 0, status: true,versionNow:0}
            }
        }
        return info;
    }

    /**
     *
     */
    public async migrate() {

        return   knex.migrate.latest()
            .then(value=> {
                console.log('done',value)
                return value;
            })
    }


    public async updateVersion() {
        const v = await getDBVersion();
        try {
            await knex('config').where('key', 'version').update({value: v})
        } catch (e) {
            await postErrorLog(e)
            console.log(e)

        }
    }


}


