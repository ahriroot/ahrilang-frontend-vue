<script setup lang='ts'>
import CodeEditor from '@/components/CodeEditor.vue'
import { onBeforeMount, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { VirtualMachine, Lexer, Parser, Compiler } from 'ahrilang-js'

import JsonView from '@/components/JsonView.vue'

const router = useRouter()

const ide = shallowRef<any>()
const output = ref<any[]>([])
const code = ref<string>("")

const save = (event: KeyboardEvent) => {
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault()
        setStorage('')
    }
}

onBeforeMount(() => {
    code.value = localStorage.getItem('code') || ''
})

onMounted(async () => {
    window.addEventListener('keydown', save)
})

const timerId = ref<NodeJS.Timeout | null>(null)
const setStorage = (code: string) => {
    if (timerId.value) {
        clearTimeout(timerId.value)
    }
    if (ide.value) {
        timerId.value = setTimeout(() => {
            localStorage.setItem('code', code || ide.value.getCode())
        }, 1000)
    }
}

onBeforeUnmount(() => {
    if (timerId.value) {
        clearTimeout(timerId.value)
    }
    window.removeEventListener('keydown', save)
})

const handleRun = async () => {
    const value = ide.value.getCode()
    const builtins = {
        print: (arg: string) => {
            output.value.push({
                type: 'text',
                value: arg
            })
        }
    }
    try {
        await VirtualMachine.eval(value, [], builtins)
    } catch (error: any) {
        output.value.push({
            type: 'error',
            value: error.message
        })
    }
}

const handleClear = () => {
    output.value = []
}

const mask = ref<boolean>(false)
const maskData = ref<any>()
const handleClose = () => {
    mask.value = false
}

const handleToken = () => {
    const value = ide.value.getCode()
    const lexer = new Lexer(value)
    const tokens = lexer.get_tokens()
    maskData.value = tokens
    mask.value = true
}

const colors: { [x: string]: any } = {
    'Program': { color: 'blue' },
}

const tree = (data: any, key: string | null = null): any => {
    if (Object.prototype.toString.call(data) === '[object Object]') {
        let k = data.type || key
        let tmp = {
            name: k,
            label: colors[k] || {},
            children: Object.keys(data).filter((i) => i !== 'type').map((inner) => {
                let item = data[inner]
                if (Array.isArray(item)) {
                    return {
                        name: inner,
                        children: item.map((i) => tree(i, inner))
                    }
                } else {
                    return tree(item, inner)
                }
            }),
        }
        return tmp
    } else {
        if (key == 'precedence') {
            return { name: `Precedence: ${data}`, label: { color: 'green' }, children: [] }
        } else if (key == 'token_type') {
            return { name: `TokenType: ${data}`, label: { color: 'green' }, children: [] }
        }
        return {
            name: `${data}`,
            label: {
                color: 'green',
            },
            children: []
        }
    }
}

const handleAst = () => {
    const value = ide.value.getCode()
    const lexer = new Lexer(value)
    const parser = new Parser(lexer)
    const ast = parser.parse() as any

    maskData.value = [tree(ast)]

    mask.value = true
}

const handleInst = () => {
    const value = ide.value.getCode()
    const lexer = new Lexer(value)
    const parser = new Parser(lexer)
    const ast = parser.parse()
    const compiler = new Compiler([], [])
    const inst = compiler.compile(ast)
    maskData.value = inst
    mask.value = true
}

const handleChanged = (code: string) => {
    setStorage(code)
}

const handleHome = () => {
    router.push({ name: 'index' })
}
</script>

<template>
    <div class="code">
        <div class="mask" v-if="mask">
            <button class="btn" @click="handleClose">Close</button>
            <JsonView :data="maskData" />
        </div>
        <div class="ide">
            <CodeEditor class="editor" ref="ide" :code="code" @changed="handleChanged" />
        </div>
        <div class="output">
            <div class="opera">
                <button class="btn" @click="handleRun">Run</button>
                <button class="btn" @click="handleClear">Clear</button>
                <button class="btn" @click="handleToken">Token</button>
                <button class="btn" @click="handleAst">Ast</button>
                <button class="btn" @click="handleInst">Inst</button>&nbsp;&nbsp;&nbsp;&nbsp;
                <button class="btn" @click="handleHome">Home</button>
            </div>
            <div class="console">
                <div v-for="(item, index) in output" :key="index" :class="item.type == 'text' ? 'text' : 'error'">{{
            item.value }}
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.code {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}

.code .mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 100;
    background-color: #242424;
    overflow-y: auto;
}

.code .mask .btn {
    z-index: 1000;
    position: absolute;
    top: 6px;
    right: 10px;
    cursor: pointer;
    border: none;
    background: none;
    color: #1afa29;
    font-size: 16px;
    transition: .3s;
}

.ide {
    position: absolute;
    top: 0;
    left: 0;
    right: 600px;
    bottom: 0;
}

.output {
    position: absolute;
    top: 0;
    width: 600px;
    right: 0;
    bottom: 0;
}

.opera {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    padding: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.opera .btn {
    border-radius: 10px;
    padding: 10px 20px;
    border: none;
    background-color: #1afa29;
    color: #fff;
    font-size: 16px;
    cursor: pointer;
    transition: .3s;
    color: #555;
    font-weight: 600;
}

.opera .btn:hover {
    background-color: #1eaf28;
}

.opera .btn:active {
    background-color: #1afa29;
}

.console {
    position: absolute;
    top: 60px;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 10px;
}

.console .text {
    color: #fff;
}

.console .error {
    color: #f00;
}
</style>
