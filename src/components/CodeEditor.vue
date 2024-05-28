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
        monaco.languages.setLanguageConfiguration('ahrilang', {
            wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\`\'\"\,\.\<\>\/\?\s]+)/g,
            comments: {
                lineComment: "//",
                blockComment: ["/*", "*/"]
            },
            brackets: [
                ["{", "}"],
                ["[", "]"],
                ["(", ")"]
            ],
            autoClosingPairs: [
                { open: "{", close: "}" },
                { open: "[", close: "]" },
                { open: "(", close: ")" },
                { open: '"', close: '"', notIn: ["string"] },
                { open: "'", close: "'", notIn: ["string", "comment"] },
                { open: "`", close: "`", notIn: ["string", "comment"] },
                { open: "/**", close: " */", notIn: ["string"] }
            ],
            folding: {
                markers: {
                    start: new RegExp("^\\s*//\\s*#?region\\b"),
                    end: new RegExp("^\\s*//\\s*#?endregion\\b")
                }
            }
        })
        monaco.languages.setMonarchTokensProvider('ahrilang', {
            defaultToken: "invalid",
            tokenPostfix: ".a",
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
                "<=",
                ">=",
                "==",
                "!=",
                "===",
                "!==",
                "=>",
                "+",
                "-",
                "**",
                "*",
                "/",
                "%",
                "++",
                "--",
                "<<",
                "</",
                ">>",
                ">>>",
                "&",
                "|",
                "^",
                "!",
                "~",
                "&&",
                "||",
                "??",
                "?",
                ":",
                "=",
                "+=",
                "-=",
                "*=",
                "**=",
                "/=",
                "%=",
                "<<=",
                ">>=",
                ">>>=",
                "&=",
                "|=",
                "^=",
                "@"
            ],
            // we include these common regular expressions
            symbols: /[=><!~?:&|+\-*\/\^%]+/,
            escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
            digits: /\d+(_+\d+)*/,
            octaldigits: /[0-7]+(_+[0-7]+)*/,
            binarydigits: /[0-1]+(_+[0-1]+)*/,
            hexdigits: /[[0-9a-fA-F]+(_+[0-9a-fA-F]+)*/,
            regexpctl: /[(){}\[\]\$\^|\-*+?\.]/,
            regexpesc: /\\(?:[bBdDfnrstvwWn0\\\/]|@regexpctl|c[A-Z]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4})/,
            // The main tokenizer for our languages
            tokenizer: {
                root: [[/[{}]/, "delimiter.bracket"], { include: "common" }],
                common: [
                    // identifiers and keywords
                    [
                        /#?[a-z_$][\w$]*/,
                        {
                            cases: {
                                "@keywords": "keyword",
                                "@default": "identifier"
                            }
                        }
                    ],
                    [/[A-Z][\w\$]*/, "type.identifier"],
                    // to show class names nicely
                    // [/[A-Z][\w\$]*/, 'identifier'],
                    // whitespace
                    { include: "@whitespace" },
                    // delimiters and operators
                    [/[()\[\]]/, "@brackets"],
                    [/[<>](?!@symbols)/, "@brackets"],
                    [/!(?=([^=]|$))/, "delimiter"],
                    [
                        /@symbols/,
                        {
                            cases: {
                                "@operators": "delimiter",
                                "@default": ""
                            }
                        }
                    ],
                    // numbers
                    [/(@digits)[eE]([\-+]?(@digits))?/, "number.float"],
                    [/(@digits)\.(@digits)([eE][\-+]?(@digits))?/, "number.float"],
                    [/0[xX](@hexdigits)n?/, "number.hex"],
                    [/0[oO]?(@octaldigits)n?/, "number.octal"],
                    [/0[bB](@binarydigits)n?/, "number.binary"],
                    [/(@digits)n?/, "number"],
                    // delimiter: after number because of .\d floats
                    [/[;,.]/, "delimiter"],
                    // strings
                    [/"([^"\\]|\\.)*$/, "string.invalid"],
                    // non-teminated string
                    [/'([^'\\]|\\.)*$/, "string.invalid"],
                    // non-teminated string
                    [/"/, "string", "@string_double"],
                    [/'/, "string", "@string_single"],
                    [/`/, "string", "@string_backtick"]
                ],
                whitespace: [
                    [/[ \t\r\n]+/, ""],
                    [/\/\*\*(?!\/)/, "comment.doc", "@aldoc"],
                    [/\/\*/, "comment", "@comment"],
                    [/\/\/.*$/, "comment"]
                ],
                comment: [
                    [/[^\/*]+/, "comment"],
                    [/\*\//, "comment", "@pop"],
                    [/[\/*]/, "comment"]
                ],
                aldoc: [
                    [/[^\/*]+/, "comment.doc"],
                    [/\*\//, "comment.doc", "@pop"],
                    [/[\/*]/, "comment.doc"]
                ],
                string_double: [
                    [/[^\\"]+/, "string"],
                    [/@escapes/, "string.escape"],
                    [/\\./, "string.escape.invalid"],
                    [/"/, "string", "@pop"]
                ],
                string_single: [
                    [/[^\\']+/, "string"],
                    [/@escapes/, "string.escape"],
                    [/\\./, "string.escape.invalid"],
                    [/'/, "string", "@pop"]
                ],
                string_backtick: [
                    [/\$\{/, { token: "delimiter.bracket", next: "@bracketCounting" }],
                    [/[^\\`$]+/, "string"],
                    [/@escapes/, "string.escape"],
                    [/\\./, "string.escape.invalid"],
                    [/`/, "string", "@pop"]
                ],
                bracketCounting: [
                    [/\{/, "delimiter.bracket", "@bracketCounting"],
                    [/\}/, "delimiter.bracket", "@pop"],
                    { include: "common" }
                ]
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
