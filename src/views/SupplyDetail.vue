<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../services/api'
import { useSideMenu } from '../composables/useSideMenu'
import { fetchCurrentUser, getCurrentDriverId } from '../services/user'
import { statusClass } from '../utils/status'

const route = useRoute()
const router = useRouter()
const { toggle } = useSideMenu()

const id = computed(() => route.params.id)
const loading = ref(false)
const error = ref('')
const supply = ref(null)
const files = ref([]) // nomes retornados pelo endpoint /supplies/:id/files
const viewing = ref(null) // { name, url, type }
const showViewer = ref(false)
const statusLoading = ref(false)
const statusMessage = ref('')
// Comentário de aprovação/reprovação (limite 100 chars)
const approvalComment = ref('')
const maxComment = 100
const remainingChars = computed(() => maxComment - approvalComment.value.length)

function formatCurrency(v) {
    const n = Number(v)
    return (isNaN(n) ? 0 : n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function formatDate(iso) { if (!iso) return ''; const d = new Date(iso); return d.toLocaleDateString('pt-BR') }
const total = computed(() => {
    if (!supply.value) return 0
    return (Number(supply.value.liters) || 0) * (Number(supply.value.pricePerLiter) || 0)
})

async function load() {
    loading.value = true
    error.value = ''
    try {
        // garantir usuário carregado
        await fetchCurrentUser()
        const { data } = await api.get(`/supplies/${id.value}`)
        supply.value = data
        // Preencher comentário se já existir (caso supply já validado)
        if (data && data.approvalComment) {
            approvalComment.value = data.approvalComment
        }
        // Buscar lista de arquivos
        try {
            const { data: arr } = await api.get(`/supplies/${id.value}/files`)
            if (Array.isArray(arr)) files.value = arr
        } catch (fileErr) {
            console.warn('Falha ao carregar arquivos do supply', fileErr)
        }
    } catch (e) {
        error.value = 'Falha ao carregar abastecimento.'
        console.error(e)
    } finally { loading.value = false }
}

onMounted(load)

function back() { router.push({ name: 'gerenciamento' }) }

// Helpers arquivos
function buildFileUrl(name) { return `${api.defaults.baseURL}/supplies/${id.value}/files/${encodeURIComponent(name)}` }
function fileToObj(name) {
    const lower = name.toLowerCase()
    const ext = lower.split('.').pop() || ''
    const imgExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']
    const type = imgExts.includes(ext) ? `image/${ext === 'jpg' ? 'jpeg' : ext}` : 'application/octet-stream'
    return { name, url: buildFileUrl(name), type }
}
const pumpPhoto = computed(() => matchFirst(['pump', 'bomba']))
const odometerPhoto = computed(() => matchFirst(['odo', 'odometer', 'hodo', 'hodomet']))
const attachmentFilesRaw = computed(() => files.value.filter(f => !isSameFile(f, pumpPhoto.value) && !isSameFile(f, odometerPhoto.value)))
const attachmentFiles = computed(() => attachmentFilesRaw.value.map(fileToObj))

// Detecta se há algum dado de rota preenchido
const hasRouteData = computed(() => {
    if (!supply.value) return false
    const c1 = !!supply.value.stationCnpj
    const c2 = !!supply.value.stationName
    const c3 = !!supply.value.obs
    const c4 = attachmentFiles.value.length > 0
    return c1 || c2 || c3 || c4
})
function isSameFile(rawName, obj) { return obj && obj.name === rawName }
function matchFirst(keywords) {
    for (const f of files.value) {
        const lower = f.toLowerCase()
        if (keywords.some(k => lower.includes(k))) return fileToObj(f)
    }
    return null
}
function openViewer(file) { if (!file) return; viewing.value = file; showViewer.value = true }
function closeViewer() { showViewer.value = false; viewing.value = null }
function isImage(file) { return file && file.type.startsWith('image/') }

async function updateStatus(newStatus) {
    if (!supply.value) return
    statusMessage.value = ''
    statusLoading.value = true
    try {
        const approverId = getCurrentDriverId()
        if (!approverId) throw new Error('Usuário não carregado.')
        // Validação de comentário: obrigatório se rejeitar
        if (newStatus === 'REJECTED' && !approvalComment.value.trim()) {
            statusLoading.value = false
            statusMessage.value = 'Comentário é obrigatório ao rejeitar.'
            return
        }
        // Garantir limite de 100 caracteres
        if (approvalComment.value.length > maxComment) {
            approvalComment.value = approvalComment.value.slice(0, maxComment)
        }
        const payload = { approverId, status: newStatus, comment: approvalComment.value.trim() }
        const { data } = await api.patch(`/supplies/${supply.value.id}/status`, payload, { headers: { 'Content-Type': 'application/json' } })
        supply.value = data
        if (data && data.approvalComment) approvalComment.value = data.approvalComment
        statusMessage.value = newStatus === 'APPROVED' ? 'Abastecimento aprovado.' : 'Abastecimento rejeitado.'
    } catch (e) {
        console.error('Falha ao atualizar status', e)
        statusMessage.value = e?.response?.data?.message || 'Erro ao atualizar status.'
    } finally { statusLoading.value = false }
}

</script>

<template>
    <div class="page">
        <header class="app-bar">
            <button class="menu-btn" aria-label="menu" @click="toggle">☰</button>
            <a href="https://portal.acobrazil.com.br/" target="_blank" rel="noopener noreferrer">
                <img src="/src/assets/logoacobrazil.png" class="brand" alt="logo" />
            </a>
            <div class="actions" />
        </header>

        <main class="content">
            <div class="card detail-card">
                <div class="detail-head">
                    <h2 class="title-inline">Abastecimento <span v-if="supply?.status" class="status-dot"
                            :class="statusClass(supply.status)"></span></h2>
                    <span class="code">#{{ String(id).padStart(4, '0') }}</span>
                </div>
                <div v-if="error" class="error-msg">{{ error }}</div>
                <div v-else-if="loading" class="loading">Carregando...</div>
                <template v-else>
                    <div class="section-block">
                        <h3>Combustível</h3>
                        <div class="grid fuel">
                            <div class="field"><label>Qtd em litros</label><input disabled :value="supply?.liters" />
                            </div>
                            <div class="field"><label>Preço do litro</label><input disabled
                                    :value="supply?.pricePerLiter" /></div>
                            <div class="field"><label>Valor total</label><input disabled
                                    :value="formatCurrency(total)" /></div>
                            <div class="field img-btn"><label>Visualizar foto da bomba</label><button class="icon-view"
                                    :disabled="!pumpPhoto" @click="openViewer(pumpPhoto)">📷</button></div>
                        </div>
                    </div>
                    <div class="section-block">
                        <h3>Veículo</h3>
                        <div class="grid vehicle">
                            <div class="field"><label>Placa</label><input disabled
                                    :value="supply?.vehicle?.plate || supply?.plate" /></div>
                            <div class="field"><label>Tipo do veículo</label><input disabled value="-" /></div>
                            <div class="field"><label>Tipo de combust.</label><input disabled
                                    :value="supply?.fuelType || supply?.vehicle?.fuelType" /></div>
                            <div class="field"><label>Hodômetro</label><input disabled :value="supply?.odometer" />
                            </div>
                            <div class="field img-btn"><label>Visualizar hodômetro</label><button class="icon-view"
                                    :disabled="!odometerPhoto" @click="openViewer(odometerPhoto)">📷</button></div>
                        </div>
                    </div>
                    <div class="section-block route-block" :class="{ disabled: !hasRouteData }">
                        <h3>Em Rota <span class="pill" :class="hasRouteData ? 'on' : ''">{{ hasRouteData ? 'ATIVO' :
                                'VAZIO' }}</span></h3>
                        <div class="grid route">
                            <div class="field"><label>CNPJ do posto</label><input disabled :disabled="!hasRouteData"
                                    :value="supply?.stationCnpj || ''" /></div>
                            <div class="field"><label>Nome do posto</label><input disabled :disabled="!hasRouteData"
                                    :value="supply?.stationName || ''" /></div>
                            <div class="field"><label>Observações</label>
                                <textarea disabled :disabled="!hasRouteData" :value="supply?.obs || ''" rows="4"
                                    class="obs-textarea" />
                            </div>
                            <div class="field attachments-field">
                                <label>Outros anexos</label>
                                <div class="attachments-list" v-if="attachmentFiles.length">
                                    <button v-for="f in attachmentFiles" :key="f.name" class="attach-btn"
                                        @click="openViewer(f)">{{ f.name }}</button>
                                </div>
                                <div v-else class="no-attachments">Nenhum</div>
                            </div>
                        </div>
                    </div>
                    <div class="status-bar">
                        <div class="validation-comment" v-if="supply && (supply.status === 'C' || supply.status === 'CREATED' || supply.status === 'PENDING')">
                            <label for="approvalComment">Comentário (opcional ao aprovar / obrigatório ao rejeitar)</label>
                            <textarea id="approvalComment" v-model="approvalComment" :maxlength="maxComment" :disabled="statusLoading"
                                rows="3" placeholder="Descreva problemas ou observações (máx 100 caracteres)"></textarea>
                            <div class="comment-meta">
                                <span :class="{ limit: remainingChars <= 10 }">{{ remainingChars }} restantes</span>
                            </div>
                        </div>
                        <div class="validation-comment readonly" v-else-if="approvalComment">
                            <label>Comentário do avaliador</label>
                            <div class="comment-readonly">{{ approvalComment }}</div>
                        </div>
                        <div class="status-info">
                            <span v-if="statusLoading" class="loading-inline">Enviando...</span>
                            <span v-else-if="statusMessage" class="msg">{{ statusMessage }}</span>
                        </div>
                        <div class="actions-bar">
                            <button class="btn danger ghost" :disabled="statusLoading"
                                @click="updateStatus('REJECTED')">Rejeitar</button>
                            <button class="btn success ghost" :disabled="statusLoading"
                                @click="updateStatus('APPROVED')">Aprovar</button>
                            <button class="btn" :disabled="statusLoading" @click="back">Voltar</button>
                        </div>
                    </div>
                </template>
            </div>
        </main>
        <teleport to="body">
            <div v-if="showViewer" class="viewer-backdrop" @click.self="closeViewer">
                <div class="viewer">
                    <header class="viewer-head">
                        <span class="name">{{ viewing?.name }}</span>
                        <button class="close" @click="closeViewer">✕</button>
                    </header>
                    <div class="viewer-body">
                        <img v-if="isImage(viewing)" :src="viewing.url" :alt="viewing?.name" />
                        <div v-else class="not-image">
                            <p>Preview não disponível.</p>
                            <a :href="viewing?.url" target="_blank" rel="noopener" class="download-link">Download</a>
                        </div>
                    </div>
                    <footer class="viewer-footer">
                        <button class="btn" @click="closeViewer">Fechar</button>
                    </footer>
                </div>
            </div>
        </teleport>
    </div>
</template>

<style scoped>
.page {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}

.app-bar {
    position: sticky;
    top: 0;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background: #0b5d3b;
    color: #fff;
}

.menu-btn {
    background: transparent;
    border: none;
    color: #fff;
    font-size: 20px;
    cursor: pointer;
    justify-self: start;
}

.brand {
    height: 24px;
    justify-self: center;
}

.content {
    padding: 18px;
    max-width: 1000px;
    margin: 0 auto;
    width: 100%;
}

.title {
    margin: 4px 0 20px;
    font-size: 22px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
}

.title .muted {
    font-size: 14px;
    font-weight: 400;
    color: #6b7280;
}

.card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 24px 24px 34px;
}

.detail-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 18px;
}

