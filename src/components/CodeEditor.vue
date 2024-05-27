<script setup lang='ts'>
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import * as monaco from 'monaco-editor'
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'

(self as any).MonacoEnvironment = {
    getWorker(_: string, _label: string) {
        return new EditorWorker()
    },
}

const props = withDefaults(defineProps<{ code: string, fontSize?: number }>(), {
    code: () => "",
    fontSize: 20
})

const emits = defineEmits(['changed'])

const ide = shallowRef()
const editor = shallowRef()

let timer = ref<NodeJS.Timeout | null>(null)
const resize = () => {
    if (timer.value !== null) {
        clearTimeout(timer.value)
    }
    if (editor.value) {
        timer.value = setTimeout(() => {
            editor.value.layout()
        }, 200)
    }
}

onMounted(async () => {
    window.addEventListener('resize', resize)

    if (ide.value) {
        monaco.languages.register({
            id: 'ahrilang',
        })
        monaco.languages.setMonarchTokensProvider('ahrilang', {
            keywords: [
                'mod',
                'pub',
                'use',
                'as',
                'class',
                'async',
                'await',
                'fn',
                'return',
                'if',
                'else',
                'for',
                'while',
                'loop',
                'continue',
                'break',
                'true',
                'false',
                'print',
            ],
            operators: [
                '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
                '&&', '||', '+', '-', '*', '/', '&', '|', '^', '%',
                '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
                '%=', '<<=', '>>=',
            ],
            symbols: /[=><!~?:&|+\-*\/\^%]+/,
            escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
            tokenizer: {
                root: [
                    [/[a-z](\w|\-[a-zA-Z])*/, {
                        cases: {
                            '@keywords': 'keyword',
                            '@default': 'identifier'
                        }
                    }],
                    { include: '@whitespace' },
                    [/[{}()\[\]]/, '@brackets'],
                    [/@symbols/, {
                        cases: {
                            '@operators': 'operator',
                            '@default': ''
                        }
                    }],
                    [/@\s*[a-zA-Z_\$][\w\$]*/, { token: 'annotation', log: 'annotation token: $0' }],
                    [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
                    [/0[xX][0-9a-fA-F]+/, 'number.hex'],
                    [/\d+/, 'number'],
                    [/[;,.]/, 'delimiter'],
                    [/"([^"\\]|\\.)*$/, 'string.invalid'],
                    [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
                    [/'[^\\']'/, 'string'],
                    [/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
                    [/'/, 'string.invalid']
                ],
                comment: [
                    [/[^\/*]+/, 'comment'],
                    [/\/\*/, 'comment', '@push'],
                    ["\\*/", 'comment', '@pop'],
                    [/[\/*]/, 'comment']
                ],
                string: [
                    [/[^\\"]+/, 'string'],
                    [/@escapes/, 'string.escape'],
                    [/\\./, 'string.escape.invalid'],
                    [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
                ],
                whitespace: [
                    [/[ \t\r\n]+/, 'white'],
                    [/\/\*/, 'comment', '@comment'],
                    [/\/\/.*$/, 'comment'],
                ],
            }
        })

        editor.value = monaco.editor.create(ide.value, {
            value: props.code,
            language: 'ahrilang',
            readOnly: false,
            theme: 'vs-dark',
            mouseWheelZoom: true,
            fontSize: props.fontSize,
        })

        editor.value.onDidChangeModelContent(() => {
            emits('changed', getCode())
        })
    }
})

const getCode = () => {
    if (editor.value) {
        return editor.value.getValue()
    }
    throw new Error('editor is null')
}

const setCode = (code: string) => {
    if (editor.value) {
        editor.value.setValue(code)
    } else {
        throw new Error('editor is null')
    }
}
defineExpose({
    getCode,
    setCode
})

onBeforeUnmount(() => {
    if (editor.value) {
        editor.value.dispose()
    }
    window.removeEventListener('resize', resize)
})
</script>

<template>
    <div ref="ide" class="ide" id="ide"></div>
</template>

<style scoped>
#ide {
    width: 100%;
    height: 100%;
}
</style>
