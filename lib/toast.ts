'use client';

import Swal from 'sweetalert2';

type ToastType = 'success' | 'error' | 'warning' | 'info';

export function showToast(message: string, type: ToastType = 'success') {
  if (typeof window === 'undefined') return;

  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: type,
    title: message,
    showConfirmButton: false,
    timer: 5000,
    timerProgressBar: true,
  });
}

