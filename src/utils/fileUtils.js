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