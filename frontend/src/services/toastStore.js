let listeners = [];
let toasts = [];
let idCounter = 0;

export function subscribe(listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function emit() {
  listeners.forEach((listener) => listener(toasts));
}

export function showToast(message, type = 'success', duration) {
  if (!message) return;

  const id = ++idCounter;
  const resolvedDuration = duration ?? (type === 'error' ? 5000 : 3500);

  toasts = [...toasts, { id, message, type }];
  emit();

  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, resolvedDuration);
}

export function dismissToast(id) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function getToasts() {
  return toasts;
}
