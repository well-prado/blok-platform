import { useToastStore } from '../stores/toast';
import Toast from './Toast';

export default function ToastContainer() {
  const { toasts } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
} 