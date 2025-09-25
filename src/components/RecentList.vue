<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const props = defineProps({
    title: { type: String, required: true },
    headers: { type: Array, default: () => [] },
    rows: { type: Array, default: () => [] }
})
const router = useRouter()
const openId = ref(null)
function toggle(r){ openId.value = openId.value === r.id ? null : r.id }
function resolveId(r){ return r.rawId != null ? r.rawId : (typeof r.id === 'string' ? r.id.replace(/[^0-9]/g,'') : r.id) }
function viewSupply(r){ router.push({ name: 'supply-driver-view', params: { id: resolveId(r) } }) }
function respondSupply(r){ router.push({ name: 'supply-edit', params: { id: resolveId(r) } }) }
</script>

<template>
    <section class="card">
        <div class="table">
            <div class="thead">
                <div v-for="h in props.headers" :key="h" class="th">{{ h }}</div>
            </div>
            <div class="tbody">
                <div v-for="(r, i) in props.rows" :key="i" class="tr">
                    <div class="td id">
                        <a href="#" class="link" @click.prevent="viewSupply(r)">{{ r.id }}</a>
                    </div>
                    <div class="td">{{ r.placa }}</div>
                    <div class="td">{{ r.data }}</div>
                    <div class="td" v-if="r.valor !== undefined">{{ r.valor }}</div>
                    <div class="td status">
                        <span class="dot" :class="r.statusColor" />
                    </div>
                    <div class="td actions">
                        <button class="btn-more" @click="toggle(r)" aria-label="ações">⋮</button>
                        <div v-if="openId === r.id" class="menu">
                            <button @click="viewSupply(r)">Visualizar</button>
                            <button v-if="r.status === 'R'" @click="respondSupply(r)">Responder</button>
                        </div>
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
    grid-template-columns: 1.1fr 1fr 1fr .9fr .6fr .4fr;
    align-items: center;
    column-gap: 8px;
}

.thead {
    font-size: 12px;
    color: #6b7280;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 6px;
}

.th {
    text-align: center;
}

.tbody .tr {
    padding: 8px 0;
    border-bottom: 1px solid #f1f5f9;
}

.tr {
    font-size: 12px;
    text-align: center;
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

.dot.red {
    background: #dc2626;
}

.dot.gray {
    background: #9ca3af;
}

@media (max-width: 380px) {

    .thead,
    .tr {
        grid-template-columns: 1fr .9fr .9fr .8fr .4fr .4fr;
    }
}

.td.actions { position: relative; display:flex; justify-content:center; }
.btn-more { background:transparent; border:none; cursor:pointer; font-size:18px; line-height:1; padding:4px; }
.menu { position:absolute; top:100%; right:0; background:#fff; border:1px solid #e5e7eb; box-shadow:0 4px 12px rgba(0,0,0,.12); border-radius:6px; padding:6px; display:flex; flex-direction:column; gap:4px; z-index:20; }
.menu button { background:#fff; border:none; padding:4px 8px; font-size:12px; text-align:left; cursor:pointer; border-radius:4px; }
.menu button:hover { background:#f3f4f6; }
</style>
