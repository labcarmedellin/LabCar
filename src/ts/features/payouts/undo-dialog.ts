import { PayoutNotFoundError, undoPayout } from '../../data/payouts';
import { firestoreErrorMessage } from '../../lib/errors';
import { formatCOP, formatShortDateTime } from '../../lib/format';
import type { Payout } from '../../models/payout';
import { byId } from '../../ui/dom';
import { showToast } from '../../ui/toast';
import { weekLabel, type Employee } from './render';
import type { PayoutWeek } from './week';

const MIN_REASON = 5;

export interface UndoRequest {
  employee: Employee;
  week: PayoutWeek;
  payout: Payout;
}

/**
 * Popup para deshacer un pago registrado por error (solo admin, solo el último pago del empleado).
 * `onUndone` recarga la página después de deshacerlo, o si otro equipo ya lo había deshecho.
 */
export function setupUndoDialog(by: { email: string; name: string }, onUndone: () => void): (request: UndoRequest) => void {
  const dialog = byId<HTMLDialogElement>('undo-dialog');
  const form = byId<HTMLFormElement>('undo-form');
  const reason = byId<HTMLTextAreaElement>('undo-reason');
  const error = byId('undo-error');
  const confirmBtn = byId<HTMLButtonElement>('btn-undo-confirm');
  let current: UndoRequest | null = null;

  const showError = (text: string) => {
    error.textContent = text;
    error.hidden = false;
  };

  dialog.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog && !confirmBtn.disabled) dialog.close();
  });
  // Mientras se guarda no se puede cerrar con Escape (el resultado se mostraría en un diálogo cerrado).
  dialog.addEventListener('cancel', (event) => {
    if (confirmBtn.disabled) event.preventDefault();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!current) return;
    if (reason.value.trim().length < MIN_REASON) {
      showError(`Escribe el motivo (mínimo ${MIN_REASON} caracteres).`);
      reason.focus();
      return;
    }
    const { employee, payout } = current;
    error.hidden = true;
    confirmBtn.disabled = true;
    try {
      await undoPayout(payout.id, reason.value, by);
      dialog.close();
      showToast(`${employee.name}: se deshizo el pago de ${formatCOP(payout.amount - payout.loanDeduction)}. La semana quedó pendiente.`, 'undo');
      onUndone();
    } catch (cause) {
      console.error(cause);
      if (cause instanceof PayoutNotFoundError) {
        dialog.close();
        showToast(cause.message, 'warning');
        onUndone();
      } else {
        showError(firestoreErrorMessage(cause, 'deshacer el pago'));
      }
    } finally {
      confirmBtn.disabled = false;
    }
  });

  return (request: UndoRequest) => {
    current = request;
    const { employee, week, payout } = request;
    form.reset();
    error.hidden = true;
    byId('undo-week').textContent = weekLabel(week);
    byId('undo-employee').textContent = employee.name;
    byId('undo-paid-at').textContent = `${formatShortDateTime(payout.paidAt)} · ${payout.paidBy.name || payout.paidBy.email}`;
    byId('undo-amount').textContent = formatCOP(payout.amount - payout.loanDeduction);
    dialog.showModal();
    reason.focus();
  };
}
