import {autoUpdater, UpdateInfo} from "electron-updater";
import moment from "moment";
import {getEnv} from "./index";
import {postErrorLog} from "../../src/assets/ipcHandel";
const ProgressBar = require("electron-progressbar");

export default class UpdaterClass {

    private win:any;
    private app:any;

    constructor(win:any,app:any) {
        this.win = win;
        this.app = app;
    }
    async checkUpdaterApp() {
        var progressBar = new ProgressBar({
            style: { // the keys are all elements of the progress bar
                text: { // pair of CSS properties/values
                    'font-weight': 'bold',
                    'color': '#B11C11',
                    'font-family': 'Cairo',
                    'font-size': '15px',
                    'height': '30%',
                    'direction': 'rtl'
                },
                detail: {
                    'color': '#3F51B5',
                    'font-family': 'Cairo',
                    'font-size': '18px',
                    'font-weight': 'bold',
                    'direction': 'rtl',
                },
                bar: {
                    'background': 'rgba(255,255,255,0)',
                    'left': 0,
                    'position': 'fixed',
                    'text-align': 'center',
                    'bottom': '0',
                    'width': '100%',
                },
                value: {
                    'background': '#F44336',
                }
            },
            indeterminate: true,
            title: 'تحديث',
            text: 'جاري بحث عن تحديثات...',
            detail: 'انتظار...' + '</br>',
            closeOnComplete: false,
            browserWindow: {
                parent: this.win,
                closable: true,
                height: 600,
            }
        });


         const githubToken =  getEnv('GITHUB_TOKEN');
        autoUpdater.setFeedURL({
            provider: 'github',
            repo: 'CloseCash',
            owner: 'BasheirHassan',
            private: true,
            token: githubToken
        })

        autoUpdater.autoDownload =true;
        autoUpdater.checkForUpdatesAndNotify();

        progressBar
            .on('completed', function () {
                progressBar.setCompleted();
            })
            .on('aborted', function () {
                console.info(`aborted...`);
                postErrorLog('aborted...')
                progressBar.setCompleted();
            });

        progressBar.text = "بحث عن تحديث";
        autoUpdater.on('checking-for-update', () => {
            if (!progressBar.isCompleted()) {
                progressBar.text = "\n </br>" + "جاري بحث عن تحديثات .....";
            }
        })
        autoUpdater.on('update-available', (info: any) => {
            if (!progressBar.isCompleted()) {
                progressBar.text += "\n </br>";
                progressBar.text += "جاري تحميل ......";
                progressBar.text += "\n </br>";
                progressBar.text += "يوجد تحديث جديد .....";
                progressBar.text += "\n </br>";
                progressBar.text += info.version;
                progressBar.text += "\n </br>";
                progressBar.text += moment(info.releaseDate).format('YYYY-MM-DD');
                progressBar.text += "\n </br>";
                progressBar.detail = "";
                if (info.releaseNotes) {
                    progressBar.detail += info.releaseNotes;
                }
            }
        })

        autoUpdater.on('update-not-available', (info: UpdateInfo) => {
            if (!progressBar.isCompleted()) {
                progressBar.detail = "لا يتوفر تحديث حاليا";
                progressBar.detail = "\n </br>" + "لا يوجد تحديث جديد";
                progressBar.setCompleted();
            }
        })
        autoUpdater.on('error', (err: any) => {
            if (!progressBar.isCompleted()) {
                progressBar.detail += "\n </br>" + 'لايمكن تحديث الرجاء المحاولة لاحقا' + err;
                postErrorLog('error' + err)
                progressBar.setCompleted();
            }
        })
        autoUpdater.on('download-progress', (progressObj: any) => {
            if (!progressBar.isCompleted()) {
                progressBar.text = "\n </br>" + " تم تحميل ...  " + "\n" + parseInt(progressObj.percent) + "%";
            }
        })
        autoUpdater.on('update-downloaded', (info: any) => {
            if (!progressBar.isCompleted()) {
                progressBar.text = " تم تحميل التحديثات .....";
                progressBar.text += "\n </br>" + "قم باعادة تشغيل التطبيق لتحديثه";
                progressBar.setCompleted();
                this.app.quit();
            }
        })
    }


}