.detail-head h2 {
    margin: 0;
    font-size: 18px;
}

.title-inline {
    display: flex;
    align-items: center;
    gap: 8px;
}

.status-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #9ca3af;
    box-shadow: 0 0 0 2px #fff, 0 0 0 3px #d1d5db;
}

.status-dot.green {
    background: #059669;
}

.status-dot.red {
    background: #dc2626;
}

.status-dot.orange {
    background: #ea8800;
}

.status-dot.gray {
    background: #9ca3af;
}

.code {
    font-weight: 600;
    font-size: 14px;
    color: #111827;
}

.section-block {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px 16px 14px;
    margin-bottom: 18px;
}

.section-block h3 {
    margin: 0 0 12px;
    font-size: 15px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 14px 18px;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.field label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .5px;
    color: #374151;
    font-weight: 600;
}

.field input {
    height: 30px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 0 8px;
    font-size: 13px;
    background: #fff;
}

.field input[disabled] {
    background: #f8f9fa;
    color: #111;
}

.field textarea {
    min-height: 70px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 6px 8px;
    font-size: 13px;
    background: #fff;
    resize: vertical;
    line-height: 1.35;
    white-space: pre-wrap;
}

.field textarea[disabled] {
    background: #f8f9fa;
    color: #111;
}

.img-btn button {
    width: 40px;
    height: 30px;
    border: 1px solid #0b5d3b;
    background: #0b5d3b;
    color: #fff;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 16px;
}

