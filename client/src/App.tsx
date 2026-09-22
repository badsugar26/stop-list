import { useStopList } from './hooks/useStopList';
import './App.css';

function App() {
  const { dishes, active, loading, error, reload } = useStopList();

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Стоп-лист смены</h1>
        <p className="app__subtitle">
          Управление блюдами, временно снятыми с продажи
        </p>
      </header>

      {/* Состояние загрузки */}
      {loading && (
        <div className="state" role="status" aria-live="polite">
          Загрузка…
        </div>
      )}

      {/* Состояние ошибки с кнопкой «Повторить» */}
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

      {/* Основной контент — только когда загрузились без ошибки */}
      {!loading && !error && (
        <div className="app__grid">
          <section className="section">
            <h2 className="section__title">Блюда</h2>
            {dishes.length === 0 ? (
              <p className="section__empty">Справочник пуст</p>
            ) : (
              <p className="section__empty">
                Заглушка: здесь будет список {dishes.length} блюд
              </p>
            )}
          </section>

          <section className="section">
            <h2 className="section__title">Активный стоп-лист</h2>
            {active.length === 0 ? (
              <p className="section__empty">Все блюда в продаже</p>
            ) : (
              <p className="section__empty">
                Заглушка: здесь будет {active.length} записей
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default App;