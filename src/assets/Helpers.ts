import {ElNotification} from "element-plus";
import isNumber from "is-number"
import numbro from "numbro";
export function helpersNotification(status: any,messag:any="") {

    // console.log(status)
    let options = {}
    if (stringToBoolean(status)) {
        options = {
            title: "تنبيه",
            message: 'تمت العميلة    بنجاح' + " <br/> "+ messag,
            type: "success",
            position: 'bottom-right',
            customClass: 'alert-dialog',
            dangerouslyUseHTMLString: true,
            showClose: false,

        }

    } else {
        options = {
            title: "تنبيه",
            message: 'خطاء اعد المحاولة لاحقا!'+ "  <br/> " + messag ,
            type: "error",
            position: 'bottom-right',
            customClass: 'alert-dialog',
            dangerouslyUseHTMLString: true,
            showClose: false
        }

    }

    ElNotification(options)
}


export const stringToBoolean = (stringValue: any) => {
    let value = String(stringValue).toLowerCase()?.trim();
    return value === "true" || value === "yes" || value === "1";
}

/**
 *
 * @param obj
 * @param key
 * @param valueSearch
 */

export function findIndexOfObject(obj:any,key:any,valueSearch:any) {
    return obj.findIndex((x:any) => x[key] == valueSearch);
}






/**
 * الحصول على القيمة المئوية من باقي المبلغ
 * @param x صافي المبلغ
 * @param total كامل المبلغ الرئيسي
 * @param fixed عدد الاراقم بعد الفاصلة
 */
export function calcPercentage(x:number, total:number, fixed = 2) {
    const percent = (x / total) * 100;
    if(!isNaN(percent)){
             return Number(percent.toFixed(fixed));
    }else{
        return null;
    }
}


/**
 *
 * @param value
 * @example
 * `````
 * parseNumber('1000') // 1000
 * `````
 */
export function parseNumber(value: number | string) {
    if (typeof value === 'number') {
        return value;
    }
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
        return parsed;
    }
    return 0;
}


/**
 *
 * @param value
 * @code
 * ``````
 * numbroFormater(1000) // 1000

 */
export function numbroFormater(value:any,mantissa = 2):string {
    if(isNumber(value)){
        return numbro(value).format({thousandSeparated: true, mantissa: mantissa})
    }else {
        return ''
    }
}
