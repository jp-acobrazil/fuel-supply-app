// Utilitários para manipulação de arquivos

/**
 * Comprime uma imagem reduzindo sua qualidade e/ou dimensões
 * @param {File} file - Arquivo de imagem original
 * @param {number} maxWidth - Largura máxima (default: 1920)
 * @param {number} maxHeight - Altura máxima (default: 1080) 
 * @param {number} quality - Qualidade da compressão 0-1 (default: 0.8)
 * @param {number} maxSizeKB - Tamanho máximo em KB (default: 2048)
 * @returns {Promise<File>} - Arquivo comprimido
 */
export function compressImage(file, maxWidth = 1920, maxHeight = 1080, quality = 0.8, maxSizeKB = 2048) {
  return new Promise((resolve, reject) => {
    // Se não for imagem, retorna o arquivo original
    if (!file.type.startsWith('image/')) {
      resolve(file)
      return
    }

    // Se já está menor que o limite, retorna o original
    if (file.size <= maxSizeKB * 1024) {
      resolve(file)
      return
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calcular novas dimensões mantendo aspect ratio
      let { width, height } = img
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      canvas.width = width
      canvas.height = height

      // Desenhar e comprimir
      ctx.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob((blob) => {
        if (blob) {
          // Criar novo File com mesmo nome e tipo
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          })
          
          console.log(`Imagem comprimida: ${(file.size / 1024).toFixed(1)}KB -> ${(compressedFile.size / 1024).toFixed(1)}KB`)
          resolve(compressedFile)
        } else {
          reject(new Error('Falha ao comprimir imagem'))
        }
      }, file.type, quality)
    }

    img.onerror = () => reject(new Error('Falha ao carregar imagem'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Comprime iterativamente uma imagem para atingir um tamanho alvo em KB.
 * Reduz a qualidade gradualmente e, se necessário, reduz dimensões.
 * Retorna a melhor tentativa (pode ficar acima do alvo se atingir limites mínimos).
 *
 * @param {File} file
 * @param {object} opts
 * @param {number} opts.targetKB - Tamanho alvo por arquivo (KB)
 * @param {number} [opts.maxWidth=1280]
 * @param {number} [opts.maxHeight=720]
 * @param {number} [opts.initialQuality=0.7]
 * @param {number} [opts.minQuality=0.4]
 * @param {number} [opts.qualityStep=0.1]
 * @param {number} [opts.minWidth=640]
 * @param {number} [opts.minHeight=480]
 * @returns {Promise<File>}
 */
export async function compressImageToTarget(file, opts = {}) {
  const {
    targetKB,
    maxWidth = 1280,
    maxHeight = 720,
    initialQuality = 0.7,
    minQuality = 0.4,
    qualityStep = 0.1,
    minWidth = 640,
    minHeight = 480,
  } = opts

  if (!file?.type?.startsWith('image/')) return file
  if (!targetKB || targetKB <= 0) return file

  let best = file
  let curWidth = maxWidth
  let curHeight = maxHeight
  let quality = initialQuality

  for (let attempts = 0; attempts < 10; attempts++) {
    const compressed = await compressImage(best, curWidth, curHeight, quality, targetKB)
    if (compressed.size < best.size) best = compressed

    if (best.size <= targetKB * 1024) break

    // Tenta reduzir qualidade
    if (quality - qualityStep >= minQuality) {
      quality = Math.max(minQuality, quality - qualityStep)
      continue
    }

    // Reduz dimensões se possível
    const nextWidth = Math.floor(curWidth * 0.9)
    const nextHeight = Math.floor(curHeight * 0.9)
    if (nextWidth >= minWidth && nextHeight >= minHeight) {
      curWidth = nextWidth
      curHeight = nextHeight
      // Após reduzir dimensões, tente com qualidade inicial novamente
      quality = initialQuality
      continue
    }

    // Não dá para reduzir mais
    break
  }

  return best
}

/**
 * Valida o tamanho total (em KB) de uma lista de arquivos.
 * @param {File[]} files
 * @param {number} maxTotalKB
 */
export function validateTotalSize(files, maxTotalKB) {
  const totalBytes = (files || []).reduce((acc, f) => acc + (f?.size || 0), 0)
  return totalBytes <= maxTotalKB * 1024
}

/**
 * Valida se o arquivo está dentro dos limites de tamanho
 * @param {File} file - Arquivo a validar
 * @param {number} maxSizeKB - Tamanho máximo em KB
 * @returns {boolean} - true se válido
 */
export function validateFileSize(file, maxSizeKB = 5120) { // 5MB default
  return file.size <= maxSizeKB * 1024
}

/**
 * Formata tamanho de arquivo para exibição
 * @param {number} bytes - Tamanho em bytes
 * @returns {string} - Tamanho formatado (ex: "2.3 MB")
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}