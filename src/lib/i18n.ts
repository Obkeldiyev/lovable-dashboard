import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      app: { name: "VMS" },
      nav: {
        dashboard: "Dashboard",
        inventory: "Inventory",
        products: "Products",
        brands: "Brands",
        categories: "Categories",
        suppliers: "Suppliers",
        warehouses: "Warehouses",
        purchaseOrders: "Purchase Orders",
        orders: "Orders",
        receivings: "Receivings",
        shipments: "Shipments",
        cycleCounts: "Cycle Counts",
        ops: "Operations",
        logistics: "Logistics",
        fleet: "Fleet",
        shops: "Shops",
        driver: "Driver",
        notifications: "Notifications",
        settings: "Settings",
      },
      common: {
        search: "Search…",
        save: "Save",
        cancel: "Cancel",
        edit: "Edit",
        editing: "Editing",
        done: "Done",
        loading: "Loading…",
        empty: "Nothing here yet",
      },
      theme: { light: "Light", dark: "Dark", system: "System" },
    },
  },
  ru: {
    translation: {
      app: { name: "VMS" },
      nav: {
        dashboard: "Панель",
        inventory: "Запасы",
        products: "Товары",
        brands: "Бренды",
        categories: "Категории",
        suppliers: "Поставщики",
        warehouses: "Склады",
        purchaseOrders: "Закупки",
        orders: "Заказы",
        receivings: "Приёмки",
        shipments: "Отгрузки",
        cycleCounts: "Инвентаризация",
        ops: "Операции",
        logistics: "Логистика",
        fleet: "Автопарк",
        shops: "Магазины",
        driver: "Водитель",
        notifications: "Уведомления",
        settings: "Настройки",
      },
      common: {
        search: "Поиск…",
        save: "Сохранить",
        cancel: "Отмена",
        edit: "Изм.",
        editing: "Режим",
        done: "Готово",
        loading: "Загрузка…",
        empty: "Пока пусто",
      },
      theme: { light: "Светлая", dark: "Тёмная", system: "Системная" },
    },
  },
  uz: {
    translation: {
      app: { name: "VMS" },
      nav: {
        dashboard: "Boshqaruv",
        inventory: "Inventar",
        products: "Mahsulotlar",
        brands: "Brendlar",
        categories: "Kategoriyalar",
        suppliers: "Yetkazuvchilar",
        warehouses: "Omborlar",
        purchaseOrders: "Xaridlar",
        orders: "Buyurtmalar",
        receivings: "Qabul",
        shipments: "Jo‘natma",
        cycleCounts: "Hisob-kitob",
        ops: "Operatsiyalar",
        logistics: "Logistika",
        fleet: "Avtopark",
        shops: "Do‘konlar",
        driver: "Haydovchi",
        notifications: "Bildirishnomalar",
        settings: "Sozlamalar",
      },
      common: {
        search: "Qidirish…",
        save: "Saqlash",
        cancel: "Bekor",
        edit: "Tahrir",
        editing: "Rejim",
        done: "Tayyor",
        loading: "Yuklanmoqda…",
        empty: "Hozircha bo‘sh",
      },
      theme: { light: "Yorug‘", dark: "Qorong‘i", system: "Tizim" },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });

export default i18n;
