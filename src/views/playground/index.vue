<script setup lang='ts'>
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import * as monaco from 'monaco-editor'
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { VirtualMachine, Lexer, Parser, Compiler } from 'ahrilang-js'

import JsonView from '@/components/JsonView.vue'

(self as any).MonacoEnvironment = {
    getWorker(_: string, _label: string) {
        return new EditorWorker()
    },
}
const ide = shallowRef()
const editor = shallowRef()
const output = ref<any[]>([])

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

const save = (event: KeyboardEvent) => {
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault()
        setStorage()
    }
}

onMounted(async () => {
    window.addEventListener('resize', resize)

    if (ide.value) {
        ide.value.addEventListener('keydown', save)
        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: true,
            noSyntaxValidation: false,
        })
        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ES2020,
            allowNonTsExtensions: true,
        })
        monaco.languages.register({
            id: 'ahrilang',
        })
        monaco.languages.registerCompletionItemProvider('ahrilang', {
            provideCompletionItems: function (_model, position) {
                return {
                    suggestions: [
                        {
                            label: 'use',
                            kind: monaco.languages.CompletionItemKind.Keyword,
                            insertText: 'use ',
                            range: {
                                startLineNumber: position.lineNumber,
                                startColumn: position.column - 3,
                                endLineNumber: position.lineNumber,
                                endColumn: position.column
                            }
                        },
                        {
                            label: 'mod',
                            kind: monaco.languages.CompletionItemKind.Keyword,
                            insertText: 'mod ',
                            range: {
                                startLineNumber: position.lineNumber,
                                startColumn: position.column - 3,
                                endLineNumber: position.lineNumber,
                                endColumn: position.column
                            }
                        },
                    ]
                }
            }
        })
        monaco.languages.registerOnTypeFormattingEditProvider('ahrilang', {
            autoFormatTriggerCharacters: ['(', ')'],
            provideOnTypeFormattingEdits: function (model, position, ch, _options, _token) {
                // 当用户输入 ( 或 ) 时触发

                // 如果输入的是 (，则自动添加 )
                if (ch === '(') {
                    var text = ')'
                    var range = new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column)
                    return [{
                        range: range,
                        text: text
                    }]
                }

                // 如果输入的是 )，则检查光标前面的字符是否是 (
                if (ch === ')') {
                    var prevCharPosition = new monaco.Position(position.lineNumber, Math.max(1, position.column - 1))
                    var prevChar = model.getValueInRange(new monaco.Range(prevCharPosition.lineNumber, prevCharPosition.column, position.lineNumber, position.column))
                    if (prevChar === '(') {
                        // 如果前一个字符是 (，则不做任何处理
                        return []
                    }
                }

                // 其他情况下，不做任何处理
                return []
            }
        })
        monaco.languages.setMonarchTokensProvider('ahrilang', {
            tokenizer: {
                root: [
                    [/\b(?:use|mod|class|fn|if|else|loop|while|continue|break|return|true|false|int|float|string|print)\b/, { token: 'keyword' }],
                    [/\d+/, { token: 'number' }], // 匹配数字
                    [/[a-z]+/, { token: 'string' }], // 匹配字符串
                    [/\bif\b|\belse\b/, { token: 'keyword.control' }], // 匹配关键字 if 和 else
                    [/[+\-*/]/, { token: 'operator' }], // 匹配运算符
                    [/\/\/.*/, { token: 'comment' }], // 匹配单行注释
                    [/\b[a-z]+\b/, "identifier"],
                    [/\/\*/, "comment", "@comment"],
                ],
                // 多行注释规则
                comment: [
                    [/\*\//, "comment", "@pop"],  // 多行注释结束
                    [/./, "comment"]
                ]
            }
        })
        const code = localStorage.getItem('code') || ''

        editor.value = monaco.editor.create(ide.value, {
            value: code,
            language: 'ahrilang',
            readOnly: false,
            theme: 'vs-dark',
            mouseWheelZoom: true,
            fontSize: 24,
        })

        editor.value.onDidChangeModelContent(async () => {
            setStorage()
        })
    }
})

