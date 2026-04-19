import { MODULES } from '../store/index.js'

/** Module IDs granted by this key (hỗ trợ dữ liệu cũ nhiều module). */
export function keyModuleIds(k) {
  const raw = []
  if (k.module && typeof k.module === 'string') raw.push(k.module.trim())
  if (Array.isArray(k.modules)) raw.push(...k.modules)
  const seen = new Set()
  const out = []
  for (const id of raw) {
    if (!id || seen.has(id)) continue
    if (!MODULES.some(m => m.id === id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

export function primaryModuleMeta(k) {
  const id = keyModuleIds(k)[0]
  return id ? MODULES.find(m => m.id === id) : null
}