.img-btn button:disabled {
    background: #9ca3af;
    border-color: #9ca3af;
    cursor: default;
}

.pill {
    background: #e5e7eb;
    color: #374151;
    font-size: 10px;
    padding: 3px 8px;
    border-radius: 999px;
    font-weight: 600;
}

.pill.on {
    background: #065f46;
    color: #fff;
}

.actions-bar {
    display: flex;
    gap: 16px;
    justify-content: flex-end;
    padding-top: 8px;
}

.status-bar {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 4px;
}

.validation-comment {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.validation-comment label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .5px;
    color: #374151;
    font-weight: 600;
}

.validation-comment textarea {
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 6px 8px;
    font-size: 13px;
    background: #fff;
    resize: vertical;
    line-height: 1.35;
}

.validation-comment textarea:disabled {
    background: #f3f4f6;
}

.comment-meta {
    display: flex;
    justify-content: flex-end;
    font-size: 11px;
    color: #6b7280;
}

.comment-meta .limit { color: #b91c1c; font-weight: 600; }

.validation-comment.readonly .comment-readonly {
    background: #f8f9fa;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 8px 10px;
    font-size: 13px;
    white-space: pre-wrap;
    line-height: 1.4;
}

.status-info {
    font-size: 12px;
    color: #374151;
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    align-items: center;
}

.current-status strong {
    font-weight: 600;
}

.loading-inline {
    color: #065f46;
    font-weight: 500;
}

.msg {
    color: #065f46;
    font-weight: 500;
}

.btn {
    height: 34px;
    border-radius: 20px;
    border: 1px solid #0b5d3b;
    background: #fff;
    padding: 0 18px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
}

.btn:hover {
    background: #f3f4f6;
}

.btn.success {
    color: #065f46;
    border-color: #065f46;
}

.btn.danger {
    color: #b91c1c;
    border-color: #b91c1c;
}

.btn.ghost {
    background: #fff;
}

.error-msg,
.loading {
    text-align: center;
    padding: 40px 8px;
    font-size: 14px;
}

/* Viewer */
.viewer-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, .5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    padding: 24px;
}

