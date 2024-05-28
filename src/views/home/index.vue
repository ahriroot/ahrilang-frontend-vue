<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router'
import Prism from "prismjs"
import "prismjs/plugins/line-numbers/prism-line-numbers.min.js"
import "prismjs/themes/prism-tomorrow.min.css"
import "prismjs/plugins/line-numbers/prism-line-numbers.min.css"

const router = useRouter()

onMounted(async () => {
    nextTick(() => {
        Prism.highlightAll()
    })
})

const handlePlayground = () => {
    router.push({ name: 'playground' })
}

const handleDocs = () => {
    router.push({ name: 'docs' })
}

const codeIf = ref<string>(`a = 0

if a > 0 {
    print("greater than 0")
} else if a < 0 {
    print("less than 0")
} else {
    print("equal to 0")
}`)

const codeLoop = ref<string>(`a = 0
loop {
    print(a)
    a = a + 1
    if a < 10 {
        continue
    }
    break
}`)
</script>

<template>
    <div class="index">
        <div class="title">AHRILANG</div>
        <div class="link">
            <button class="btn" @click="handleDocs">Docs</button>
            <button class="btn" @click="handlePlayground">Playground</button>
        </div>
        <div class="example">
            <div class="item">
                <pre class="language-js"><code>{{ codeIf }}</code></pre>
            </div>
            <div class="item">
                <pre class="language-js"><code>{{ codeLoop }}</code></pre>
            </div>
        </div>
    </div>
</template>

<style scoped>
.index {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 20px;
}

.index .title {
    font-size: 82px;
    font-weight: 600;
}

.index .link {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
}

.index .link .btn {
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

.index .link .btn:hover {
    background-color: #1eaf28;
}

.index .link .btn:active {
    background-color: #1afa29;
}

.index .example {
    width: 600px;
    display: flex;
    gap: 10px;
}

.index .example .item {
    width: 300px;
}
</style>
