const { addDays, format, formatISO } = require('date-fns')
const JSZip = require('jszip')
const crypto = require('crypto')
const { v4: uuidv4 } = require('uuid')

const MODULES = [
  { id:'loading',             name:'Loading',             groupCode:'A', icon:'⬇️', color:'#6366f1' },
  { id:'analysis',            name:'Analysis',            groupCode:'B', icon:'📐', color:'#0ea5e9' },
  { id:'reinforced_concrete', name:'Reinforced Concrete', groupCode:'C', icon:'🧱', color:'#78716c' },
  { id:'steel',               name:'Steel',               groupCode:'D', icon:'🔩', color:'#64748b' },
  { id:'composite',           name:'Composite',           groupCode:'E', icon:'🔗', color:'#8b5cf6' },
  { id:'timber',              name:'Timber',              groupCode:'F', icon:'🪵', color:'#b45309' },
  { id:'geotechnical',        name:'Geotechnical',        groupCode:'G', icon:'🌍', color:'#059669' },
  { id:'connections',         name:'Connections',         groupCode:'H', icon:'⚙️', color:'#d97706' },
  { id:'general',             name:'General',             groupCode:'I', icon:'📋', color:'#6b7280' },
]

const KEY_PLANS = {
  full6m:    { label:'Full Access · 6 tháng', days:182, allMods:true  },
  full1y:    { label:'Full Access · 1 năm',   days:365, allMods:true  },
  desktop1y: { label:'Desktop App · 1 năm',   days:365, allMods:false },
  custom:    { label:'Tùy chỉnh',              days:null,allMods:false },
}

const genKeyCode = () => {
  const s = () => Math.random().toString(36).slice(2,8).toUpperCase()
  return `KV-${s()}-${s()}-${s()}-${s()}`
}
const genId   = () => uuidv4()
const daysLeft = (exp) => Math.ceil((new Date(exp)-new Date())/86400000)

function calcExpiry(plan, customDate) {
  if (plan==='custom' && customDate) return new Date(customDate).toISOString()
  const d = KEY_PLANS[plan]?.days || 365
  return formatISO(addDays(new Date(), d))
}

function keyStatus(k) {
  if (k.revoked)   return 'revoked'
  if (!k.activated) return 'pending'
  if (daysLeft(k.expires_at) <= 0) return 'expired'
  if (k.plan==='full6m') return 'trial'
  return 'active'
}

