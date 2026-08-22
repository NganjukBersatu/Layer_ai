import { onMounted, onBeforeUnmount } from 'vue'

/**
 * Menutup sebuah menu/dropdown ketika user klik atau scroll di luar elemen yang direferensikan.
 * @param {import('vue').Ref | import('vue').Ref[]} refs - satu ref atau array ref (elemen yang dianggap "di dalam" menu, termasuk tombol pemicunya)
 * @param {Function} callback - dipanggil untuk menutup menu
 */
export function useClickOutside(refs, callback) {
  function handleOutsideEvent(event) {
    const list = Array.isArray(refs) ? refs : [refs]
    const isInside = list.some((r) => r.value && r.value.contains(event.target))
    if (!isInside) callback()
  }

  onMounted(() => {
    document.addEventListener('click', handleOutsideEvent, true)
    window.addEventListener('scroll', handleOutsideEvent, true)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('click', handleOutsideEvent, true)
    window.removeEventListener('scroll', handleOutsideEvent, true)
  })
}