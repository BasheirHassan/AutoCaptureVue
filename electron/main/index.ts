import {app, BrowserWindow, dialog, ipcMain, ipcRenderer, Menu, shell} from 'electron'
import {release} from 'node:os'
import {join} from 'node:path'
import path from "path";
import BackUpToFolderClass from "./BackUpToFolderClass";
import 'dotenv/config'
import UpdaterClass from "./UpdaterClass";
import log from 'electron-log/main';
import {autoUpdater} from "electron-updater";
import {postErrorLog} from "../../src/assets/ipcHandel";
import {compare} from 'compare-versions';
import {ipcEventEnum} from "../../src/assets/ipcEvents";
import {WindowAll} from "./WindowAll";
import {WindowConfig} from "./Interfaces";
import fs from "fs";



// Object.defineProperty(app, 'isPackaged', {
//     get() {
//         return true;
//     }
// });

/**
 *
 */
const parentPathExe = path.dirname(app.getPath('exe'));
log.transports.file.resolvePathFn = () => path.join(parentPathExe, 'logs/main.log');

console.log(path.join(app.getPath("userData"), 'database'), '')


process.env.DIST_ELECTRON = join(__dirname, '..')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL ? join(process.env.DIST_ELECTRON, '../public') : process.env.DIST
// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()
// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())
if (!app.requestSingleInstanceLock()) {
    app.quit()
    process.exit(0)
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let windowsAll = []

// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')

async function createWindow(hashUrl: any, windowConfig?: WindowConfig) {
    const option = {
        icon: join(process.env.PUBLIC, 'favicon.ico'),
        autoHideMenuBar: true,
        webPreferences: {
            preload,
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false
        },
    }

    Object.assign(option, windowConfig);
    windowsAll[windowConfig.windowID] = new BrowserWindow(option);


    if (process.env.VITE_DEV_SERVER_URL) {
        await windowsAll[windowConfig.windowID].loadURL(`${url}#${hashUrl}`)

    } else {
        await windowsAll[windowConfig.windowID].loadFile(indexHtml, {hash: hashUrl})
    }


    if (!app.isPackaged) {
        windowsAll[windowConfig.windowID].webContents.openDevTools();
    }


    if (windowConfig.isMaximum === true) {
        windowsAll[windowConfig.windowID].maximize();
    }


    // Test actively push message to the Electron-Renderer
    windowsAll[windowConfig.windowID].webContents.on('did-finish-load', async () => {
        windowsAll[windowConfig.windowID].webContents.send('main-process-message', new Date().toLocaleString())
    })


    /**
     * اغلاق كافة النوافذ عند اغلاق الرئيسية
     */


    windowsAll[WindowAll.home].on('closed', () => {
        windowsAll = null
        if (process.platform !== 'darwin') quit();
    })


    if (!app.isPackaged) {
        windowsAll[windowConfig.windowID].webContents.openDevTools()
    }


    // Make all links open with the browser, not with the application
    windowsAll[windowConfig.windowID].webContents.setWindowOpenHandler(({url}) => {
        if (url.startsWith('https:')) shell.openExternal(url)
        return {action: 'deny'}
    })

}


let childWindow;

async function creatChildWindow(hashUrl, windowConfig?: WindowConfig) {
    const option = {
        icon: join(process.env.PUBLIC, 'favicon.ico'),
        autoHideMenuBar: true,
        webPreferences: {
            preload,
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false
        },
    }


    Object.assign(option, windowConfig);
    childWindow = new BrowserWindow(option);


    if (process.env.VITE_DEV_SERVER_URL) {
        await childWindow.loadURL(`${url}#${hashUrl}`)

    } else {
        await childWindow.loadFile(indexHtml, {hash: hashUrl})
    }


    if (windowConfig.isMaximum === true) {
        childWindow.maximize();
    }


    /**
     * فقط للتجريبي
     */
    if (!app.isPackaged) {
        childWindow.webContents.openDevTools();
        // childWindow.maximize();
    }

}


app.whenReady().then(async () => {
    console.log('Window Ready')

    await createWindow('/', {isMaximum: true, autoHideMenuBar: false, windowID: WindowAll.home});


});


app.on('window-all-closed', () => {
    windowsAll = null
    if (process.platform !== 'darwin') app.quit()
})




ipcMain.handle(ipcEventEnum["openNewWindow"], async (_, arg) => {
    console.log(arg, 'openNewWindow')
    await createWindow(arg, {
        windowID: WindowAll.newWindow,
        isMaximum: false,
        width: 1200,
        height: 900,
        autoHideMenuBar: true,
    })
})


// ---------------  Bac Up Folder --------------------








ipcMain.on(ipcEventEnum["updateData"], (event, message) => {

    try {
        windowsAll[WindowAll.home]?.webContents.send(ipcEventEnum["updateData"]);
    } catch (e) {
        console.log(e)
    }


})






ipcMain.once(ipcEventEnum["checkNewVersion"], async (event, v) => {
    console.log('time out')
    autoUpdater.setFeedURL({
        provider: 'github',
        repo: 'AutoCapture',
        owner: 'BasheirHassan',
        private: true,
        token: getEnv('GITHUB_TOKEN')
    })

    autoUpdater.autoDownload = false;

    let getVersion = await autoUpdater.checkForUpdates();
    let check = compare(app.getVersion(), getVersion.versionInfo.version, '<') // true if(getVersion.getVersion.versionInfo.version > await app.getVersion())
    console.log(check, 'chhhhhh')
    if (getVersion) {
        if (check) {

            try {
                windowsAll[WindowAll.home].webContents.send(ipcEventEnum["checkUpdate"], {
                    isUpdate: true,
                    version: getVersion.versionInfo.version
                })
            } catch (e) {
                console.log(e)
            }


        } else {

            try {
                windowsAll[WindowAll.home].webContents(ipcEventEnum["checkUpdate"], {
                    isUpdate: false,
                    version: getVersion.versionInfo.version
                })
            } catch (e) {
                console.log(e)
            }


        }
    }

})



ipcMain.handle("getAppVersion", async (_, arg) => {
    return app.getVersion();
});




ipcMain.handle(ipcEventEnum["getEnv"], async (_, arg) => {
    return getEnv(arg)
});


export function getEnv(key: string) {
    require('dotenv').config({
        path: app.isPackaged
            ? path.join(process.resourcesPath, '.env')
            : path.resolve(process.cwd(), '.env'),
    })
    return process.env[key]
}




ipcMain.handle(ipcEventEnum["postErrorLog"], async (_, arg) => {
    console.log('reg Error');
    log.error(arg);
    return true;
});


ipcMain.on(ipcEventEnum["quit"], async (_, arg) => {
    quit();
});



ipcMain.handle("delete-image", async (_, arg) => {
    console.log(arg, 'delete-image')
    try{
        fs.unlink(arg, (err) => {
            if (err) throw err;
            console.log('The file was deleted');
        });
    } catch (e) {
        console.log(e)
    }

});






ipcMain.handle(ipcEventEnum["restartApp"], async (_, arg) => {
    app.relaunch();
    app.exit(0);
});



ipcMain.on(ipcEventEnum["closeWindowOutParent"], async (event, arg) => {
    BrowserWindow.getAllWindows().forEach(win => {
        if (event.sender.id != win.webContents.id) {
            win.hide();
        }
    })
});


function quit() {
    app.exit(0);
    app.quit();
}



ipcMain.handle('get-user-data-folder', async (_, arg) => {
    if (!app.isPackaged) {
        return path.join(app.getPath("userData"), 'database', 'dev');
    }
    return path.join(app.getPath("userData"), 'database');
});

ipcMain.handle('set-folder-pathe-to-save', async (_, arg) => {
    const pathArray = await dialog.showOpenDialog({properties: ['openDirectory']});
    let path = null;
    if (!pathArray.canceled){
        path =   pathArray.filePaths.toString();
    }
    return path;
})

// ------------- End Back Up ------------------





ipcMain.once(ipcEventEnum["fullWindow"], (_, arg) => {
    windowsAll[WindowAll.home].maximize();
})



const template = [
    // { role: 'editMenu' }
    {
        label: 'اداوت',
        submenu: [
            {
                label: 'عرض الصور',
                async click(item, focusedWindow) {
                    await creatChildWindow('report/images', {autoHideMenuBar: false, windowID: undefined, isMaximum: true})
                }
            },

            {
                label: 'تصدير  كل الصور',
                async click(item, focusedWindow) {
                    console.log('export-images')
                    console.log(windowsAll)
                    windowsAll[WindowAll.home]?.webContents.send(ipcEventEnum["exportImages"]);
                }
            },



        ]
    },
    {
        label: 'تعليمات',
        submenu: [
            {
                label: 'مطور',
                async click(item, focusedWindow) {
                    windowsAll[WindowAll.home]?.webContents.openDevTools();                }
            },

        ]
    },


]

// @ts-ignore
const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)