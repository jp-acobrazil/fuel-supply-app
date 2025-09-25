export function statusClass(code) {
  const c = (code || '').toUpperCase()
  if (c === 'A' || c === 'APPROVED') return 'green'
  if (c === 'R' || c === 'REJECTED') return 'red'
  if (c === 'C' || c === 'CREATED' || c === 'PENDING') return 'orange'
  return 'gray'
}
