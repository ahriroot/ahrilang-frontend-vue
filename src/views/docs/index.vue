<script setup lang="ts">
import CodeEditor from '@/components/CodeEditor.vue'
import { nextTick, onMounted, ref, shallowRef } from 'vue'
import Prism from "prismjs"
import "prismjs/plugins/line-numbers/prism-line-numbers.min.js"
import "prismjs/themes/prism-tomorrow.min.css"
import "prismjs/plugins/line-numbers/prism-line-numbers.min.css"

import { VirtualMachine } from 'ahrilang-js'


const codes = ref<{ [x: string]: any }>({})

onMounted(async () => {
    let res = await fetch('./data.json').then((res) => res.json())
    codes.value = res
    nextTick(() => {
        Prism.highlightAll()
    })
})

const editorRef = shallowRef<any>(null)
const handleRunExample = (code: string) => {
    showEditor.value = true
    output.value = []
    if (editorRef.value) {
        editorRef.value.setCode(code)
    }
}

const showEditor = ref<boolean>(false)
const outputRef = shallowRef<HTMLElement | null>(null)
const output = ref<string[]>([])
const handleRun = () => {
    let code = editorRef.value?.getCode()
    const builtins = {
        print: (arg: string) => {
            output.value.push(arg)
        }
    }
    VirtualMachine.interpret(code, [], builtins)
    nextTick(() => {
        if (outputRef.value) {
            outputRef.value.scrollTop = outputRef.value.scrollHeight
        }
    })
}

const handleClear = () => {
    output.value = []
}
</script>

<template>
    <div class="docs">
        <div class="catalog">
            <a class="item" v-for="(i, index) in codes" :key="index" :href="`#${i.title}`">{{ i.title }}</a>
        </div>
        <div :class="{ content: true, hide: showEditor }">
            <div class="item" v-for="(code, index) in codes" :key="index">
                <h1 class="title" :id="code.title">{{ code.title }}</h1>
                <div v-for="(i, index) in code.content" :key="code.title + index">
                    <p class="desc" v-if="i.type == 'desc'">{{ i.text }}</p>
                    <div class="code" v-if="i.type == 'code'">
                        <button v-if="i.try" class="try" @click="handleRunExample(i.text)">Try</button>
                        <pre class="language-js"><code>{{ i.text }}</code></pre>
                    </div>
                </div>
            </div>
        </div>
        <div :class="{ run: true, hide: !showEditor }">
            <div class="header">
                <button class="btn" @click="showEditor = false">
                    <svg t="1716528102999" class="icon" viewBox="0 0 1024 1024" version="1.1"
                        xmlns="http://www.w3.org/2000/svg" p-id="1466" width="64" height="64">
                        <path
                            d="M326.7079 958.51045l-63.278185-60.523445L651.328255 512.841158 257.924327 124.944664l66.024739-60.523445 445.672362 448.419939L326.7079 958.51045z"
                            fill="#1afa29" p-id="1467"></path>
                    </svg>
                </button>
                <button class="btn" @click="handleRun">
                    <svg t="1716522625228" class="icon" viewBox="0 0 1024 1024" version="1.1"
                        xmlns="http://www.w3.org/2000/svg" p-id="2788" width="64" height="64">
                        <path
                            d="M886.784 512a25.6 25.6 0 0 1-11.4944 21.3504l-698.368 460.8a25.6512 25.6512 0 0 1-26.24 1.2032A25.6256 25.6256 0 0 1 137.216 972.8V51.2a25.5744 25.5744 0 0 1 39.7056-21.3504l698.368 460.8a25.6 25.6 0 0 1 11.4944 21.3504z"
                            p-id="2789" fill="#1afa29"></path>
                    </svg>
                </button>
            </div>
            <div class="editor">
                <CodeEditor ref="editorRef" code="" />
            </div>
            <div class="output" ref="outputRef">
                <div v-for="(item, index) in output" :key="index">{{ item }}</div>
            </div>
            <button class="btn-clear" @click="handleClear">Clear</button>
        </div>
    </div>
</template>

<style scoped>
.docs {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}

.catalog {
    position: absolute;
    top: 0;
    left: 0;
    width: 300px;
    bottom: 0;
    border-right: 1px solid #595959;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: auto;
    padding: 20px 40px;
}

.catalog::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

.catalog::-webkit-scrollbar-thumb {
    background-color: #595959;
    border-radius: 3px;
}

.catalog .item {
    color: #e3e3e3;
    transition: .3s;
}

.catalog .item:hover {
    color: #1afa29;
}

.content {
    position: absolute;
    top: 0;
    left: 300px;
    right: 0;
    bottom: 0;
    padding: 10px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 30px;
}

.content.hide {
    right: 600px;
}

.content::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

.content::-webkit-scrollbar-thumb {
    background-color: #595959;
    border-radius: 3px;
}

.content .btn {
    cursor: pointer;
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 6px 12px;
}

.content .item {
    max-width: 1200px;
}

.content .item .code {
    position: relative;
    max-width: 1000px;
}

.content .item .code .try {
    position: absolute;
    top: 4px;
    right: 4px;
    cursor: pointer;
    border: none;
    background: none;
    color: #1afa29;
    font-size: 16px;
    transition: .3s;
}

.content .item .code .try:hover {
    color: #1eaf28;
}

.content .item .code .try:active {
    color: #1afa29;
}

.run {
    position: absolute;
    top: 0;
    width: 600px;
    right: 0;
    bottom: 0;
    transition: 0.5s;
}

.run.hide {
    right: -600px;
}

.run .header {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 0 20px;
    background-color: #1e1e1e;
    border-bottom: 1px solid #595959;
}

.run .header .btn {
    cursor: pointer;
    border: none;
    background: none;
}

.run .header .btn .icon {
    width: 28px;
    height: 28px;
}

.run .header .btn .icon path {
    transition: 0.3s;
    fill: #1afa29;
}

.run .header .btn .icon:hover path {
    fill: #1eaf28;
}

.run .header .btn .icon:active {
    transform: scale(0.9);
}

.run .editor {
    position: absolute;
    top: 50px;
    left: 0;
    right: 0;
    bottom: 300px;
}

.run .output {
    position: absolute;
    height: 300px;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #1e1e1e;
    border-top: 1px solid #595959;
    padding: 6px 10px;
    overflow-y: auto;
}

.run .output::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

.run .output::-webkit-scrollbar-thumb {
    background-color: #595959;
    border-radius: 3px;
}

.run .btn-clear {
    position: absolute;
    right: 14px;
    bottom: 276px;
    cursor: pointer;
    border: none;
    background: none;
    color: #1afa29;
    font-size: 16px;
    transition: .3s;
}

.run .btn-clear:hover {
    color: #1eaf28;
}

.run .btn-clear:active {
    color: #1afa29;
}
</style>
