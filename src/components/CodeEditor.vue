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
                if (ch === '(') {
                    var text = ')'
                    var range = new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column)
                    return [{
                        range: range,
                        text: text
                    }]
                }

                if (ch === ')') {
                    var prevCharPosition = new monaco.Position(position.lineNumber, Math.max(1, position.column - 1))
                    var prevChar = model.getValueInRange(new monaco.Range(prevCharPosition.lineNumber, prevCharPosition.column, position.lineNumber, position.column))
                    if (prevChar === '(') {
                        return []
                    }
                }
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

        editor.value = monaco.editor.create(ide.value, {
            value: props.code,
            language: 'ahrilang',
            readOnly: false,
            theme: 'vs-dark',
            mouseWheelZoom: true,
            fontSize: props.fontSize,
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
