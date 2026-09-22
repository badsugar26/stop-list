import { useEffect, useRef, useState } from 'react';
import { useStopList } from './hooks/useStopList';
import { DishList } from './components/DishList';
import { StopDishForm } from './components/StopDishForm';
import { ActiveStopList } from './components/ActiveStopList';
import './App.css';

function App() {
  const {
  dishes,
  active,
  loading,
  error,
  reload,
  createStop,
  returnFromStop,
  now,
  lastLoadedAt,
} = useStopList();

  const [preselectedDishId, setPreselectedDishId] = useState<string | null>(
    null
  );

  // Ref на секцию с формой — чтобы плавно скроллить к ней.
  const formSectionRef = useRef<HTMLElement | null>(null);

  /**
   * Автообновление active раз в 60 секунд, БЕЗ глобального loading,
   * чтобы не сбрасывать скролл. Требование ТЗ.
   */
  useEffect(() => {
    const interval = setInterval(() => {
      void reload({ silent: true });
    }, 60_000);
    return () => clearInterval(interval);
  }, [reload]);

  /**
   * Клик «В стоп» в списке блюд: сохраняем выбор и скроллим к форме.
   * Плавный скролл — UX: пользователь видит, что произошло.
   */
  function handleSelectDish(dishId: string) {
    setPreselectedDishId(dishId);
    // Прокручиваем после рендера, чтобы ref указывал на актуальную секцию.
    requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }

  async function handleCreateStop(input: {
    dishId: string;
    reason: string;
    durationMinutes: number;
  }) {
    await createStop(input);
    setPreselectedDishId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Стоп-лист смены</h1>
        <p className="app__subtitle">
          Управление блюдами, временно снятыми с продажи
        </p>
      </header>

      {loading && (
        <div className="state" role="status" aria-live="polite">
          Загрузка…
        </div>
      )}

      {!loading && error && (
        <div className="state state--error" role="alert">
          <div>{error}</div>
          <button
            type="button"
            className="state__retry"
            onClick={() => void reload()}
          >
            Повторить
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="app__grid">
          <section className="section">
            <h2 className="section__title">Блюда</h2>
            <DishList
              dishes={dishes}
              active={active}
              onSelectDish={handleSelectDish}
            />
          </section>

          <section className="section">
            <h2 className="section__title">Активный стоп-лист</h2>
            <ActiveStopList
              entries={active}
              now={now}
              lastLoadedAt={lastLoadedAt}
              onReturn={returnFromStop}
            />
          </section>

          <section
            className="section app__form-section"
            ref={formSectionRef}
            aria-label="Форма постановки в стоп"
          >
            <h2 className="section__title">Поставить в стоп</h2>
            <StopDishForm
              key={preselectedDishId ?? 'default'}
              dishes={dishes}
              preselectedDishId={preselectedDishId}
              onSubmit={handleCreateStop}
            />
          </section>
        </div>
      )}
    </div>
  );
}

export default App;