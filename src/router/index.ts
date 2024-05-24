import { createRouter, createWebHistory } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({
    showSpinner: false,
})

const router = createRouter({
    // 设置模式：history 模式
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/index',
            name: 'index',
            alias: '/',
            meta: {
                title: 'Ahrilang',
            },
            component: () => import('@/views/home/index.vue'),
        },
        {
            path: '/playground',
            name: 'playground',
            meta: {
                title: 'Playground - Ahrilang',
            },
            component: () => import('@/views/playground/index.vue'),
        },
        {
            path: '/docs',
            name: 'docs',
            meta: {
                title: 'Documents - Ahrilang',
            },
            component: () => import('@/views/docs/index.vue'),
        },
    ],
})

router.beforeEach((to, _from, next) => {
    NProgress.start()

    if (to.meta.title) {
        document.title = `${to.meta.title || 'Ahrilang'}`
    }

    next()
})

router.afterEach((to) => {
    document.title = `${to.meta?.title || 'Ahrilang'}`
    NProgress.done()
})
export default router
