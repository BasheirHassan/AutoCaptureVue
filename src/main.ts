import { createApp } from 'vue'
import App from './App.vue'
import './samples/node-api'
import router from "./router";
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import "bootstrap/dist/css/bootstrap.rtl.css";
import "./style.css"
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
// @ts-ignore

import LangAr from "../langAr";
import "@fortawesome/fontawesome-free/css/all.css";
import VueCountdown from '@chenfengyuan/vue-countdown';
import 'bootstrap-icons/font/bootstrap-icons.css';

let app = createApp(App);


app.use(router);
app.component(VueCountdown.name, VueCountdown);




app.use(ElementPlus,{
  locale: LangAr,
});


for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

  app.mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*')
  })
