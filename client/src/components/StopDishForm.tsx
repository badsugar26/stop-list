import { useState } from 'react';
import type { Dish } from '../api/types';
import { HttpError } from '../api/stopList.api';

interface StopDishFormProps {
  dishes: Dish[];
  preselectedDishId: string | null;
  onSubmit: (input: {
    dishId: string;
    reason: string;
    durationMinutes: number;
  }) => Promise<void>;
}

interface FieldErrors {
  dishId?: string;
  reason?: string;
  durationMinutes?: string;
}

const REASON_MIN = 5;
const REASON_MAX = 200;
const DURATION_MIN = 15;
const DURATION_MAX = 720;

export function StopDishForm({
  dishes,
  preselectedDishId,
  onSubmit,
}: StopDishFormProps) {
  const [manualDishId, setManualDishId] = useState<string | null>(null);
  const [reason, setReason] = useState<string>('');
  const [duration, setDuration] = useState<string>('60');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Эффективное значение селекта: ручной выбор важнее внешнего.
  const dishId = manualDishId ?? preselectedDishId ?? '';

  function validate(): FieldErrors {
    const next: FieldErrors = {};

    if (!dishId) {
      next.dishId = 'Выберите блюдо';
    }

    const trimmed = reason.trim();
    if (trimmed.length < REASON_MIN) {
      next.reason = `Причина должна быть не короче ${REASON_MIN} символов`;
    } else if (trimmed.length > REASON_MAX) {
      next.reason = `Причина должна быть не длиннее ${REASON_MAX} символов`;
    }

    const parsed = Number(duration);
    if (!Number.isInteger(parsed)) {
      next.durationMinutes = 'Длительность должна быть целым числом';
    } else if (parsed < DURATION_MIN || parsed > DURATION_MAX) {
      next.durationMinutes = `От ${DURATION_MIN} до ${DURATION_MAX} минут`;
    }

    return next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit({
        dishId,
        reason: reason.trim(),
        durationMinutes: Number(duration),
      });
      setManualDishId(null);
      setReason('');
      setDuration('60');
      setErrors({});
    } catch (err) {
      if (err instanceof HttpError) {
        if (err.code === 'CONFLICT') {
          setErrors({ dishId: err.message });
        } else if (err.code === 'VALIDATION_ERROR') {
          if (err.message.toLowerCase().includes('duration')) {
            setErrors({ durationMinutes: err.message });
          } else {
            setErrors({ reason: err.message });
          }
        } else {
          setErrors({ reason: err.message });
        }
      } else {
        setErrors({ reason: 'Не удалось отправить. Попробуйте ещё раз' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="stop-form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label htmlFor="dishId" className="form-field__label">
          Блюдо
        </label>
        <select
          id="dishId"
          className={`form-field__input${errors.dishId ? ' form-field__input--error' : ''}`}
          value={dishId}
          onChange={(e) => setManualDishId(e.target.value || null)}
        >
          <option value="">— выберите блюдо —</option>
          {dishes.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.category})
            </option>
          ))}
        </select>
        {errors.dishId && (
          <div className="form-field__error">{errors.dishId}</div>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="reason" className="form-field__label">
          Причина
        </label>
        <textarea
          id="reason"
          className={`form-field__input form-field__textarea${errors.reason ? ' form-field__input--error' : ''}`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => {
            const v = validate();
            if (v.reason) setErrors((prev) => ({ ...prev, reason: v.reason }));
          }}
          placeholder="Например: закончился бульон"
          rows={3}
        />
        {errors.reason && (
          <div className="form-field__error">{errors.reason}</div>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="duration" className="form-field__label">
          Длительность, минут
        </label>
        <input
          id="duration"
          type="number"
          min={DURATION_MIN}
          max={DURATION_MAX}
          className={`form-field__input${errors.durationMinutes ? ' form-field__input--error' : ''}`}
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
        {errors.durationMinutes && (
          <div className="form-field__error">{errors.durationMinutes}</div>
        )}
      </div>

      <button
        type="submit"
        className="button button--primary"
        disabled={submitting}
      >
        {submitting ? 'Отправка…' : 'Поставить в стоп'}
      </button>
    </form>
  );
}