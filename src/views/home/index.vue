<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const handlePlayground = () => {
    router.push({ name: 'playground' })
}

const handleDocs = () => {
    router.push({ name: 'docs' })
}
</script>

<template>
    <button @click="handlePlayground">Playground</button>
    <button @click="handleDocs">Docs</button>
</template>

<style scoped></style>
