<script setup>
const props = defineProps({
    title: { type: String, required: true },
    headers: { type: Array, default: () => [] },
    rows: { type: Array, default: () => [] }
})
</script>

<template>
    <section class="card">
        <h2 class="section-title">{{ props.title }}</h2>
        <div class="table">
            <div class="thead">
                <div v-for="h in props.headers" :key="h" class="th">{{ h }}</div>
            </div>
            <div class="tbody">
                <div v-for="(r, i) in props.rows" :key="i" class="tr">
                    <div class="td id">
                        <a href="#" class="link">{{ r.id }}</a>
                    </div>
                    <div class="td">{{ r.placa }}</div>
                    <div class="td">{{ r.data }}</div>
                    <div class="td" v-if="r.valor !== undefined">{{ r.valor }}</div>
                    <div class="td status">
                        <span class="dot" :class="r.statusColor" />
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.card {
    background: var(--card-bg, #fff);
    border-radius: 10px;
    padding: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, .1);
    border: 1px solid rgba(0, 0, 0, .05);
    margin-bottom: 12px;
}

.section-title {
    font-size: 16px;
    margin: 0 0 8px;
}

.table {
    width: 100%;
}

.thead,
.tr {
    display: grid;
    grid-template-columns: 1.1fr 1fr 1fr .9fr .6fr;
    align-items: center;
    column-gap: 8px;
}

.thead {
    font-size: 11px;
    color: #6b7280;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 6px;
}

.tbody .tr {
    padding: 8px 0;
    border-bottom: 1px solid #f1f5f9;
}

.td.id .link {
    color: #10b981;
    font-weight: 600;
    text-decoration: none;
}

.td.status {
    display: flex;
    justify-content: center;
}

.dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    display: inline-block;
}

.dot.green {
    background: #22c55e;
}

.dot.orange {
    background: #f59e0b;
}

@media (max-width: 380px) {

    .thead,
    .tr {
        grid-template-columns: 1fr .9fr .9fr .8fr .4fr;
    }
}
</style>
