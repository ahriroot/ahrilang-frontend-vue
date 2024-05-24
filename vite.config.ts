import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        rollupOptions: {
            output: {
                manualChunks: (e) => {
                    if (e.includes('/node_modules/monaco-editor/')) {
                        return 'monaco'
                    } else {
                        return 'vendor'
                    }
                },
            },
        },
    },
    plugins: [vue()],
    optimizeDeps: {
        include: ['monaco-editor/esm/vs/editor/editor.worker'],
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
})
