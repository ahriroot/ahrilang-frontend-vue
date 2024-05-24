<script setup lang="ts">
import { onMounted, ref, shallowRef } from "vue"
import * as echarts from "echarts"

const chart = shallowRef()
const view = ref<echarts.ECharts | null>(null)

type Data = {
    [x: string]: Data | number | string
}

type Props = {
    data: Data[]
}
const props = withDefaults(defineProps<Props>(), {
    data: () => [],
})

onMounted(() => {
    if (chart.value) {
        view.value = echarts.init(chart.value, "dark", { renderer: 'svg' });
        let options = {
            tooltip: {
                trigger: 'item',
                triggerOn: 'mousemove'
            },
            series: [
                {
                    type: 'tree',
                    data: props.data,
                    top: '1%',
                    left: '7%',
                    bottom: '1%',
                    right: '20%',
                    symbolSize: 0,
                    symbol: 'rect',
                    initialTreeDepth: 2,
                    label: {
                        backgroundColor: '#282c34',
                        color: '#fff',
                        padding: 10,
                        position: 'inside',
                        verticalAlign: 'middle',
                        align: 'right',
                        fontSize: 16,
                    },
                    leaves: {
                        label: {
                            position: 'right',
                            verticalAlign: 'middle',
                            align: 'left'
                        }
                    },
                    emphasis: {
                        focus: 'descendant'
                    },
                    expandAndCollapse: true,
                    animationDuration: 550,
                    animationDurationUpdate: 750
                }
            ],
        }
        view.value.setOption(options)
    }
})
</script>

<template>
    <div ref="chart" class="chart"></div>
</template>

<style scoped>
.chart {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}
</style>
