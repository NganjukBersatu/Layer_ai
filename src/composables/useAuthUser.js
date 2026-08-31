import { ref } from 'vue'

const userPhoto = ref(localStorage.getItem('userPhoto') || '')
const userName = ref(localStorage.getItem('userName') || '')
const userEmail = ref(localStorage.getItem('userEmail') || '')
const isAdmin = ref(localStorage.getItem('isAdmin') === 'true')

function refreshAuthUser() {
  userPhoto.value = localStorage.getItem('userPhoto') || ''
  userName.value = localStorage.getItem('userName') || ''
  userEmail.value = localStorage.getItem('userEmail') || ''
  isAdmin.value = localStorage.getItem('isAdmin') === 'true'
}

function clearAuthUser() {
  localStorage.removeItem('isLoggedIn')
  localStorage.removeItem('userId')
  localStorage.removeItem('userName')
  localStorage.removeItem('userEmail')
  localStorage.removeItem('isAdmin')
  localStorage.removeItem('userPhoto')

  userPhoto.value = ''
  userName.value = ''
  userEmail.value = ''
  isAdmin.value = false
}

export function useAuthUser() {
  return { userPhoto, userName, userEmail, isAdmin, refreshAuthUser, clearAuthUser }
}