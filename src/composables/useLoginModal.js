import { ref } from 'vue'

// State di luar function = "singleton", dipakai bareng oleh semua
// komponen yang import composable ini (Navbar, router guard, modal-nya sendiri)
const isOpen = ref(false)
const redirectPath = ref(null)

export function useLoginModal() {
  function openLoginModal(path = null) {
    redirectPath.value = path
    isOpen.value = true
  }

  function closeLoginModal() {
    isOpen.value = false
    redirectPath.value = null
  }

  return { isOpen, redirectPath, openLoginModal, closeLoginModal }
}