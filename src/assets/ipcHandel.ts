import {ipcRenderer} from "electron";
import {ipcEventEnum} from "./ipcEvents";


export async function postErrorLog(errorLog: any) {
    await ipcRenderer.invoke(ipcEventEnum["postErrorLog"], errorLog);
    return 'save'
}




export function getDBFolder(){
   return  ipcRenderer.invoke("get-user-data-folder",null);
}

export async function getDBName() {
    return await ipcRenderer.invoke(ipcEventEnum['getEnv'], 'DATA_BASE_NAME');
}




export async function getDBVersion() {
    return await ipcRenderer.invoke(ipcEventEnum['getEnv'], 'DATA_BASE_VERSION');
}

export async function getGithubToken() {
    return await ipcRenderer.invoke(ipcEventEnum['getEnv'], 'GITHUB_TOKEN');
}



export async function restartApp() {
    await ipcRenderer.invoke(ipcEventEnum["restartApp"]);


}