.viewer {
    background: #fff;
    border-radius: 12px;
    width: min(900px, 100%);
    max-height: 100%;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 30px -8px rgba(0, 0, 0, .35), 0 4px 12px -4px rgba(0, 0, 0, .25);
}

.viewer-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #e5e7eb;
}

.viewer-head .name {
    font-size: 14px;
    font-weight: 600;
}

.viewer-head .close {
    background: transparent;
    border: none;
    font-size: 18px;
    cursor: pointer;
}

.viewer-body {
    padding: 16px;
    overflow: auto;
    display: flex;
    justify-content: center;
}

.viewer-body img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, .15);
}

.not-image {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.download-link {
    color: #0b5d3b;
    font-weight: 600;
    text-decoration: none;
}

.viewer-footer {
    padding: 12px 16px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
}

/* Route block disabled */
.route-block.disabled {
    opacity: .55;
}

.attachments-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.attachments-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.attach-btn {
    background: #0b5d3b;
    color: #fff;
    border: 1px solid #0b5d3b;
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 12px;
    cursor: pointer;
}

.attach-btn:hover {
    background: #094d31;
}

.route-block.disabled .attach-btn {
    pointer-events: none;
}

.no-attachments {
    font-size: 12px;
    color: #6b7280;
}

@media (max-width:640px) {
    .grid {
        grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    }
}
</style>
