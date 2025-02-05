import moment from "moment/moment";
import {helpersNotification} from "./Helpers";
import MysqlAsyncClass from "./MysqlAsyncClass";
import fs from "fs";
import cameraSound from '@/assets/icons/camera.mp3'
import path from "path";
import {collect} from "collect.js";

const mysqlClass = new MysqlAsyncClass();

class ImageClass {


    /**
     * عند التقاط صورة تشغيل نغمة
     */
    public async playSound() {
        try {
            const audioPlay = new Audio(cameraSound);
            await audioPlay.play()
        } catch {

        }
    }





    public creatImageXID(imagePathe: any, IDxImage: any, imageType: any): { imgName: any, imgPath: any } {
        let name = moment().format("x") + "--" + IDxImage + '.' + imageType
        return {imgName: name, imgPath: imagePathe}
    }

    /**
     * حفظ الصورة في مجلد
     * @param imageName
     * @param imagePathe
     * @param base64Data
     */

    public async saveImageToFolder(imageName: any, imagePathe: any, base64Data: any): Promise<void> {
        const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Image, 'base64');
        let issetFolser = false;
        if (fs.existsSync(imagePathe)) {
            issetFolser = true;
        } else {
            helpersNotification(false, 'تاكد من مجلد حفظ الصور ')
        }

        if (issetFolser) {
            try {
                fs.writeFileSync(path.join(imagePathe, imageName), buffer);
            } catch (e) {
                console.log(e)
                helpersNotification(false, 'لم يتم حفظ الصورة بنجاح' + e)
            }
        }

        // await imageClass.saveImageToDataBases(imageBuffer, imagePathe);


    }


    public async saveImageToDataBase(base64Data: any) {
        const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Image, 'base64');
        let saveToDB = await mysqlClass.insertImage({image: buffer, date: moment().format()})
        console.log(collect(saveToDB).first().id)
        if (!collect(saveToDB).first().id){
            helpersNotification(false, 'لم يتم حفظ الصورة بنجاح بقاعدة البيانات')
        }
        return collect(saveToDB).first().id
    }


    public getImageType(imageData) {
        if (imageData.slice(0, 2).equals(Buffer.from([0xff, 0xd8]))) {
            return 'JPEG';
        } else if (imageData.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
            return 'PNG';
        } else if (imageData.slice(0, 6).toString() === 'GIF87a' || imageData.slice(0, 6).toString() === 'GIF89a') {
            return 'GIF';
        } else if (imageData.slice(0, 2).toString() === 'BM') {
            return 'BMP';
        } else {
            return 'Unknown';
        }
    }

    /**
     * تصدير كافة الصور الى مجلد
     * @param imagePathe
     */
    public async exportImagesToFolder(imagePathe: any) {
        try {
            const result = await mysqlClass.getAllImages();
            if (!result) {
                throw new Error('Failed to retrieve images from the database.');
            }

            collect(result).each((item: any) => {
                if (!item.image || !item.id) {
                    throw new Error('Image data or ID is missing.');
                }

                const imageBuffer = new Uint8Array(item.image);
                let imageType = this.getImageType(item.image);
                const imageName = item.id + '.' + imageType;
                fs.writeFileSync(path.join(imagePathe, imageName), imageBuffer);
            });
        } catch (error) {
            console.error('Error exporting images:', error);
            helpersNotification(false, 'Error exporting images: ' + error.message);
        }
    }


}


export const imageClass = new ImageClass();