const timerId = ref<NodeJS.Timeout | null>(null)
const setStorage = () => {
    if (timerId.value) {
        clearTimeout(timerId.value)
    }
    if (editor.value) {
        timerId.value = setTimeout(() => {
            localStorage.setItem('code', editor.value.getValue())
        }, 1000)
    }
}

const handleRun = () => {
    const value = editor.value.getValue()
    const builtins = {
        print: (arg: string) => {
            output.value.push(arg)
        }
    }
    VirtualMachine.interpret(value, [], builtins)
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
    const value = editor.value.getValue()
    const lexer = new Lexer(value)
    const tokens = lexer.get_tokens()
    maskData.value = tokens
    mask.value = true
}

const tree = (data: any[]): any => {
    let res: any[] = []
    for (const item of data) {
        if (typeof item === 'object') {
            if ('type' in item) {
                let type = item.type
                switch (type) {
                    case 'Program':
                        res.push({
                            name: 'Program',
                            children: tree(item.expressions)
                        })
                        break
                    case 'Statement':
                        // res.push({
                        //     name: 'Statement',
                        //     children: tree([item.expression])
                        // })
                        // // 合并 []
                        res = res.concat(tree([item.expression]))
                        break
                    default:
                        res.push({
                            name: type,
                            children: Object.keys(item).filter((key) => key !== 'type').map((key) => {
                                return {
                                    name: key,
                                    children: tree([item[key]])
                                }
                            })
                        })
                        break
                }
            } else {
                Object.keys(item).map((key) => {
                    res.push({
                        name: key,
                        children: tree([item[key]])
                    })
                })
            }
        } else {
            res.push({ name: item })
        }
    }
    return res
}

const handleAst = () => {
    const value = editor.value.getValue()
    const lexer = new Lexer(value)
    const parser = new Parser(lexer)
    const ast = parser.parse() as any

    console.log(ast)

    maskData.value = tree([ast])
    mask.value = true
}

const handleInst = () => {
    const value = editor.value.getValue()
    const lexer = new Lexer(value)
    const parser = new Parser(lexer)
    const ast = parser.parse()
    const compiler = new Compiler([], [])
    const inst = compiler.compile(ast)
    maskData.value = inst
    mask.value = true
}

onBeforeUnmount(() => {
    if (timerId.value) {
        clearTimeout(timerId.value)
    }
    if (editor.value) {
        editor.value.dispose()
    }
    window.removeEventListener('resize', resize)
    if (ide.value) {
        ide.value.removeEventListener('keydown', save)
    }
})
</script>

<template>
    <div id="code">
        <div class="mask" v-if="mask">
            <button class="btn" @click="handleClose">Close</button>
            <JsonView :data="maskData" />
        </div>
        <div ref="ide" class="ide" id="ide"></div>
        <div class="output" id="output">
            <div class="opera">
                <button class="btn" @click="handleRun">Run</button>
                <button class="btn" @click="handleClear">Clear</button>
                <button class="btn" @click="handleToken">Token</button>
                <button class="btn" @click="handleAst">Ast</button>
                <button class="btn" @click="handleInst">Inst</button>
            </div>
            <div class="console">
                <div v-for="(item, index) in output" :key="index">{{ item }}</div>
            </div>
        </div>
    </div>
</template>

<style scoped>
#code {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}

#code .mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 100;
    background-color: #242424;
    overflow-y: auto;
}

#ide {
    position: absolute;
    top: 0;
    left: 0;
    right: 600px;
    bottom: 0;
}

#output {
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
    cursor: pointer;
    padding: 5px 10px;
}

.console {
    position: absolute;
    top: 60px;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 10px;
}
</style>
