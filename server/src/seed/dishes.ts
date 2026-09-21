import type { Dish } from '../domain/stopList';

export const seedDishes: Dish[] = [
  // Кухня
  { id: 'dish-1', name: 'Борщ украинский', category: 'Кухня', price: 390 },
  { id: 'dish-2', name: 'Солянка мясная', category: 'Кухня', price: 450 },
  { id: 'dish-3', name: 'Цезарь с курицей', category: 'Кухня', price: 520 },
  { id: 'dish-4', name: 'Стейк рибай', category: 'Кухня', price: 1890 },
  { id: 'dish-5', name: 'Паста карбонара', category: 'Кухня', price: 590 },
  { id: 'dish-6', name: 'Пельмени домашние', category: 'Кухня', price: 420 },

  // Бар
  { id: 'dish-7', name: 'Мохито безалкогольный', category: 'Бар', price: 320 },
  { id: 'dish-8', name: 'Эспрессо', category: 'Бар', price: 150 },
  { id: 'dish-9', name: 'Капучино', category: 'Бар', price: 220 },
  { id: 'dish-10', name: 'Лимонад домашний', category: 'Бар', price: 280 },

  // Десерты
  { id: 'dish-11', name: 'Чизкейк Нью-Йорк', category: 'Десерты', price: 390 },
  { id: 'dish-12', name: 'Тирамису', category: 'Десерты', price: 420 },
  { id: 'dish-13', name: 'Медовик', category: 'Десерты', price: 340 },
];