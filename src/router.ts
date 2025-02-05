import {createRouter, createWebHashHistory} from 'vue-router';
import {sectionStoreClass} from "@assets/SectionStoreClass";


const router = createRouter({

    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            name: 'Home',
            meta: {title: 'رئيسية'},
            component: () => import('@components/HomeComponents.vue')
        },

        {
            path: '/migrateDB',
            name: 'MigrateDB',
            meta: {title: 'تحديث قاعدة البيانات'},
            component: () => import('@components/MigrateDB.vue')
        },
        {
            path: '/report/images',
            name: 'reportImages',
            meta: {title: 'عرض الصور'},
            component: () => import('@/components/ReportComponents.vue')
        },

        {
            path: '/truncatDatabase',
            name: 'TruncatDatabase',
            meta: {title: 'مسح بيانات كاملة'},
            component: () => import('@components/TruncatDatabase.vue')
        },

    ]

})


router.beforeEach(async (to) => {

    const space = `\u205f​​​\u205f​​​\u205f​​​\u205f​​​\u205f​​​\u205f​​​\u205f​​​ `
    document.title = "Auto Captuer - " + to.meta.title + space;
    console.table(to);
});


export default router;