/** All module IDs this key grants (legacy keys may list more than one). */
function keyModuleIds(k) {
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

/** Sinh sub-key ngẫu nhiên cho từng module (lưu DB khi tạo license). */
function genModuleUnlockKey(groupCode) {
  const s = () => Math.random().toString(36).slice(2, 6).toUpperCase()
  return `KV-SUB-${groupCode}-${s()}-${s()}-${s()}`
}

/** Tạo map moduleId → unlock key (mỗi module một mã mở trong app desktop). */
function createModuleKeysRecord(moduleIds) {
  const out = {}
  for (const id of moduleIds) {
    const m = MODULES.find(x => x.id === id)
    if (m) out[id] = genModuleUnlockKey(m.groupCode)
  }
  return out
}

/**
 * Sub-key để đưa vào ZIP: ưu tiên bản lưu DB; nếu license cũ không có thì derive cố định từ master (để ZIP ổn định).
 */
function resolveModuleUnlockKeys(k) {
  if (k.module_keys && typeof k.module_keys === 'object' && Object.keys(k.module_keys).length > 0) {
    return { ...k.module_keys }
  }
  const mods = keyModuleIds(k)
  const out = {}
  for (const id of mods) {
    const m = MODULES.find(x => x.id === id)
    const gc = m?.groupCode || 'X'
    const hex = crypto.createHmac('sha256', 'kv-module-unlock-v1')
      .update(`${k.key_code}|${id}`)
      .digest('hex')
      .toUpperCase()
    out[id] = `KV-SUB-${gc}-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`
  }
  return out
}

function modulesDetailForConfig(moduleIds) {
  const o = {}
  for (const id of moduleIds) {
    const m = MODULES.find(x => x.id === id)
    if (m) o[id] = { name: m.name, groupCode: m.groupCode, icon: m.icon }
  }
  return o
}

async function buildZip(k) {
  const mods = keyModuleIds(k)
  const plan = KEY_PLANS[k.plan]
  const dl   = daysLeft(k.expires_at)
  const unlockKeys = resolveModuleUnlockKeys(k)
  const modNames = mods.map(id => {
    const m = MODULES.find(x => x.id === id)
    const sub = unlockKeys[id] || '—'
    return `  ${m?.icon || '•'}  ${m?.name || id} [${m?.groupCode || '?'}]  →  unlock: ${sub}`
  }).join('\n')

  const bundlePayload = {
    masterKey: k.key_code,
    moduleIds: mods,
    moduleUnlockKeys: unlockKeys,
    expiresAt: k.expires_at,
    plan: k.plan,
  }
  const encodedBundle = Buffer.from(JSON.stringify(bundlePayload), 'utf8').toString('base64')

  const zip = new JSZip()
  const folder = zip.folder(`KeyVault-${k.key_code.slice(0,8)}`)
  folder.file('LICENSE.key', [
    `# KeyVault License — ${format(new Date(), 'yyyy-MM-dd')}`, ``,
    `[MASTER]`, `Key = ${k.key_code}`, `Plan = ${plan?.label || k.plan}`,
    `Email = ${k.email || ''}`, `Name = ${k.name || ''}`,
    `Expires = ${format(new Date(k.expires_at), 'dd/MM/yyyy')} (${dl} ngày còn)`, ``,
    `[MODULES & UNLOCK KEYS]`,
    ...mods.map(id => {
      const m = MODULES.find(x => x.id === id)
      const sub = unlockKeys[id] || ''
      return m ? `${id} | ${m.name} [${m.groupCode}] | ${sub}` : `${id} | ${sub}`
    }),
    ``, `[IMPORT]`, `encodedBundle (base64, 1 dòng — desktop có thể dán):`, encodedBundle,
    ``, `[CHECKSUM]`, `Hash = ${Buffer.from(k.key_code + k.expires_at).toString('base64').slice(0, 32)}`,
  ].join('\n'))
  folder.file('README.txt', [
    'KeyVault Desktop — Master key + nhiều module',
    '',
    `Master key: ${k.key_code}`,
    `Hết hạn: ${format(new Date(k.expires_at), 'dd/MM/yyyy')}`,
    '',
    'Trong app desktop:',
    '1) Người dùng nhập MASTER KEY để gắn license.',
    '2) Với từng module được cấp, nhập đúng SUB-KEY (KV-SUB-...) để "mở" module đó.',
    '3) App lưu cục bộ module nào đã mở; chỉ module đã mở mới dùng được.',
    '',
    'Chi tiết sub-key xem file config.json hoặc LICENSE.key.',
    '',
    'Support: support@keyvault.app',
  ].join('\n'))
  folder.file('KeyVault-Setup.exe', `MZ KeyVault Desktop Installer\nKey: ${k.key_code}\n[STUB - replace with real binary]`)
  folder.file('config.json', JSON.stringify({
    version: '2.3.0',
    schema: 'master-and-module-unlock',
    masterKey: k.key_code,
    plan: k.plan,
    expiresAt: k.expires_at,
    moduleIds: mods,
    moduleUnlockKeys: unlockKeys,
    modulesDetail: modulesDetailForConfig(mods),
    encodedBundle,
    desktop: {
      steps: [
        'Validate masterKey với server hoặc offline theo hạn expiresAt',
        'Với mỗi module trong moduleIds, user nhập moduleUnlockKeys[moduleId] để mở module',
        'Lưu trạng thái unlockedModules trong local storage / secure store của desktop',
      ],
    },
  }, null, 2))
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } })
}

module.exports = {
  MODULES,
  KEY_PLANS,
  genKeyCode,
  genId,
  calcExpiry,
  keyStatus,
  daysLeft,
  buildZip,
  keyModuleIds,
  createModuleKeysRecord,
  resolveModuleUnlockKeys,
}
