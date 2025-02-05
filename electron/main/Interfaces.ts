import {WindowAll} from "./WindowAll";


export interface WindowConfig {
    isMaximum: boolean
    width?: number
    height?: number
    autoHideMenuBar: boolean
    resizable?:boolean,
    windowID:WindowAll
}
