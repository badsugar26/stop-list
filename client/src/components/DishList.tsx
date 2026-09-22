import type { Dish, StopListEntryView } from '../api/types';

interface DishListProps {
  dishes: Dish[];
  /** Активные записи — чтобы понять, какие блюда уже в стопе. */
  active: StopListEntryView[];
  /** Колбэк: пользователь хочет поставить блюдо в стоп. */
  onSelectDish: (dishId: string) => void;
}

export function DishList({ dishes, active, onSelectDish }: DishListProps) {
  // Множество dishId, которые сейчас в стопе — для быстрой проверки.
  const stoppedIds = new Set(active.map((entry) => entry.dishId));

  if (dishes.length === 0) {
    return <p className="section__empty">Справочник пуст</p>;
  }

  return (
    <ul className="dish-list">
      {dishes.map((dish) => {
        const isStopped = stoppedIds.has(dish.id);
        return (
          <li
            key={dish.id}
            className={`dish-list__item${isStopped ? ' dish-list__item--stopped' : ''}`}
          >
            <div className="dish-list__info">
              <div className="dish-list__name">
                {dish.name}
                {isStopped && (
                  <span className="dish-list__badge">в стопе</span>
                )}
              </div>
              <div className="dish-list__meta">
                {dish.category} · {dish.price} ₽
              </div>
            </div>
            <button
              type="button"
              className="dish-list__action"
              onClick={() => onSelectDish(dish.id)}
              disabled={isStopped}
            >
              {isStopped ? 'В стопе' : 'В стоп'}
            </button>
          </li>
        );
      })}
    </ul>
  );
}