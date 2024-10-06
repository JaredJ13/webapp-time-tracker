import { useToast } from 'vue-toastification'

const toast = useToast()


export function SuccessToast(message) {
  toast.success(message, {
    position: 'bottom-left',
    timeout: 7000,
    closeOnClick: true,
    pauseOnFocusLoss: true,
    pauseOnHover: true,
    draggable: true,
    draggablePercent: 0.6,
    showCloseButtonOnHover: false,
    hideProgressBar: true,
    closeButton: 'button',
    icon: true,
    rtl: false
  })
}


