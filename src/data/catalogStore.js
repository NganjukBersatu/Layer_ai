import { reactive } from 'vue'

const API_BASE = 'http://localhost:3000'

function toFullImageUrl(image) {
  if (!image) return ''
  return image.startsWith('http') ? image : `${API_BASE}/${image}`
}

export const catalogItems = reactive([])

// Ambil semua item, dipanggil saat CatalogPage.vue dibuka
export async function fetchCatalog() {
  const res = await fetch(`${API_BASE}/catalog`)
  const json = await res.json()
  if (json.success) {
    const items = json.data.map((item) => ({ ...item, image: toFullImageUrl(item.image) }))
    catalogItems.splice(0, catalogItems.length, ...items)
  }
}

export function getItemById(id) {
  return catalogItems.find((item) => String(item.id) === String(id))
}

// Ambil satu item langsung dari server (dipakai kalau user buka /catalog/:id langsung)
export async function fetchItemById(id) {
  const local = getItemById(id)
  if (local) return local

  const res = await fetch(`${API_BASE}/catalog/${id}`)
  const json = await res.json()
  if (json.success) {
    const item = { ...json.data, image: toFullImageUrl(json.data.image) }
    catalogItems.push(item)
    return item
  }
  return null
}

export async function updateItem(id, updatedFields) {
  const res = await fetch(`${API_BASE}/catalog/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedFields),
  })
  const json = await res.json()
  if (json.success) {
    const item = getItemById(id)
    if (item) Object.assign(item, { ...json.data, image: toFullImageUrl(json.data.image) })
  }
  return json
}

export async function deleteItem(id) {
  const res = await fetch(`${API_BASE}/catalog/${id}`, { method: 'DELETE' })
  const json = await res.json()
  if (json.success) {
    const index = catalogItems.findIndex((item) => String(item.id) === String(id))
    if (index !== -1) catalogItems.splice(index, 1)
  }
  return json
}