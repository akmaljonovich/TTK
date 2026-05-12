import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { api } from "./api.js";

// ─── Color Themes ────────────────────────────────────────────────────────────
var DARK = {
  bg: "#0f1117", sur: "#1a1d2e88", card: "#1a1d2e", border: "#2a2f48", borderH: "#3d4466",
  acc: "#e8a838", text: "#e2e8f5", mid: "#7b89b0", dim: "#404867",
  green: "#4ade80", red: "#fb7185", blue: "#7cacf8",
  purple: "#b197fc", orange: "#fbbf6e", teal: "#5eead4",
  cardHover: "#1e2238", btnHover: "#ffffff12",
};
var LIGHT = {
  bg: "#f4f6fa", sur: "#ffffff99", card: "#ffffff", border: "#e2e5ec", borderH: "#b8bdd0",
  acc: "#cf8a1e", text: "#2d3348", mid: "#727d96", dim: "#adb5c5",
  green: "#10b981", red: "#f43f5e", blue: "#4f8ef7",
  purple: "#8b5cf6", orange: "#f59e0b", teal: "#14b8a6",
  cardHover: "#f8f9fc", btnHover: "#00000008",
};
var C = DARK;

// ─── Translations ────────────────────────────────────────────────────────────
var T_UZ = {
  // Nav
  tabCards: "Техкарталар", tabNom: "Номенклатура", tabAdmin: "Админ",
  btnImport: "Юклаш", btnPrice: "Нарх", btnAdd: "Қўшиш", btnNew: "Янги",
  searchPlaceholder: "Қидирув...",
  toggleTheme: "Тема алмаштириш",
  toggleLang: "Тил",
  // Loading
  loading: "Юкланмоқда...",
  dataLoading: "Маълумотлар юкланмоқда...",
  // Registration
  appTitle: "ТехКарты PRO",
  regTitle: "Рўйхатдан ўтинг",
  regName: "Исм (ФИО)",
  regNamePh: "Исмингизни киритинг",
  regAge: "Ёш",
  regCity: "Шаҳар",
  regCityPh: "Тошкент",
  regPosition: "Лавозим",
  regPositionPh: "Ошпаз, Технолог...",
  regWorkplace: "Иш жойи (Ташкилот)",
  regWorkplacePh: "Ресторан номи",
  regPurpose: "Мақсад",
  regPurposePh: "Нима учун ишлатасиз?",
  regSubmit: "Кириш",
  // Catalog import
  catProducts: "Маҳсулотлар",
  catDishes: "Таомлар",
  catSelected: "Танланди",
  catSelectAll: "Ҳаммасини танлаш",
  catImported: "та маҳсулот юкланди!",
  catDishImported: "та таом юкланди",
  catDishSkipped: "та ўтказиб юборилди",
  catCancel: "Бекор қилиш",
  catLoadN: "та юклаш",
  catClose: "Ёпиш",
  catError: "Хатолик",
  // Excel import
  excelUploadTitle: "Excel ёки CSV файлни юкланг",
  excelUploadHint: "Файлда маҳсулот номи, ўлчов бирлиги ва нарх устунлари бўлиши керак",
  excelUploadFormats: "(.xlsx, .xls, .csv форматлар қўллаб-қувватланади)",
  excelChooseFile: "Файлни танлаш",
  excelFileRead: "Файл ўқилди",
  excelRows: "та қатор",
  excelCols: "та устун",
  excelMapCols: "Устунларни мослаштиринг:",
  excelColName: "Маҳсулот номи *",
  excelColUnit: "Ўлчов бирлиги",
  excelColPrice: "Нарх (тан нарх)",
  excelColFolder: "Категория / Папка",
  excelNoMap: "— Танламаслик —",
  excelPreview: "Олдиндан кўриш (биринчи 3 та):",
  excelThName: "Ном",
  excelThUnit: "Ед.",
  excelThPrice: "Нарх",
  excelThFolder: "Папка",
  excelBack: "Орқага",
  excelContinue: "Давом этиш →",
  excelReadyItems: "та маҳсулот импортга тайёр",
  excelChangeCols: "← Устунларни ўзгартириш",
  excelEditHint: "Нарх ва ўлчов бирлигини ўзгартиришингиз мумкин:",
  excelThNum: "№",
  excelThItemName: "Наименование",
  excelThPriceCol: "Нарх сўм",
  excelImporting: "Юкланмоқда...",
  excelImportBtn: "та импорт қилиш",
  excelImportedN: "та юкланди",
  excelSkippedExist: "та ўтказиб юборилди (мавжуд)",
  // Batch price editor
  batchFolder: "Папка:",
  batchAll: "Ҳаммаси",
  batchNoFolder: "Папкасиз",
  batchChanged: "та ўзгарди",
  batchThName: "Наименование",
  batchThUnit: "Ед.",
  batchThPrice: "Нарх (сўм)",
  batchThPacking: "Фасовка",
  batchThPackPrice: "Фас. нарх сўм",
  batchNoChanges: "Ўзгаришлар йўқ",
  batchUpdated: "та нарх янгиланди!",
  batchSaving: "Сақланмоқда...",
  batchSave: "Сақлаш",
  // Admin
  adminOrgs: "Ташкилотлар",
  adminUsers: "Фойдаланувчилар",
  adminStaff: "ходим",
  adminProducts: "маҳсулот",
  adminCards: "карта",
  adminDetails: "Батафсил",
  adminName: "Исм",
  adminOrg: "Ташкилот",
  adminPosition: "Лавозим",
  adminCity: "Шаҳар",
  adminRole: "Роль",
  adminRoleAdmin: "Админ",
  adminRoleUser: "Ходим",
  adminDemote: "Олиб ташлаш",
  adminPromote: "Админ қилиш",
  adminOrgInfo: "Ташкилот маълумотлари",
  adminOrgProducts: "Маҳсулотлар",
  adminOrgCards: "Техкарталар",
  adminOrgStaff: "Ходимлар",
  // Folders
  folders: "Папкалар",
  folderCreate: "Яратиш",
  folderAll: "Барча позициялар",
  folderNone: "Папкасиз",
  folderNoFolders: "Папкалар йўқ",
  folderType: "Тип",
  folderAllTypes: "Барча типлар",
  // NomForm
  nomTypeLabel: "Номенклатура тури",
  nomFinal: "финал",
  nomName: "Номи",
  nomNamePh: "Масалан: Мол гўшти олий нав",
  nomUnit: "Ўлчов бирлиги",
  nomPrice: "Нарх (1 бирлик учун)",
  nomPriceHint: "нархи",
  nomFolder: "Папка / Бўлим",
  nomNoFolder: "— Папкасиз —",
  nomPacking: "Фасовка",
  nomPackName: "Номи",
  nomPackNamePh: "Қоп, Қути, Шиша...",
  nomPackQty: "Ҳажми",
  nomPackPrice: "Нархи (сўм)",
  nomDesc: "Тавсиф",
  nomDescPh: "Ихтиёрий",
  nomImage: "Расм",
  nomImageUpload: "Расм юклаш",
  nomNutrition: "Озиқ-овқат қиймати (100 г учун)",
  nomProteins: "Оқсил (г)",
  nomFats: "Ёғ (г)",
  nomCarbs: "Углевод (г)",
  nomCalories: "Калория (ккал)",
  nomParams: "Параметрлар",
  nomGross: "Брутто (ишлов олдидан)",
  nomGrossPh: "Тозалашдан олдинги масса",
  nomGrossHint: "Пўстлоқ, суяк ва чиқиндилар билан",
  nomNet: "Нетто / Закладка нормаси",
  nomNetPh: "Ишлов беришдан кейинги масса",
  nomNetHint: "Соф оғирлик — таомга соладиган миқдор",
  nomYield: "Чиқиш (%)",
  nomYieldAuto: "авто",
  nomLoss: "Йўқотиш",
  nomFillGross: "Брутто/нетто тўлдиринг",
  nomLinkedCard: "Боғланган техкарта (ихтиёрий)",
  nomNoLinked: "— Кўрсатилмаган —",
  nomLinkedOut: "чиқиш",
  nomCancel: "Бекор қилиш",
  nomSave: "Сақлаш",
  // Folder form
  folderFormName: "Папка номи",
  folderFormNamePh: "Масалан: Гўшт ва паррандалар",
  folderFormParent: "Жойлаштириш (ихтиёрий)",
  folderFormRoot: "— Асосий папка —",
  folderFormCancel: "Бекор қилиш",
  folderFormCreate: "Яратиш",
  // Ingredient row
  ingType: "Тип",
  ingProduct: "Маҳсулот",
  ingCard: "ЯМ/Карта",
  ingSelectNom: "— Номенклатурани танланг —",
  ingSelectCard: "— Техкартани танланг (ЯМ) —",
  ingQtyPh: "Миқдори",
  // Step editor
  stepName: "Босқич номи",
  stepNameDefault: "Босқич",
  stepProcess: "Жараён",
  stepTemp: "Ҳарорат °C",
  stepTime: "Вақт (дақ)",
  stepPressure: "Босим (атм)",
  stepNote: "Изоҳ",
  stepNotePh: "Қўшимча параметрлар",
  stepComposition: "Босқич таркиби",
  stepNoIngs: "Таркиб йўқ",
  // CardForm
  cardName: "Техкарта номи",
  cardNamePh: "Масалан: Борщ украин усулида",
  cardOutputQty: "Чиқиш (миқдори)",
  cardOutputUnit: "Чиқиш ўлч.",
  cardDesc: "Тавсиф",
  cardDescPh: "Қисқа тавсиф",
  cardNorms: "Закладка ва чиқиш нормалари",
  cardGross: "Брутто (ишлов олдидан)",
  cardGrossPh: "Хом ашё массаси",
  cardGrossHint: "Тозалаш, музлатишдан олдинги оғирлик",
  cardNet: "Нетто / Закладка нормаси",
  cardNetPh: "Соф оғирлик",
  cardNetHint: "Ишлов беришдан кейинги — таомга соладиган миқдор",
  cardYield: "Чиқиш (%)",
  cardYieldAuto: "авто",
  cardLoss: "Йўқотиш",
  cardFillGross: "Брутто ва неттони тўлдиринг",
  cardCostLabel: "Таннарх",
  cardStepsTitle: "Ишлаб чиқариш босқичлари",
  cardAddStep: "Босқич қўшиш",
  cardNoSteps: "Босқичлар йўқ",
  cardAdd: "Қўшиш",
  cardCancel: "Бекор қилиш",
  cardSave: "Сақлаш",
  // Cards tab
  typesLabel: "ТИПЛАР:",
  noCards: "Техкарталар ҳали йўқ",
  createFirst: "Биринчисини яратиш",
  outputLabel: "Чиқиш",
  costLabel: "Таннарх",
  treeBtn: "Дарахт",
  bruttoLabel: "Брутто:",
  nettoLabel: "Нетто:",
  yieldLabel: "Чиқиш:",
  // Nom tab
  noItems: "Позициялар топилмади",
  addItem: "Позиция қўшиш",
  nomThType: "Тип",
  nomThName: "Наименование",
  nomThUnit: "Ед.",
  nomThPrice: "Нарх сўм",
  nomThPack: "Фасовка",
  nomThFolder: "Папка",
  // Modals
  modalNewNom: "Янги номенклатура позицияси",
  modalEditNom: "Позицияни таҳрирлаш",
  modalNewCard: "Янги технологик карта",
  modalNewCardSub: "Блюдони бошқа карталарда ингредиент сифатида ишлатиб бўлмайди",
  modalEditCard: "Техкартани таҳрирлаш",
  modalNewFolder: "Янги папка",
  modalExcelImport: "Excel / CSV импорт",
  modalExcelSub: "Файлдан маҳсулотлар юклаш",
  modalBatchPrice: "Нархларни пакетли киритиш",
  modalBatchPriceSub: "Бир вақтда барча маҳсулотларга нарх киритинг",
  modalDetailSub: "Тўлиқ таркиб дарахти",
  modalClose: "Ёпиш",
  modalDownloadExcel: "Excel юклаш",
  // Currency
  currency: "сўм",
  perUnit: "ед.",
  // Nomenclature types
  ntTovar: "Товар",
  ntZagotovka: "Тайёрлама",
  ntPolufabrikat: "Ярим тайёр",
  ntGotovaya: "Тайёр маҳсулот",
  ntBlyudo: "Таом",
  ntShortTovar: "ТВ",
  ntShortZagotovka: "ТЙ",
  ntShortPolufabrikat: "ЯТ",
  ntShortGotovaya: "ТМ",
  ntShortBlyudo: "ТА",
  // Processes
  processVarka: "Қайнатиш",
  processZharka: "Қовуриш",
  processZapekanie: "Пиширув",
  processSmeshan: "Аралаштириш",
  processNarezka: "Кесиш",
  processMarinov: "Маринадлаш",
  processOhlazh: "Совутиш",
  processZamorozka: "Музлатиш",
  processPasserovka: "Пассеровка",
  processTushenie: "Дамлаш",
  processBlansh: "Бланширование",
  processVzbiv: "Кўпиртириш",
  processDrugoe: "Бошқа",
  // Excel export
  expTechCard: "ТЕХНОЛОГИК КАРТА",
  expName: "Номи:",
  expDesc: "Тавсиф:",
  expOutput: "Чиқиш:",
  expGross: "Брутто:",
  expNet: "Нетто:",
  expYieldPct: "Чиқиш %:",
  expCost: "Таннарх:",
  expCostPerUnit: "Таннарх/бирлик:",
  expNutrPer: "КБЖУ БИР ПОРЦИЯГА",
  expProteins: "Оқсил:",
  expFats: "Ёғлар:",
  expCarbs: "Углеводлар:",
  expCalories: "Калориялар:",
  expDate: "Сана:",
  expBOM: "ХОМ АШЁЛАР ВЕДОМОСТИ (BOM)",
  expIngredient: "Ингредиент",
  expNomType: "Номенклатура тури",
  expQty: "Миқдор",
  expPricePerUnit: "Нарх/бирлик",
  expSum: "Жами сўм",
  expLevel: "Даража",
  expMain: "Асосий",
  expLevelN: "Дар.",
  expTotal: "ЖАМИ:",
  expStepsSheet: "БОСҚИЧЛАР —",
  expStepNum: "№",
  expStepName: "Босқич",
  expStepProcess: "Жараён",
  expStepTemp: "Ҳар°C",
  expStepMin: "Дақ",
  expStepPressure: "Босим",
  expStepNote: "Изоҳ",
  expStepIng: "Ингредиент",
  expStepNomType: "Номенкл. тури",
  expStepCost: "Қиймат сўм",
  expSemiTag: "ЯМ",
  expSemiLabel: "Ярим тайёр",
  expStepDefault: "Босқич",
  expCardSheet: "Техкарта",
  expStepsSheetName: "Босқичлар",
  // Auth
  loginTitle: "Тизимга кириш",
  loginLogin: "Логин",
  loginPassword: "Парол",
  loginBtn: "Кириш",
  loginError: "Логин ёки парол нотўғри",
  loginNoAccount: "Аккаунтингиз йўқми?",
  loginCreateAccount: "Рўйхатдан ўтиш",
  loginHaveAccount: "Аккаунтингиз борми?",
  loginPh: "Логинингизни киритинг",
  passwordPh: "Паролингизни киритинг",
  logoutBtn: "Чиқиш",
  forgotPassword: "Паролни унутдингизми?",
  resetTitle: "Паролни тиклаш",
  resetNewPass: "Янги парол",
  resetBtn: "Паролни янгилаш",
  resetBack: "← Кириш",
  resetSuccess: "Парол янгиланди! Янги парол билан киринг.",
  resetError: "Фойдаланувчи топилмади",
  resetPassShort: "Парол камида 4 та белги",
  tabSettings: "Созламалар",
  settingsTitle: "Созламалар",
  regLogin: "Логин",
  regLoginPh: "Логин яратинг",
  regPassword: "Парол",
  regPasswordPh: "Парол яратинг",
  // Settings
  setProfile: "Шахсий маълумотлар",
  setSecurity: "Логин ва парол",
  setAvatar: "Профил расми",
  setTariff: "Тариф режаси",
  setDeleteData: "Базани тозалаш",
  setDeleteAccount: "Аккаунтни ўчириш",
  setSave: "Сақлаш",
  setSaved: "Сақланди!",
  setOldPassword: "Жорий парол",
  setNewPassword: "Янги парол",
  setNewLogin: "Янги логин",
  setChangePassword: "Паролни ўзгартириш",
  setChangeLogin: "Логинни ўзгартириш",
  setPasswordChanged: "Парол ўзгартирилди!",
  setLoginChanged: "Логин ўзгартирилди!",
  setLoginTaken: "Бу логин банд",
  setWrongPassword: "Жорий парол нотўғри",
  setPasswordShort: "Камида 4 та белги",
  setLoginShort: "Камида 3 та белги",
  setUploadPhoto: "Расм юклаш",
  setRemovePhoto: "Расмни ўчириш",
  setTariffFree: "Бепул",
  setTariffCurrent: "Жорий тариф",
  setTariffSoon: "Тариф режалари тез кунда...",
  setDeleteDataWarn: "Барча маҳсулотлар, техкарталар ва папкалар ўчирилади. Бу амал қайтарилмайди!",
  setDeleteDataBtn: "Базани тозалаш",
  setDeleteDataDone: "База тозаланди!",
  setDeleteAccountWarn: "Аккаунт ва барча маълумотлар батамом ўчирилади. Бу амал қайтарилмайди!",
  setDeleteAccountBtn: "Аккаунтни ўчириш",
  setConfirmDelete: "Тасдиқлаш учун \"ЎЧИРИШ\" деб ёзинг",
  setConfirmWord: "ЎЧИРИШ",
  excelColType: "Тип (Товар/Заготовка...)",
  excelThType: "Тип",
};

var T_RU = {
  // Nav
  tabCards: "Техкарты", tabNom: "Номенклатура", tabAdmin: "Админ",
  btnImport: "Загрузка", btnPrice: "Цена", btnAdd: "Добавить", btnNew: "Новая",
  searchPlaceholder: "Поиск...",
  toggleTheme: "Сменить тему",
  toggleLang: "Язык",
  // Loading
  loading: "Загрузка...",
  dataLoading: "Данные загружаются...",
  // Registration
  appTitle: "ТехКарты PRO",
  regTitle: "Регистрация",
  regName: "Имя (ФИО)",
  regNamePh: "Введите ваше имя",
  regAge: "Возраст",
  regCity: "Город",
  regCityPh: "Ташкент",
  regPosition: "Должность",
  regPositionPh: "Повар, Технолог...",
  regWorkplace: "Место работы (Организация)",
  regWorkplacePh: "Название ресторана",
  regPurpose: "Цель",
  regPurposePh: "Для чего будете использовать?",
  regSubmit: "Войти",
  // Catalog import
  catProducts: "Продукты",
  catDishes: "Блюда",
  catSelected: "Выбрано",
  catSelectAll: "Выбрать все",
  catImported: "продуктов загружено!",
  catDishImported: "блюд загружено",
  catDishSkipped: "пропущено",
  catCancel: "Отмена",
  catLoadN: "загрузить",
  catClose: "Закрыть",
  catError: "Ошибка",
  // Excel import
  excelUploadTitle: "Загрузите файл Excel или CSV",
  excelUploadHint: "Файл должен содержать столбцы: название, единица измерения и цена",
  excelUploadFormats: "(поддерживаются форматы .xlsx, .xls, .csv)",
  excelChooseFile: "Выбрать файл",
  excelFileRead: "Файл прочитан",
  excelRows: "строк",
  excelCols: "столбцов",
  excelMapCols: "Сопоставьте столбцы:",
  excelColName: "Название продукта *",
  excelColUnit: "Единица измерения",
  excelColPrice: "Цена (себестоимость)",
  excelColFolder: "Категория / Папка",
  excelNoMap: "— Не выбрано —",
  excelPreview: "Предпросмотр (первые 3):",
  excelThName: "Название",
  excelThUnit: "Ед.",
  excelThPrice: "Цена",
  excelThFolder: "Папка",
  excelBack: "Назад",
  excelContinue: "Продолжить →",
  excelReadyItems: "продуктов готово к импорту",
  excelChangeCols: "← Изменить столбцы",
  excelEditHint: "Можно изменить цену и единицу измерения:",
  excelThNum: "№",
  excelThItemName: "Наименование",
  excelThPriceCol: "Цена сўм",
  excelImporting: "Загрузка...",
  excelImportBtn: "импортировать",
  excelImportedN: "загружено",
  excelSkippedExist: "пропущено (уже существует)",
  // Batch price editor
  batchFolder: "Папка:",
  batchAll: "Все",
  batchNoFolder: "Без папки",
  batchChanged: "изменено",
  batchThName: "Наименование",
  batchThUnit: "Ед.",
  batchThPrice: "Цена (сўм)",
  batchThPacking: "Фасовка",
  batchThPackPrice: "Фас. цена сўм",
  batchNoChanges: "Изменений нет",
  batchUpdated: "цен обновлено!",
  batchSaving: "Сохранение...",
  batchSave: "Сохранить",
  // Admin
  adminOrgs: "Организации",
  adminUsers: "Пользователи",
  adminStaff: "сотрудник",
  adminProducts: "продуктов",
  adminCards: "карт",
  adminDetails: "Подробнее",
  adminName: "Имя",
  adminOrg: "Организация",
  adminPosition: "Должность",
  adminCity: "Город",
  adminRole: "Роль",
  adminRoleAdmin: "Админ",
  adminRoleUser: "Сотрудник",
  adminDemote: "Снять",
  adminPromote: "Сделать админом",
  adminOrgInfo: "Информация об организации",
  adminOrgProducts: "Продукты",
  adminOrgCards: "Техкарты",
  adminOrgStaff: "Сотрудники",
  // Folders
  folders: "Папки",
  folderCreate: "Создать",
  folderAll: "Все позиции",
  folderNone: "Без папки",
  folderNoFolders: "Нет папок",
  folderType: "Тип",
  folderAllTypes: "Все типы",
  // NomForm
  nomTypeLabel: "Тип номенклатуры",
  nomFinal: "финал",
  nomName: "Наименование",
  nomNamePh: "Напр.: Говядина в/с",
  nomUnit: "Единица измерения",
  nomPrice: "Цена (за 1 единицу)",
  nomPriceHint: "цена",
  nomFolder: "Папка / Раздел",
  nomNoFolder: "— Без папки —",
  nomPacking: "Фасовка",
  nomPackName: "Название",
  nomPackNamePh: "Мешок, Коробка, Бутылка...",
  nomPackQty: "Объём",
  nomPackPrice: "Цена (сўм)",
  nomDesc: "Описание",
  nomDescPh: "Необязательно",
  nomImage: "Фото",
  nomImageUpload: "Загрузить фото",
  nomNutrition: "Пищевая ценность (на 100 г)",
  nomProteins: "Белки (г)",
  nomFats: "Жиры (г)",
  nomCarbs: "Углеводы (г)",
  nomCalories: "Калории (ккал)",
  nomParams: "Параметры",
  nomGross: "Брутто (до обработки)",
  nomGrossPh: "Масса до очистки",
  nomGrossHint: "Вес с кожурой, костями и отходами",
  nomNet: "Нетто / Норма закладки",
  nomNetPh: "Масса после обработки",
  nomNetHint: "Чистый вес — сколько кладётся в блюдо",
  nomYield: "Выход (%)",
  nomYieldAuto: "авто",
  nomLoss: "Потери",
  nomFillGross: "Заполните брутто/нетто",
  nomLinkedCard: "Связанная техкарта (опционально)",
  nomNoLinked: "— Не указана —",
  nomLinkedOut: "выход",
  nomCancel: "Отмена",
  nomSave: "Сохранить",
  // Folder form
  folderFormName: "Название папки",
  folderFormNamePh: "Напр.: Мясо и птица",
  folderFormParent: "Вложить в (необязательно)",
  folderFormRoot: "— Корневая папка —",
  folderFormCancel: "Отмена",
  folderFormCreate: "Создать",
  // Ingredient row
  ingType: "Тип",
  ingProduct: "Продукт",
  ingCard: "ПФ/Карта",
  ingSelectNom: "— Выберите номенклатуру —",
  ingSelectCard: "— Выберите техкарту (ПФ) —",
  ingQtyPh: "Кол-во",
  // Step editor
  stepName: "Название этапа",
  stepNameDefault: "Этап",
  stepProcess: "Процесс",
  stepTemp: "Температура °C",
  stepTime: "Время (мин)",
  stepPressure: "Давление (атм)",
  stepNote: "Примечание",
  stepNotePh: "Доп. параметры",
  stepComposition: "Состав этапа",
  stepNoIngs: "Нет ингредиентов",
  // CardForm
  cardName: "Название техкарты",
  cardNamePh: "Напр.: Борщ украинский",
  cardOutputQty: "Выход (кол-во)",
  cardOutputUnit: "Ед. выхода",
  cardDesc: "Описание",
  cardDescPh: "Краткое описание",
  cardNorms: "Нормы закладки и выхода",
  cardGross: "Брутто (до обработки)",
  cardGrossPh: "Масса сырья",
  cardGrossHint: "Вес до очистки и разморозки",
  cardNet: "Нетто / Норма закладки",
  cardNetPh: "Чистый вес",
  cardNetHint: "После обработки — фактическая закладка в блюдо",
  cardYield: "Выход (%)",
  cardYieldAuto: "авто",
  cardLoss: "Потери",
  cardFillGross: "Заполните брутто и нетто",
  cardCostLabel: "Себестоимость",
  cardStepsTitle: "Этапы производства",
  cardAddStep: "Добавить этап",
  cardNoSteps: "Нет этапов",
  cardAdd: "Добавить",
  cardCancel: "Отмена",
  cardSave: "Сохранить",
  // Cards tab
  typesLabel: "ТИПЫ:",
  noCards: "Техкарт пока нет",
  createFirst: "Создать первую",
  outputLabel: "Выход",
  costLabel: "Себестоимость",
  treeBtn: "Дерево",
  bruttoLabel: "Брутто:",
  nettoLabel: "Нетто:",
  yieldLabel: "Выход:",
  // Nom tab
  noItems: "Позиций не найдено",
  addItem: "Добавить позицию",
  nomThType: "Тип",
  nomThName: "Наименование",
  nomThUnit: "Ед.",
  nomThPrice: "Цена сўм",
  nomThPack: "Фасовка",
  nomThFolder: "Папка",
  // Modals
  modalNewNom: "Новая позиция номенклатуры",
  modalEditNom: "Редактировать позицию",
  modalNewCard: "Новая технологическая карта",
  modalNewCardSub: "Блюдо нельзя использовать как ингредиент в других картах",
  modalEditCard: "Редактировать техкарту",
  modalNewFolder: "Новая папка",
  modalExcelImport: "Excel / CSV импорт",
  modalExcelSub: "Загрузка продуктов из файла",
  modalBatchPrice: "Пакетный ввод цен",
  modalBatchPriceSub: "Введите цены для всех продуктов сразу",
  modalDetailSub: "Полное дерево состава",
  modalClose: "Закрыть",
  modalDownloadExcel: "Скачать Excel",
  // Currency
  currency: "сўм",
  perUnit: "ед.",
  // Nomenclature types
  ntTovar: "Товар",
  ntZagotovka: "Заготовка",
  ntPolufabrikat: "Полуфабрикат",
  ntGotovaya: "Готовая продукция",
  ntBlyudo: "Блюдо",
  ntShortTovar: "ТВ",
  ntShortZagotovka: "ЗГ",
  ntShortPolufabrikat: "ПФ",
  ntShortGotovaya: "ГП",
  ntShortBlyudo: "БЛ",
  // Processes
  processVarka: "Варка",
  processZharka: "Жарка",
  processZapekanie: "Запекание",
  processSmeshan: "Смешивание",
  processNarezka: "Нарезка",
  processMarinov: "Маринование",
  processOhlazh: "Охлаждение",
  processZamorozka: "Заморозка",
  processPasserovka: "Пассеровка",
  processTushenie: "Тушение",
  processBlansh: "Бланширование",
  processVzbiv: "Взбивание",
  processDrugoe: "Другое",
  // Excel export
  expTechCard: "ТЕХНОЛОГИЧЕСКАЯ КАРТА",
  expName: "Название:",
  expDesc: "Описание:",
  expOutput: "Выход:",
  expGross: "Брутто:",
  expNet: "Нетто:",
  expYieldPct: "Выход %:",
  expCost: "Себестоимость:",
  expCostPerUnit: "Себест./ед.:",
  expNutrPer: "КБЖУ НА ПОРЦИЮ",
  expProteins: "Белки:",
  expFats: "Жиры:",
  expCarbs: "Углеводы:",
  expCalories: "Калорийность:",
  expDate: "Дата:",
  expBOM: "ВЕДОМОСТЬ СЫРЬЯ (BOM)",
  expIngredient: "Ингредиент",
  expNomType: "Тип номенклатуры",
  expQty: "Кол-во",
  expPricePerUnit: "Цена/ед.",
  expSum: "Сумма сўм",
  expLevel: "Уровень",
  expMain: "Основной",
  expLevelN: "Ур.",
  expTotal: "ИТОГО:",
  expStepsSheet: "ЭТАПЫ —",
  expStepNum: "№",
  expStepName: "Этап",
  expStepProcess: "Процесс",
  expStepTemp: "Т°C",
  expStepMin: "Мин",
  expStepPressure: "Давл.",
  expStepNote: "Примечание",
  expStepIng: "Ингредиент",
  expStepNomType: "Тип номенкл.",
  expStepCost: "Стоим. сўм",
  expSemiTag: "ПФ",
  expSemiLabel: "Полуфабрикат",
  expStepDefault: "Этап",
  expCardSheet: "Техкарта",
  expStepsSheetName: "Этапы",
  // Auth
  loginTitle: "Вход в систему",
  loginLogin: "Логин",
  loginPassword: "Пароль",
  loginBtn: "Войти",
  loginError: "Неверный логин или пароль",
  loginNoAccount: "Нет аккаунта?",
  loginCreateAccount: "Зарегистрироваться",
  loginHaveAccount: "Уже есть аккаунт?",
  loginPh: "Введите логин",
  passwordPh: "Введите пароль",
  logoutBtn: "Выход",
  forgotPassword: "Забыли пароль?",
  resetTitle: "Восстановление пароля",
  resetNewPass: "Новый пароль",
  resetBtn: "Обновить пароль",
  resetBack: "← Войти",
  resetSuccess: "Пароль обновлён! Войдите с новым паролем.",
  resetError: "Пользователь не найден",
  resetPassShort: "Пароль мин. 4 символа",
  tabSettings: "Настройки",
  settingsTitle: "Настройки",
  regLogin: "Логин",
  regLoginPh: "Придумайте логин",
  regPassword: "Пароль",
  regPasswordPh: "Придумайте пароль",
  // Settings
  setProfile: "Личные данные",
  setSecurity: "Логин и пароль",
  setAvatar: "Фото профиля",
  setTariff: "Тарифный план",
  setDeleteData: "Очистить базу",
  setDeleteAccount: "Удалить аккаунт",
  setSave: "Сохранить",
  setSaved: "Сохранено!",
  setOldPassword: "Текущий пароль",
  setNewPassword: "Новый пароль",
  setNewLogin: "Новый логин",
  setChangePassword: "Изменить пароль",
  setChangeLogin: "Изменить логин",
  setPasswordChanged: "Пароль изменён!",
  setLoginChanged: "Логин изменён!",
  setLoginTaken: "Этот логин занят",
  setWrongPassword: "Неверный текущий пароль",
  setPasswordShort: "Минимум 4 символа",
  setLoginShort: "Минимум 3 символа",
  setUploadPhoto: "Загрузить фото",
  setRemovePhoto: "Удалить фото",
  setTariffFree: "Бесплатный",
  setTariffCurrent: "Текущий тариф",
  setTariffSoon: "Тарифные планы скоро...",
  setDeleteDataWarn: "Все продукты, техкарты и папки будут удалены. Это действие необратимо!",
  setDeleteDataBtn: "Очистить базу",
  setDeleteDataDone: "База очищена!",
  setDeleteAccountWarn: "Аккаунт и все данные будут удалены безвозвратно. Это действие необратимо!",
  setDeleteAccountBtn: "Удалить аккаунт",
  setConfirmDelete: "Для подтверждения введите \"УДАЛИТЬ\"",
  setConfirmWord: "УДАЛИТЬ",
  excelColType: "Тип (Товар/Заготовка...)",
  excelThType: "Тип",
};

var T = T_UZ;

function getT() { return T; }

function getNT() {
  return {
    tovar:        { label: T.ntTovar,        short: T.ntShortTovar,        color: "#60a5fa" },
    zagotovka:    { label: T.ntZagotovka,    short: T.ntShortZagotovka,    color: "#f59e0b" },
    polufabrikat: { label: T.ntPolufabrikat,  short: T.ntShortPolufabrikat, color: "#fb923c" },
    gotovaya:     { label: T.ntGotovaya,     short: T.ntShortGotovaya,     color: "#34d399" },
    blyudo:       { label: T.ntBlyudo,       short: T.ntShortBlyudo,       color: "#a78bfa" },
  };
}
function getPROCESSES() {
  return [T.processVarka, T.processZharka, T.processZapekanie, T.processSmeshan,
    T.processNarezka, T.processMarinov, T.processOhlazh, T.processZamorozka,
    T.processPasserovka, T.processTushenie, T.processBlansh, T.processVzbiv, T.processDrugoe];
}

// ─── Nomenclature Types (dynamic from T) ─────────────────────────────────────
var NT_KEYS = ["tovar", "zagotovka", "polufabrikat", "gotovaya", "blyudo"];
var COMPLEX = ["zagotovka", "polufabrikat", "gotovaya", "blyudo"];
var UNITS = ["кг", "г", "л", "мл", "шт", "уп", "порц", "пач"];

function buildCSS(t) {
  return "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');" +
    "*{box-sizing:border-box;margin:0;padding:0}" +
    "body{background:" + t.bg + ";color:" + t.text + ";font-family:'Inter',sans-serif;min-height:100vh}" +
    "::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-thumb{background:" + t.border + ";border-radius:3px}::-webkit-scrollbar-thumb:hover{background:" + t.acc + "66}" +
    "input,select,textarea{font-family:'Inter',sans-serif;outline:none;font-size:16px!important}" +
    "input:focus,select:focus,textarea:focus{border-color:" + t.acc + "!important}" +
    ".mono{font-family:'Inter',sans-serif}" +
    // ── Keyframes ──
    "@keyframes spin{to{transform:rotate(360deg)}}" +
    "@keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}" +
    "@keyframes fadeIn{from{opacity:0}to{opacity:1}}" +
    "@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}" +
    "@keyframes slideDown{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}" +
    "@keyframes slideLeft{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}" +
    "@keyframes slideRight{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}" +
    "@keyframes scaleIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}" +
    "@keyframes pulse{0%{box-shadow:0 0 0 0 " + t.acc + "44}70%{box-shadow:0 0 0 10px transparent}100%{box-shadow:0 0 0 0 transparent}}" +
    "@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}" +
    "@keyframes popIn{0%{opacity:0;transform:scale(0.7)}50%{transform:scale(1.05)}100%{opacity:1;transform:scale(1)}}" +
    "@keyframes ripple{0%{transform:scale(0);opacity:0.4}100%{transform:scale(2.5);opacity:0}}" +
    "@keyframes glow{0%{box-shadow:0 0 5px " + t.acc + "33}50%{box-shadow:0 0 20px " + t.acc + "55}100%{box-shadow:0 0 5px " + t.acc + "33}}" +
    "@keyframes bounceIn{0%{opacity:0;transform:scale(0.3)}50%{transform:scale(1.08)}70%{transform:scale(0.92)}100%{opacity:1;transform:scale(1)}}" +
    "@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-4px)}40%,80%{transform:translateX(4px)}}" +
    "@keyframes slideInRight{from{opacity:0;transform:translateX(15px)}to{opacity:1;transform:translateX(0)}}" +
    "@keyframes bgPulse{0%,100%{opacity:1}50%{opacity:0.6}}" +
    "@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}" +
    "@keyframes wiggle{0%,100%{transform:rotate(0)}25%{transform:rotate(-3deg)}75%{transform:rotate(3deg)}}" +
    "@keyframes expandWidth{from{width:0;opacity:0}to{width:100%;opacity:1}}" +
    "@keyframes countUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}" +
    "@keyframes borderGlow{0%,100%{border-color:" + t.border + "}50%{border-color:" + t.acc + "55}}" +
    "@keyframes slideUpModal{from{opacity:0;transform:translateY(30px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}" +
    "@keyframes heartbeat{0%,100%{transform:scale(1)}14%{transform:scale(1.08)}28%{transform:scale(1)}}" +
    "@keyframes typewriter{from{width:0}to{width:100%}}" +
    "@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}" +
    "@keyframes gradientShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}" +
    "@keyframes iconBounce{0%,100%{transform:translateY(0)}40%{transform:translateY(-4px)}60%{transform:translateY(-2px)}}" +
    "@keyframes tabSlide{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}" +
    // ── Animation classes ──
    ".fi{animation:fi .3s cubic-bezier(.22,1,.36,1);animation-fill-mode:both}" +
    ".pop-in{animation:popIn .35s cubic-bezier(.22,1,.36,1);animation-fill-mode:both}" +
    ".scale-in{animation:scaleIn .25s cubic-bezier(.22,1,.36,1);animation-fill-mode:both}" +
    ".slide-up{animation:slideUp .35s cubic-bezier(.22,1,.36,1);animation-fill-mode:both}" +
    ".slide-left{animation:slideLeft .35s cubic-bezier(.22,1,.36,1);animation-fill-mode:both}" +
    ".bounce-in{animation:bounceIn .5s cubic-bezier(.22,1,.36,1);animation-fill-mode:both}" +
    ".fade-in{animation:fadeIn .3s ease;animation-fill-mode:both}" +
    ".tab-content{animation:tabSlide .3s cubic-bezier(.22,1,.36,1);animation-fill-mode:both}" +
    // ── Buttons ──
    "button{transition:all .2s cubic-bezier(.22,1,.36,1)!important;position:relative;overflow:hidden}" +
    "button:hover{filter:brightness(1.12);transform:translateY(-1px)}" +
    "button:active{transform:scale(0.94) translateY(0)!important;filter:brightness(0.9)!important;transition-duration:0.06s!important}" +
    // ── Cards ──
    ".card-item{transition:all .3s cubic-bezier(.22,1,.36,1)}" +
    ".card-item:hover{transform:translateY(-4px);box-shadow:0 14px 35px " + t.bg + "99;border-color:" + t.acc + "33!important}" +
    ".card-item:active{transform:translateY(-1px) scale(0.985);transition-duration:0.08s}" +
    // ── Table rows ──
    "tr{transition:all .2s cubic-bezier(.22,1,.36,1)}" +
    "tbody tr:hover{background:" + t.btnHover + "!important}" +
    "tbody tr:hover td{background:" + t.btnHover + "}" +
    "tbody tr:active td{background:" + t.acc + "0d}" +
    // ── Inputs ──
    "input,select,textarea{transition:all .25s cubic-bezier(.22,1,.36,1)!important}" +
    "input:focus,select:focus,textarea:focus{box-shadow:0 0 0 3px " + t.acc + "25!important;transform:scale(1.006);border-color:" + t.acc + "!important}" +
    "input:hover,select:hover,textarea:hover{border-color:" + t.borderH + "!important}" +
    // ── Nav ──
    ".nav-tab{position:relative;overflow:hidden}" +
    ".nav-tab::after{content:'';position:absolute;bottom:2px;left:50%;width:0;height:2.5px;background:" + t.acc + ";transition:all .3s cubic-bezier(.22,1,.36,1);transform:translateX(-50%);border-radius:2px}" +
    ".nav-tab:hover::after{width:50%}" +
    ".nav-tab:hover{background:" + t.acc + "0a!important}" +
    ".nav-tab:active{transform:scale(0.95)!important}" +
    ".nav-logo-icon{animation:float 3s ease-in-out infinite}" +
    // ── Badges ──
    ".badge-pop{animation:popIn .35s cubic-bezier(.22,1,.36,1);animation-fill-mode:both}" +
    // ── Modals ──
    ".modal-wrap{animation:fadeIn .15s ease}" +
    ".modal-inner{animation:slideUpModal .3s cubic-bezier(.22,1,.36,1)!important;animation-fill-mode:both}" +
    // ── Hover effects ──
    ".hover-lift{transition:all .25s cubic-bezier(.22,1,.36,1)}" +
    ".hover-lift:hover{transform:translateY(-3px);box-shadow:0 8px 25px " + t.bg + "77}" +
    ".hover-glow{transition:all .25s cubic-bezier(.22,1,.36,1)}" +
    ".hover-glow:hover{box-shadow:0 0 15px " + t.acc + "28;border-color:" + t.acc + "44!important}" +
    ".hover-scale{transition:all .2s cubic-bezier(.22,1,.36,1)}" +
    ".hover-scale:hover{transform:scale(1.03)}" +
    ".hover-scale:active{transform:scale(0.97)}" +
    // ── Stagger delays ──
    ".stagger-1{animation-delay:0.05s}.stagger-2{animation-delay:0.1s}.stagger-3{animation-delay:0.15s}.stagger-4{animation-delay:0.2s}.stagger-5{animation-delay:0.25s}" +
    ".stagger-6{animation-delay:0.3s}.stagger-7{animation-delay:0.35s}.stagger-8{animation-delay:0.4s}.stagger-9{animation-delay:0.45s}.stagger-10{animation-delay:0.5s}" +
    // ── Special ──
    ".icon-spin:hover svg{animation:spin .5s cubic-bezier(.22,1,.36,1)}" +
    ".icon-bounce:hover svg{animation:iconBounce .4s ease}" +
    ".icon-wiggle:hover svg{animation:wiggle .4s ease}" +
    ".press-effect{transition:all .15s ease}.press-effect:active{transform:scale(0.92)!important}" +
    ".gradient-animate{background-size:200% 200%;animation:gradientShift 3s ease infinite}" +
    // ── Nom stat cards ──
    ".nom-stat-card{transition:all .25s cubic-bezier(.22,1,.36,1);cursor:default}" +
    ".nom-stat-card:hover{transform:translateY(-2px);box-shadow:0 6px 18px " + t.bg + "55}" +
    // ── Folder sidebar ──
    ".folder-item{transition:all .2s cubic-bezier(.22,1,.36,1)}" +
    ".folder-item:hover{background:" + t.acc + "0d!important;transform:translateX(2px)}" +
    // ── Step cards ──
    ".step-card{transition:all .25s cubic-bezier(.22,1,.36,1)}" +
    ".step-card:hover{border-color:" + t.acc + "33!important;box-shadow:0 4px 15px " + t.bg + "55}" +
    // ── Type filter btns ──
    ".type-btn{transition:all .2s cubic-bezier(.22,1,.36,1)!important}" +
    ".type-btn:hover{transform:translateY(-1px)!important;box-shadow:0 3px 10px " + t.bg + "44}" +
    // ── Count animation ──
    ".count-num{animation:countUp .4s cubic-bezier(.22,1,.36,1);animation-fill-mode:both;display:inline-block}" +
    // ── Search ──
    ".search-wrap input:focus ~ .search-glow{opacity:1}" +
    ".search-glow{position:absolute;inset:-1px;border-radius:11px;background:" + t.acc + "15;opacity:0;transition:opacity .3s ease;pointer-events:none;z-index:-1}" +
    // ── Mobile ──
    "@media(max-width:768px){" +
      ".nav-inner{flex-wrap:wrap!important;gap:4px!important;padding:6px 0!important}" +
      ".nav-tab-text{display:none!important}" +
      ".nav-tab{padding:8px 12px!important;font-size:12px!important}" +
      ".nav-search{width:100%!important;order:10}" +
      ".nav-search input{width:100%!important}" +
      ".nav-btn-text{display:none!important}" +
      ".nav-btn{font-size:11px!important;padding:7px 10px!important}" +
      ".cards-grid{grid-template-columns:1fr!important}" +
      ".nom-layout{grid-template-columns:1fr!important}" +
      ".nom-sidebar{position:relative!important;top:auto!important}" +
      ".nom-stats{grid-template-columns:repeat(3,1fr)!important}" +
      ".nom-stats>div{padding:6px 8px!important}" +
      ".form-2col{grid-template-columns:1fr!important}" +
      ".form-3col{grid-template-columns:1fr!important}" +
      ".form-4col{grid-template-columns:1fr 1fr!important}" +
      ".ing-row{grid-template-columns:1fr!important;gap:8px!important}" +
      ".ing-row>*{min-width:0!important}" +
      ".modal-inner{max-width:100%!important;max-height:100vh!important;border-radius:14px 14px 0 0!important;margin:0!important;margin-top:auto!important}" +
      ".modal-wrap{padding:0!important;align-items:flex-end!important}" +
      ".nom-table{display:block;overflow-x:auto;-webkit-overflow-scrolling:touch}" +
      ".nom-table table{min-width:800px}" +
      ".type-legend{display:none!important}" +
      ".step-header-badges{flex-wrap:wrap}" +
      ".nom-type-btns{gap:4px!important}" +
      ".nom-type-btns button{padding:5px 8px!important;font-size:11px!important}" +
      ".reg-form{padding:16px!important;margin:8px!important;border-radius:16px!important}" +
      ".reg-form .reg-title{font-size:18px!important}" +
      ".nav-user-name{display:none!important}" +
    "}" +
    "@media(max-width:400px){" +
      ".form-4col{grid-template-columns:1fr!important}" +
      ".nom-stats{grid-template-columns:repeat(2,1fr)!important}" +
    "}";
}

// ─── Animated Components ─────────────────────────────────────────────────────
// Counter that animates from 0 to target value
function AnimNum(props) {
  var [val, setVal] = useState(0);
  var target = +props.value || 0;
  useEffect(function() {
    if (target === 0) { setVal(0); return; }
    var start = 0, duration = 600, startTime = null;
    function step(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [target]);
  return <span className="count-num">{val}</span>;
}

// Staggered list — each child appears with delay
function StaggerList(props) {
  var anim = props.anim || "slide-up";
  var items = props.children;
  if (!Array.isArray(items)) items = [items];
  return items.map(function(child, i) {
    if (!child) return null;
    var delay = (props.baseDelay || 0.04) * i;
    return (
      <div key={child.key || i} className={anim} style={{ animationDelay: delay + "s", animationFillMode: "both" }}>
        {child}
      </div>
    );
  });
}

// Tab content wrapper — re-animates when key changes
function TabTransition(props) {
  var [show, setShow] = useState(true);
  var prevKey = useRef(props.tabKey);
  useEffect(function() {
    if (prevKey.current !== props.tabKey) {
      setShow(false);
      var t = setTimeout(function() { setShow(true); prevKey.current = props.tabKey; }, 30);
      return function() { clearTimeout(t); };
    }
  }, [props.tabKey]);
  return (
    <div className={show ? "tab-content" : ""} style={{ opacity: show ? 1 : 0, transition: "opacity 0.05s" }}>
      {props.children}
    </div>
  );
}

// ─── Utils ────────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 10); }
function fmt(n) { return (isNaN(+n) || n === "") ? "—" : Number(n).toFixed(2); }
function ntColor(type) { var nt = getNT(); return (nt[type] || nt.tovar).color; }
function ntLabel(type) { var nt = getNT(); return (nt[type] || nt.tovar).label; }
function ntShort(type) { var nt = getNT(); return (nt[type] || nt.tovar).short; }

function getFolderChildren(fid, folders) {
  var res = [fid];
  folders.filter(function(f) { return f.parentId === fid; })
    .forEach(function(c) { getFolderChildren(c.id, folders).forEach(function(id) { res.push(id); }); });
  return res;
}
function getFolderDepth(id, folders, d) {
  if (d === undefined) d = 0;
  var f = folders.find(function(x) { return x.id === id; });
  if (!f || !f.parentId) return d;
  return getFolderDepth(f.parentId, folders, d + 1);
}

// ─── Cost Engine ──────────────────────────────────────────────────────────────
function costPerUnit(cardId, allCards, allProds, visited) {
  if (!visited) visited = [];
  if (visited.indexOf(cardId) >= 0) return 0;
  var card = allCards.find(function(c) { return c.id === cardId; });
  if (!card) return 0;
  var nxt = visited.concat([cardId]);
  var total = 0;
  card.steps.forEach(function(s) {
    s.ingredients.forEach(function(i) {
      if (i.type === "product") {
        var p = allProds.find(function(p) { return p.id === i.refId; });
        if (p && i.qty) total += +p.price * +i.qty;
      } else {
        total += costPerUnit(i.refId, allCards, allProds, nxt) * (+i.qty || 0);
      }
    });
  });
  var effectiveOutput = +card.netWeight > 0 ? +card.netWeight : (+card.outputQty || 1);
  return total / effectiveOutput;
}
function totalCost(card, allCards, allProds) {
  var total = 0;
  card.steps.forEach(function(s) {
    s.ingredients.forEach(function(i) {
      if (i.type === "product") {
        var p = allProds.find(function(p) { return p.id === i.refId; });
        if (p && i.qty) total += +p.price * +i.qty;
      } else {
        total += costPerUnit(i.refId, allCards, allProds, []) * (+i.qty || 0);
      }
    });
  });
  return total;
}
// Nutrition calculator for tech cards (per full recipe)
function calcNutrition(card, allCards, allProds, visited) {
  if (!visited) visited = [];
  if (visited.indexOf(card.id) >= 0) return { proteins: 0, fats: 0, carbs: 0, calories: 0 };
  var nxt = visited.concat([card.id]);
  var tot = { proteins: 0, fats: 0, carbs: 0, calories: 0 };
  card.steps.forEach(function(s) {
    s.ingredients.forEach(function(i) {
      var qty = +i.qty || 0;
      if (i.type === "product") {
        var p = allProds.find(function(p) { return p.id === i.refId; });
        if (p && qty > 0) {
          // qty is in product units (kg, l, etc), nutrition is per 100g
          // 1 kg = 1000g, so multiply by qty * 10 (qty_in_kg * 1000 / 100)
          var mult = qty * 10; // for kg-based units
          if (p.unit === "г" || p.unit === "мл") mult = qty / 100;
          else if (p.unit === "л") mult = qty * 10;
          else if (p.unit === "шт") mult = qty * 0.5; // rough estimate for pieces
          tot.proteins += (+p.proteins || 0) * mult;
          tot.fats += (+p.fats || 0) * mult;
          tot.carbs += (+p.carbs || 0) * mult;
          tot.calories += (+p.calories || 0) * mult;
        }
      } else {
        var sub = allCards.find(function(c) { return c.id === i.refId; });
        if (sub) {
          var subN = calcNutrition(sub, allCards, allProds, nxt);
          var subOut = +sub.outputQty || 1;
          tot.proteins += subN.proteins / subOut * qty;
          tot.fats += subN.fats / subOut * qty;
          tot.carbs += subN.carbs / subOut * qty;
          tot.calories += subN.calories / subOut * qty;
        }
      }
    });
  });
  return tot;
}

function getDeps(cardId, allCards, visited) {
  if (!visited) visited = [];
  if (visited.indexOf(cardId) >= 0) return visited;
  visited.push(cardId);
  var card = allCards.find(function(c) { return c.id === cardId; });
  if (!card) return visited;
  card.steps.forEach(function(s) {
    s.ingredients.forEach(function(i) {
      if (i.type === "semifinished") getDeps(i.refId, allCards, visited);
    });
  });
  return visited;
}
function getDepth(cardId, allCards, visited) {
  if (!visited) visited = [];
  if (visited.indexOf(cardId) >= 0) return 0;
  var card = allCards.find(function(c) { return c.id === cardId; });
  if (!card) return 0;
  var nxt = visited.concat([cardId]);
  var max = 0;
  card.steps.forEach(function(s) {
    s.ingredients.forEach(function(i) {
      if (i.type === "semifinished") {
        var d = getDepth(i.refId, allCards, nxt);
        if (d > max) max = d;
      }
    });
  });
  return max + 1;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function Svg(props) {
  return (
    <svg width={props.s || 15} height={props.s || 15} viewBox="0 0 24 24" fill="none"
      stroke={props.c || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={props.d} />
    </svg>
  );
}
function IPlus(p)   { return <Svg s={p.s} c={p.c} d="M12 5v14M5 12h14" />; }
function IEdit(p)   { return <Svg s={p.s} c={p.c} d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" />; }
function ITrash(p)  { return <Svg s={p.s} c={p.c} d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />; }
function IDown(p)   { return <Svg s={p.s} c={p.c} d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />; }
function IChD(p)    { return <Svg s={p.s || 12} c={p.c} d="M6 9l6 6 6-6" />; }
function IChU(p)    { return <Svg s={p.s || 12} c={p.c} d="M18 15l-6-6-6 6" />; }
function IX(p)      { return <Svg s={p.s} c={p.c} d="M18 6 6 18M6 6l12 12" />; }
function ICheck(p)  { return <Svg s={p.s} c={p.c} d="M20 6 9 17l-5-5" />; }
function ISearch(p) { return <Svg s={p.s} c={p.c} d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0" />; }
function ILayers(p) { return <Svg s={p.s} c={p.c} d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />; }
function IBox(p)    { return <Svg s={p.s} c={p.c} d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />; }
function IScis(p)   { return <Svg s={p.s} c={p.c} d="M6 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" />; }
function IPkg(p)    { return <Svg s={p.s} c={p.c} d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4zM3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />; }
function IStar(p)   { return <Svg s={p.s} c={p.c} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />; }
function IFolder(p) { return <Svg s={p.s} c={p.c} d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />; }
function IScale(p)  { return <Svg s={p.s} c={p.c} d="M12 3v18M3 9l9-6 9 6M3 15l9 6 9-6" />; }
function ITree(p)   { return <Svg s={p.s} c={p.c} d="M3 3h6v6H3zM15 15h6v6h-6zM9 6h6M12 6v9M9 18h6" />; }
function ISun(p)    { return <Svg s={p.s} c={p.c} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.36 6.36l-.7-.7M6.34 6.34l-.7-.7m12.72 0l-.7.7M6.34 17.66l-.7.7M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />; }
function IMoon(p)   { return <Svg s={p.s} c={p.c} d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />; }
function IUser(p)   { return <Svg s={p.s} c={p.c} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />; }
function IShield(p) { return <Svg s={p.s} c={p.c} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />; }
function ICam(p)    { return <Svg s={p.s} c={p.c} d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />; }
function IGlobe(p)  { return <Svg s={p.s} c={p.c} d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" />; }
function IFire(p)   { return <Svg s={p.s} c={p.c} d="M12 22c3.5 0 7-2 7-7 0-3-1.5-4.5-3-6.5-.7-.9-1.5-2-2-3.5-.5 1.5-1.3 2.6-2 3.5-1.5 2-3 3.5-3 6.5 0 5 3.5 7 7 7z" />; }
function IClip(p)   { return <Svg s={p.s} c={p.c} d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />; }
function ILogout(p) { return <Svg s={p.s} c={p.c} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />; }
function IGear(p)   { return <Svg s={p.s} c={p.c} d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />; }

function NomIcon(props) {
  var col = ntColor(props.type);
  var s = props.s || 14;
  if (props.type === "tovar")        return <IBox s={s} c={col} />;
  if (props.type === "zagotovka")    return <IScis s={s} c={col} />;
  if (props.type === "polufabrikat") return <ILayers s={s} c={col} />;
  if (props.type === "gotovaya")     return <IPkg s={s} c={col} />;
  if (props.type === "blyudo")       return <IStar s={s} c={col} />;
  return <IBox s={s} c={col} />;
}

// ─── UI Primitives ────────────────────────────────────────────────────────────
function Btn(props) {
  var sizes = { xs: { padding: "4px 9px", fontSize: 11 }, sm: { padding: "6px 12px", fontSize: 12 }, md: { padding: "9px 16px", fontSize: 13 } };
  var sz = sizes[props.sz || "md"];
  var variants = {
    pri:     { background: "linear-gradient(135deg, " + C.acc + ", " + C.acc + "dd)", color: "#000", border: "none", boxShadow: "0 2px 8px " + C.acc + "33" },
    ghost:   { background: "transparent", color: C.mid, border: "1px solid " + C.border },
    danger:  { background: C.red + "18",  color: C.red,    border: "1px solid " + C.red + "33" },
    success: { background: C.green + "18",color: C.green,  border: "1px solid " + C.green + "33" },
    info:    { background: C.blue + "18", color: C.blue,   border: "1px solid " + C.blue + "33" },
    warn:    { background: C.orange + "18", color: C.orange, border: "1px solid " + C.orange + "33" },
  };
  var v = variants[props.v || "pri"] || variants.pri;
  var base = { display: "inline-flex", alignItems: "center", gap: 5, cursor: props.disabled ? "not-allowed" : "pointer",
    borderRadius: 8, fontFamily: "'Inter',sans-serif", fontWeight: 700, transition: "all .2s cubic-bezier(.4,0,.2,1)",
    opacity: props.disabled ? 0.4 : 1, whiteSpace: "nowrap", letterSpacing: "0.2px", position: "relative", overflow: "hidden" };

  function handleClick(e) {
    if (props.disabled) return;
    // ripple
    var btn = e.currentTarget;
    var rect = btn.getBoundingClientRect();
    var ripple = document.createElement("span");
    var size = Math.max(rect.width, rect.height);
    ripple.style.cssText = "position:absolute;border-radius:50%;pointer-events:none;animation:ripple .5s ease-out forwards;width:" + size + "px;height:" + size + "px;left:" + (e.clientX - rect.left - size/2) + "px;top:" + (e.clientY - rect.top - size/2) + "px;background:" + (props.v === "pri" ? "#00000022" : C.acc + "22");
    btn.appendChild(ripple);
    setTimeout(function() { ripple.remove(); }, 500);
    if (props.onClick) props.onClick(e);
  }

  return (
    <button onClick={handleClick} title={props.title} className={props.className || ""}
      style={Object.assign({}, base, sz, v, props.sx || {})}>
      {props.children}
    </button>
  );
}

function Inp(props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {props.label && <label style={{ fontSize: 10, fontWeight: 700, color: C.mid, textTransform: "uppercase", letterSpacing: 0.7 }}>{props.label}</label>}
      <input value={props.value || ""} onChange={props.readOnly ? undefined : function(e) { props.onChange(e.target.value); }}
        readOnly={props.readOnly} type={props.type || "text"} placeholder={props.placeholder}
        style={Object.assign({ background: C.sur, border: "1px solid " + C.border, borderRadius: 6, padding: "8px 10px",
          color: props.readOnly ? C.mid : C.text, fontSize: 13, transition: "border .15s", width: "100%" }, props.sx || {})} />
      {props.hint && <span style={{ fontSize: 10, color: C.dim }}>{props.hint}</span>}
    </div>
  );
}

function Sel(props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {props.label && <label style={{ fontSize: 10, fontWeight: 700, color: C.mid, textTransform: "uppercase", letterSpacing: 0.7 }}>{props.label}</label>}
      <select value={props.value || ""} onChange={function(e) { props.onChange(e.target.value); }}
        style={Object.assign({ background: C.sur, border: "1px solid " + C.border, borderRadius: 6, padding: "8px 10px", color: C.text, fontSize: 13 }, props.sx || {})}>
        {(props.options || []).map(function(o) {
          if (typeof o === "string") return <option key={o} value={o}>{o}</option>;
          return <option key={o.v} value={o.v}>{o.l}</option>;
        })}
      </select>
    </div>
  );
}

function Badge(props) {
  var col = props.col || C.acc;
  return (
    <span className="badge-pop" style={{ background: col + "14", color: col, border: "1px solid " + col + "22",
      borderRadius: 6, padding: "2px 7px", fontSize: props.sz || 10, fontFamily: "'Inter',sans-serif",
      fontWeight: 600, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 3,
      letterSpacing: "0.2px", transition: "all .2s ease" }}>
      {props.children}
    </span>
  );
}

function Modal(props) {
  return (
    <div className="modal-wrap" onClick={function(e) { if (e.target === e.currentTarget) props.onClose(); }}
      style={{ position: "fixed", inset: 0, background: "#000000cc", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", zIndex: 300,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 14 }}>
      <div className="modal-inner" style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 14,
        width: "100%", maxWidth: props.width || 640, maxHeight: "92vh", display: "flex", flexDirection: "column",
        boxShadow: "0 20px 60px #00000066" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 18px", borderBottom: "1px solid " + C.border, flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800 }}>{props.title}</h3>
            {props.sub && <p style={{ fontSize: 11, color: C.mid, marginTop: 2 }}>{props.sub}</p>}
          </div>
          <Btn v="ghost" sz="sm" onClick={props.onClose}><IX /></Btn>
        </div>
        <div style={{ overflowY: "auto", padding: 18, flex: 1 }}>{props.children}</div>
      </div>
    </div>
  );
}

// ─── Registration Form ───────────────────────────────────────────────────────
function LoginForm(props) {
  var [login, setLogin] = useState("");
  var [password, setPassword] = useState("");
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState("");
  var [resetMode, setResetMode] = useState(false);
  var [newPass, setNewPass] = useState("");
  var [resetMsg, setResetMsg] = useState("");

  async function submit() {
    if (!login.trim() || !password) return;
    setLoading(true);
    setError("");
    try {
      var res = await api.login(login.trim(), password);
      if (res.ok && res.user) props.onDone(res.user);
      else setError(T.loginError);
    } catch(e) { setError(T.loginError); }
    setLoading(false);
  }

  async function doReset() {
    if (!login.trim() || !newPass || newPass.length < 4) {
      setError(T.resetPassShort || "Min 4 characters");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.resetPassword(login.trim(), newPass);
      setResetMsg(T.resetSuccess || "Пароль обновлён! Войдите с новым паролем.");
      setResetMode(false);
      setPassword("");
    } catch(e) {
      setError(T.resetError || "Пользователь не найден");
    }
    setLoading(false);
  }

  var ready = login.trim() && password;
  var resetReady = login.trim() && newPass && newPass.length >= 4;
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
      <div className="reg-form" style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 18, padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 8px 40px " + C.bg + "88" }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ width: 52, height: 52, background: "linear-gradient(135deg, " + C.acc + ", " + C.orange + ")", borderRadius: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 10, boxShadow: "0 4px 15px " + C.acc + "44" }}>
            <ILayers s={24} c="#000" />
          </div>
          <h2 className="reg-title" style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{T.appTitle}</h2>
          <p style={{ fontSize: 12, color: C.mid, marginTop: 4 }}>{resetMode ? (T.resetTitle || "Паролни тиклаш") : T.loginTitle}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Inp label={T.loginLogin} value={login} onChange={setLogin} placeholder={T.loginPh} />
          {resetMode ? (
            <>
              <Inp label={T.resetNewPass || "Янги пароль"} value={newPass} onChange={setNewPass} placeholder="Мин. 4 символ" type="password" />
              {error && <p style={{ color: C.red, fontSize: 12, textAlign: "center" }}>{error}</p>}
              <button onClick={doReset} disabled={loading || !resetReady}
                style={{ marginTop: 6, padding: "13px 20px", background: resetReady ? "linear-gradient(135deg, " + C.purple + ", " + C.blue + ")" : C.dim, color: "#fff", border: "none", borderRadius: 10,
                  fontFamily: "'Inter',sans-serif", fontWeight: 800, fontSize: 15, cursor: loading ? "wait" : (resetReady ? "pointer" : "not-allowed"),
                  opacity: resetReady ? 1 : 0.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {loading ? <><div style={{ width: 16, height: 16, border: "2px solid #ffffff33", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .6s linear infinite" }} /> {T.loading}</> : (T.resetBtn || "Паролни янгилаш")}
              </button>
              <p style={{ textAlign: "center", fontSize: 12, color: C.mid }}>
                <span onClick={function() { setResetMode(false); setError(""); }} style={{ color: C.acc, cursor: "pointer", fontWeight: 700 }}>{T.resetBack || "← Кириш"}</span>
              </p>
            </>
          ) : (
            <>
              <Inp label={T.loginPassword} value={password} onChange={setPassword} placeholder={T.passwordPh} type="password" />
              {error && <p style={{ color: C.red, fontSize: 12, textAlign: "center" }}>{error}</p>}
              {resetMsg && <p style={{ color: C.green, fontSize: 12, textAlign: "center" }}>{resetMsg}</p>}
              <button onClick={submit} disabled={loading || !ready}
                style={{ marginTop: 6, padding: "13px 20px", background: ready ? "linear-gradient(135deg, " + C.acc + ", " + C.orange + ")" : C.dim, color: "#000", border: "none", borderRadius: 10,
                  fontFamily: "'Inter',sans-serif", fontWeight: 800, fontSize: 15, cursor: loading ? "wait" : (ready ? "pointer" : "not-allowed"),
                  opacity: ready ? 1 : 0.5, boxShadow: ready ? "0 4px 15px " + C.acc + "44" : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {loading ? <><div style={{ width: 16, height: 16, border: "2px solid #00000033", borderTopColor: "#000", borderRadius: "50%", animation: "spin .6s linear infinite" }} /> {T.loading}</> : <><ICheck s={15} c="#000" /> {T.loginBtn}</>}
              </button>
              <p style={{ textAlign: "center", fontSize: 12, color: C.mid }}>
                <span onClick={function() { setResetMode(true); setError(""); setResetMsg(""); }} style={{ color: C.purple, cursor: "pointer", fontWeight: 600, fontSize: 11 }}>{T.forgotPassword || "Паролни унутдингизми?"}</span>
              </p>
              <p style={{ textAlign: "center", fontSize: 12, color: C.mid }}>
                {T.loginNoAccount + " "}
                <span onClick={props.onSwitch} style={{ color: C.acc, cursor: "pointer", fontWeight: 700 }}>{T.loginCreateAccount}</span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RegForm(props) {
  var [f, setF] = useState({ name: "", age: "", city: "", position: "", workplace: "", purpose: "", login: "", password: "" });
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState("");
  function set(k) { return function(v) { setF(function(p) { return Object.assign({}, p, { [k]: v }); }); }; }

  async function submit() {
    if (!f.name.trim() || !f.workplace.trim()) return;
    if (!isTg && (!f.login.trim() || !f.password)) {
      setError(T.loginLogin + " / " + T.loginPassword + " required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      var res = await api.register(f);
      // If server returned a token (web registration), save it
      if (res.token) { api.setToken(res.token); }
      // Also login to get session token
      if (f.login && f.password && !res.token) {
        try { await api.login(f.login, f.password); } catch(e) {}
      }
      props.onDone(res);
    } catch(e) {
      console.error(e);
      setError(e.message || "Error");
    }
    setLoading(false);
  }

  var isTg = !!(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData);
  var ready = f.name.trim() && f.workplace.trim() && (isTg || (f.login.trim() && f.password));
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
      <div className="reg-form" style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 18, padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 8px 40px " + C.bg + "88" }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ width: 52, height: 52, background: "linear-gradient(135deg, " + C.acc + ", " + C.orange + ")", borderRadius: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 10, boxShadow: "0 4px 15px " + C.acc + "44" }}>
            <ILayers s={24} c="#000" />
          </div>
          <h2 className="reg-title" style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{T.appTitle}</h2>
          <p style={{ fontSize: 12, color: C.mid, marginTop: 4 }}>{T.regTitle}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: C.bg, borderRadius: 10, padding: "12px 12px 14px", border: "1px solid " + C.border }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <IUser s={13} c={C.blue} />
              <span style={{ fontSize: 11, fontWeight: 700, color: C.blue, textTransform: "uppercase", letterSpacing: 0.5 }}>{T.regName} *</span>
            </div>
            <input value={f.name} onChange={function(e) { set("name")(e.target.value); }} placeholder={T.regNamePh}
              style={{ width: "100%", background: C.sur, border: "1px solid " + C.border, borderRadius: 8, padding: "10px 12px", color: C.text, fontSize: 14 }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Inp label={T.regAge} value={f.age} onChange={set("age")} type="number" placeholder="25" />
            <Inp label={T.regCity} value={f.city} onChange={set("city")} placeholder={T.regCityPh} />
          </div>

          <div style={{ background: C.bg, borderRadius: 10, padding: "12px 12px 14px", border: "1px solid " + C.green + "33" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <IPkg s={13} c={C.green} />
              <span style={{ fontSize: 11, fontWeight: 700, color: C.green, textTransform: "uppercase", letterSpacing: 0.5 }}>{T.regWorkplace} *</span>
            </div>
            <input value={f.workplace} onChange={function(e) { set("workplace")(e.target.value); }} placeholder={T.regWorkplacePh}
              style={{ width: "100%", background: C.sur, border: "1px solid " + C.border, borderRadius: 8, padding: "10px 12px", color: C.text, fontSize: 14 }} />
          </div>

          <Inp label={T.regPosition} value={f.position} onChange={set("position")} placeholder={T.regPositionPh} />
          <Inp label={T.regPurpose} value={f.purpose} onChange={set("purpose")} placeholder={T.regPurposePh} />

          <div style={{ background: C.bg, borderRadius: 10, padding: "12px 12px 14px", border: "1px solid " + C.purple + "33" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <IShield s={13} c={C.purple} />
              <span style={{ fontSize: 11, fontWeight: 700, color: C.purple, textTransform: "uppercase", letterSpacing: 0.5 }}>{T.regLogin} / {T.regPassword} *</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input value={f.login} onChange={function(e) { set("login")(e.target.value); }} placeholder={T.regLoginPh}
                style={{ width: "100%", background: C.sur, border: "1px solid " + C.border, borderRadius: 8, padding: "10px 12px", color: C.text, fontSize: 13 }} />
              <input type="password" value={f.password} onChange={function(e) { set("password")(e.target.value); }} placeholder={T.regPasswordPh}
                style={{ width: "100%", background: C.sur, border: "1px solid " + C.border, borderRadius: 8, padding: "10px 12px", color: C.text, fontSize: 13 }} />
            </div>
          </div>

          {error && <p style={{ color: C.red, fontSize: 12, textAlign: "center" }}>{error}</p>}
          <button onClick={submit} disabled={loading || !ready}
            style={{ marginTop: 6, padding: "13px 20px", background: ready ? "linear-gradient(135deg, " + C.acc + ", " + C.orange + ")" : C.dim, color: "#000", border: "none", borderRadius: 10,
              fontFamily: "'Inter',sans-serif", fontWeight: 800, fontSize: 15, cursor: loading ? "wait" : (ready ? "pointer" : "not-allowed"),
              opacity: ready ? 1 : 0.5, boxShadow: ready ? "0 4px 15px " + C.acc + "44" : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              animation: ready ? "glow 2s ease infinite" : "none" }}>
            {loading ? <><div style={{ width: 16, height: 16, border: "2px solid #00000033", borderTopColor: "#000", borderRadius: "50%", animation: "spin .6s linear infinite" }} /> {T.loading}</> : <><ICheck s={15} c="#000" /> {T.regSubmit}</>}
          </button>
          {props.onSwitch && (
            <p style={{ textAlign: "center", fontSize: 12, color: C.mid }}>
              {T.loginHaveAccount + " "}
              <span onClick={props.onSwitch} style={{ color: C.acc, cursor: "pointer", fontWeight: 700 }}>{T.loginBtn}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Catalog Import Modal ────────────────────────────────────────────────────
function CatalogImport(props) {
  var [catProds, setCatProds] = useState([]);
  var [catDishes, setCatDishes] = useState([]);
  var [selected, setSelected] = useState({});
  var [selDishes, setSelDishes] = useState({});
  var [tab, setTab] = useState("products");
  var [loading, setLoading] = useState(true);
  var [result, setResult] = useState(null);

  useEffect(function() {
    (async function() {
      try {
        var [p, d] = await Promise.all([api.catalogProducts(), api.catalogDishes()]);
        setCatProds(p || []);
        setCatDishes(d || []);
      } catch(e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  var folders = [];
  catProds.forEach(function(p) { if (p.folder && folders.indexOf(p.folder) < 0) folders.push(p.folder); });
  var categories = [];
  catDishes.forEach(function(d) { if (d.category && categories.indexOf(d.category) < 0) categories.push(d.category); });

  function toggleAll(folder) {
    var items = catProds.filter(function(p) { return p.folder === folder; });
    var allSel = items.every(function(p) { return selected[p.name]; });
    var nxt = Object.assign({}, selected);
    items.forEach(function(p) { nxt[p.name] = !allSel; });
    setSelected(nxt);
  }

  function toggleAllDishes(cat) {
    var items = catDishes.filter(function(d) { return d.category === cat; });
    var allSel = items.every(function(d) { return selDishes[d.name]; });
    var nxt = Object.assign({}, selDishes);
    items.forEach(function(d) { nxt[d.name] = !allSel; });
    setSelDishes(nxt);
  }

  function selectAllProducts() {
    var nxt = {};
    catProds.forEach(function(p) { nxt[p.name] = true; });
    setSelected(nxt);
  }

  async function importProducts() {
    var items = catProds.filter(function(p) { return selected[p.name]; });
    if (!items.length) return;
    setLoading(true);
    try {
      var r = await api.importProducts(items);
      setResult("" + r.imported + " " + T.catImported);
      props.onImported();
    } catch(e) { setResult(T.catError + ": " + e.message); }
    setLoading(false);
  }

  async function importDishes() {
    var dishes = catDishes.filter(function(d) { return selDishes[d.name]; });
    if (!dishes.length) return;
    setLoading(true);
    var ok = 0, skip = 0;
    for (var i = 0; i < dishes.length; i++) {
      try {
        var r = await api.importDish(dishes[i]);
        if (r.ok) ok++; else skip++;
      } catch(e) { skip++; }
    }
    setResult("" + ok + " " + T.catDishImported + (skip > 0 ? ", " + skip + " " + T.catDishSkipped : ""));
    props.onImported();
    setLoading(false);
  }

  var selCount = Object.keys(selected).filter(function(k) { return selected[k]; }).length;
  var selDishCount = Object.keys(selDishes).filter(function(k) { return selDishes[k]; }).length;

  if (loading) return <div style={{ textAlign: "center", padding: 30, color: C.mid }}>{T.loading}</div>;
  if (result) return (
    <div style={{ textAlign: "center", padding: 30 }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
      <p style={{ fontSize: 15, fontWeight: 700, color: C.green, marginBottom: 16 }}>{result}</p>
      <Btn onClick={props.onClose}>{T.catClose}</Btn>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 6 }}>
        <Btn v={tab === "products" ? "pri" : "ghost"} sz="sm" onClick={function() { setTab("products"); }}>
          <IBox s={12} /> {T.catProducts} ({catProds.length})
        </Btn>
        <Btn v={tab === "dishes" ? "pri" : "ghost"} sz="sm" onClick={function() { setTab("dishes"); }}>
          <ILayers s={12} /> {T.catDishes} ({catDishes.length})
        </Btn>
      </div>

      {tab === "products" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: C.mid }}>{T.catSelected}: <strong style={{ color: C.acc }}>{selCount}</strong></span>
            <Btn v="ghost" sz="xs" onClick={selectAllProducts}>{T.catSelectAll}</Btn>
          </div>
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {folders.map(function(folder) {
              var items = catProds.filter(function(p) { return p.folder === folder; });
              var allSel = items.every(function(p) { return selected[p.name]; });
              return (
                <div key={folder} style={{ marginBottom: 8 }}>
                  <div onClick={function() { toggleAll(folder); }}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", background: C.sur, borderRadius: 6, cursor: "pointer", marginBottom: 3 }}>
                    <input type="checkbox" checked={allSel} readOnly style={{ accentColor: C.acc }} />
                    <IFolder s={12} c={C.acc} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{folder}</span>
                    <span style={{ fontSize: 10, color: C.dim, marginLeft: "auto" }}>{items.length}</span>
                  </div>
                  {items.map(function(p) {
                    return (
                      <label key={p.name} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 8px 3px 24px", cursor: "pointer", fontSize: 12, color: C.text }}>
                        <input type="checkbox" checked={!!selected[p.name]}
                          onChange={function() { setSelected(function(prev) { return Object.assign({}, prev, { [p.name]: !prev[p.name] }); }); }}
                          style={{ accentColor: C.acc }} />
                        {p.name}
                        <span style={{ fontSize: 10, color: C.dim, marginLeft: "auto" }}>{p.unit}</span>
                      </label>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", borderTop: "1px solid " + C.border, paddingTop: 12, marginTop: 8 }}>
            <Btn v="ghost" onClick={props.onClose}>{T.catCancel}</Btn>
            <Btn disabled={selCount === 0} onClick={importProducts}><IDown s={12} /> {selCount} {T.catLoadN}</Btn>
          </div>
        </div>
      )}

      {tab === "dishes" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: C.mid }}>{T.catSelected}: <strong style={{ color: C.acc }}>{selDishCount}</strong></span>
          </div>
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {categories.map(function(cat) {
              var items = catDishes.filter(function(d) { return d.category === cat; });
              var allSel = items.every(function(d) { return selDishes[d.name]; });
              return (
                <div key={cat} style={{ marginBottom: 8 }}>
                  <div onClick={function() { toggleAllDishes(cat); }}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", background: C.sur, borderRadius: 6, cursor: "pointer", marginBottom: 3 }}>
                    <input type="checkbox" checked={allSel} readOnly style={{ accentColor: C.acc }} />
                    <ILayers s={12} c={C.orange} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{cat}</span>
                    <span style={{ fontSize: 10, color: C.dim, marginLeft: "auto" }}>{items.length}</span>
                  </div>
                  {items.map(function(d) {
                    return (
                      <label key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 8px 3px 24px", cursor: "pointer", fontSize: 12, color: C.text }}>
                        <input type="checkbox" checked={!!selDishes[d.name]}
                          onChange={function() { setSelDishes(function(prev) { return Object.assign({}, prev, { [d.name]: !prev[d.name] }); }); }}
                          style={{ accentColor: C.acc }} />
                        {d.name}
                        <span style={{ fontSize: 10, color: C.dim, marginLeft: "auto" }}>{d.outputQty} {d.outputUnit}</span>
                      </label>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", borderTop: "1px solid " + C.border, paddingTop: 12, marginTop: 8 }}>
            <Btn v="ghost" onClick={props.onClose}>{T.catCancel}</Btn>
            <Btn disabled={selDishCount === 0} onClick={importDishes}><IDown s={12} /> {selDishCount} {T.catLoadN}</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Excel Import Modal ──────────────────────────────────────────────────────
function ExcelImport(props) {
  var [rawCols, setRawCols] = useState([]);
  var [rawData, setRawData] = useState([]);
  var [mapping, setMapping] = useState({ name: "", unit: "", price: "", folder: "", nomType: "" });
  var [rows, setRows] = useState([]);
  var [step, setStep] = useState(1);
  var [importing, setImporting] = useState(false);
  var [result, setResult] = useState(null);

  function handleFile(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      try {
        var wb = XLSX.read(ev.target.result, { type: "binary" });
        var ws = wb.Sheets[wb.SheetNames[0]];
        var data = XLSX.utils.sheet_to_json(ws, { defval: "" });
        if (!data.length) return;
        var cols = Object.keys(data[0]);
        setRawCols(cols);
        setRawData(data);

        // Auto-detect columns
        var nameWords = ["наименование","name","номенклатура","товар","продукт","nomi","mahsulot","ном","название"];
        var unitWords = ["ед","единица","unit","улчов","birlik","ед.изм","ед. изм"];
        var priceWords = ["цена","price","нарх","narx","стоимость","сумма","себестоимость","тан нарх","таннарх"];
        var folderWords = ["папка","folder","категория","category","группа","guruh","turkum"];
        var typeWords = ["тип","type","turi","вид","номенклатура тип"];

        var auto = { name: "", unit: "", price: "", folder: "", nomType: "" };
        cols.forEach(function(col) {
          var low = col.toLowerCase().trim();
          if (!auto.name && nameWords.some(function(w) { return low.indexOf(w) >= 0; })) auto.name = col;
          if (!auto.unit && unitWords.some(function(w) { return low.indexOf(w) >= 0; })) auto.unit = col;
          if (!auto.price && priceWords.some(function(w) { return low.indexOf(w) >= 0; })) auto.price = col;
          if (!auto.folder && folderWords.some(function(w) { return low.indexOf(w) >= 0; })) auto.folder = col;
          if (!auto.nomType && typeWords.some(function(w) { return low.indexOf(w) >= 0; })) auto.nomType = col;
        });
        // Fallback: first text column = name
        if (!auto.name && cols.length > 0) auto.name = cols[0];
        setMapping(auto);
        setStep(2);
      } catch(err) { console.error(err); }
    };
    reader.readAsBinaryString(file);
  }

  function parseNomType(raw) {
    if (!raw) return "tovar";
    var s = String(raw).toLowerCase().trim();
    if (s === "товар" || s === "tovar" || s === "тв") return "tovar";
    if (s === "заготовка" || s === "zagotovka" || s === "тй") return "zagotovka";
    if (s === "полуфабрикат" || s === "polufabrikat" || s === "ят" || s === "пф") return "polufabrikat";
    if (s === "готовая продукция" || s === "gotovaya" || s === "тм" || s === "готовая") return "gotovaya";
    if (s === "блюдо" || s === "blyudo" || s === "та" || s === "таом") return "blyudo";
    return "tovar";
  }

  function applyMapping() {
    var parsed = rawData.map(function(row) {
      var name = mapping.name ? String(row[mapping.name] || "").trim() : "";
      var unit = mapping.unit ? String(row[mapping.unit] || "").trim() : "кг";
      var price = mapping.price ? (+row[mapping.price] || 0) : 0;
      var folder = mapping.folder ? String(row[mapping.folder] || "").trim() : "";
      var nomType = mapping.nomType ? parseNomType(row[mapping.nomType]) : "tovar";
      return { name: name, unit: unit || "кг", price: price, folder: folder, nomType: nomType };
    }).filter(function(r) { return r.name && r.name.length > 0; });
    setRows(parsed);
    setStep(3);
  }

  function updateRow(idx, key, val) {
    setRows(function(prev) { return prev.map(function(r, i) { if (i !== idx) return r; return Object.assign({}, r, { [key]: val }); }); });
  }

  function removeRow(idx) {
    setRows(function(prev) { return prev.filter(function(_, i) { return i !== idx; }); });
  }

  async function doImport() {
    setImporting(true);
    try {
      var r = await api.importExcel(rows);
      setResult("" + r.imported + " " + T.excelImportedN + (r.skipped > 0 ? ", " + r.skipped + " " + T.excelSkippedExist : ""));
      props.onImported();
    } catch(e) { setResult(T.catError + ": " + e.message); }
    setImporting(false);
  }

  if (result) return (
    <div style={{ textAlign: "center", padding: 30 }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
      <p style={{ fontSize: 15, fontWeight: 700, color: C.green, marginBottom: 16 }}>{result}</p>
      <Btn onClick={props.onClose}>{T.catClose}</Btn>
    </div>
  );

  // Step 1: File selection
  if (step === 1) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ padding: 24, border: "2px dashed " + C.acc + "55", borderRadius: 12, textAlign: "center", background: C.acc + "0a" }}>
        <label style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ width: 50, height: 50, background: C.acc + "22", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IDown s={24} c={C.acc} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{T.excelUploadTitle}</span>
          <span style={{ fontSize: 12, color: C.mid }}>{T.excelUploadHint}</span>
          <span style={{ fontSize: 11, color: C.dim }}>{T.excelUploadFormats}</span>
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{ display: "none" }} />
          <Btn sz="md"><IDown s={14} /> {T.excelChooseFile}</Btn>
        </label>
      </div>
    </div>
  );

  // Step 2: Column mapping
  if (step === 2) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ padding: 10, background: C.sur, borderRadius: 8, border: "1px solid " + C.border }}>
        <span style={{ fontSize: 12, color: C.green, fontWeight: 700 }}>✓ {T.excelFileRead}: {rawData.length} {T.excelRows}, {rawCols.length} {T.excelCols}</span>
      </div>
      <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{T.excelMapCols}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { key: "name", label: T.excelColName, required: true },
          { key: "unit", label: T.excelColUnit },
          { key: "price", label: T.excelColPrice },
          { key: "nomType", label: T.excelColType },
          { key: "folder", label: T.excelColFolder },
        ].map(function(field) {
          return (
            <div key={field.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: C.mid, width: 140, flexShrink: 0 }}>{field.label}</span>
              <select value={mapping[field.key]} onChange={function(e) { setMapping(function(p) { return Object.assign({}, p, { [field.key]: e.target.value }); }); }}
                style={{ flex: 1, background: C.sur, border: "1px solid " + (mapping[field.key] ? C.green : C.border), borderRadius: 6, padding: "7px 10px", color: C.text, fontSize: 12 }}>
                <option value="">{T.excelNoMap}</option>
                {rawCols.map(function(col) { return <option key={col} value={col}>{col}</option>; })}
              </select>
              {mapping[field.key] && <span style={{ color: C.green, fontSize: 11 }}>✓</span>}
            </div>
          );
        })}
      </div>
      {rawData.length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: C.mid, marginBottom: 6 }}>{T.excelPreview}</p>
          <div style={{ border: "1px solid " + C.border, borderRadius: 6, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead><tr style={{ background: C.sur }}>
                <th style={{ padding: "4px 8px", color: C.mid }}>{T.excelThName}</th>
                <th style={{ padding: "4px 8px", color: C.mid }}>{T.excelThType}</th>
                <th style={{ padding: "4px 8px", color: C.mid }}>{T.excelThUnit}</th>
                <th style={{ padding: "4px 8px", color: C.mid }}>{T.excelThPrice}</th>
                <th style={{ padding: "4px 8px", color: C.mid }}>{T.excelThFolder}</th>
              </tr></thead>
              <tbody>
                {rawData.slice(0, 3).map(function(row, i) {
                  return (
                    <tr key={i} style={{ borderTop: "1px solid " + C.border + "33" }}>
                      <td style={{ padding: "4px 8px", color: C.text }}>{mapping.name ? row[mapping.name] : "—"}</td>
                      <td style={{ padding: "4px 8px", color: C.mid }}>{mapping.nomType ? row[mapping.nomType] : "—"}</td>
                      <td style={{ padding: "4px 8px", color: C.mid }}>{mapping.unit ? row[mapping.unit] : "кг"}</td>
                      <td style={{ padding: "4px 8px", color: C.acc }}>{mapping.price ? row[mapping.price] : "0"}</td>
                      <td style={{ padding: "4px 8px", color: C.mid }}>{mapping.folder ? row[mapping.folder] : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", borderTop: "1px solid " + C.border, paddingTop: 12 }}>
        <Btn v="ghost" onClick={function() { setStep(1); }}>{T.excelBack}</Btn>
        <Btn disabled={!mapping.name} onClick={applyMapping}>{T.excelContinue}</Btn>
      </div>
    </div>
  );

  // Step 3: Review & edit before import
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{rows.length} {T.excelReadyItems}</span>
        <Btn v="ghost" sz="xs" onClick={function() { setStep(2); }}>{T.excelChangeCols}</Btn>
      </div>
      <div style={{ fontSize: 11, color: C.mid }}>{T.excelEditHint}</div>
      <div style={{ maxHeight: 380, overflowY: "auto", border: "1px solid " + C.border, borderRadius: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: C.sur, position: "sticky", top: 0 }}>
              <th style={{ padding: "6px 8px", fontSize: 10, fontWeight: 700, color: C.mid, textAlign: "left" }}>{T.excelThNum}</th>
              <th style={{ padding: "6px 8px", fontSize: 10, fontWeight: 700, color: C.mid, textAlign: "left" }}>{T.excelThItemName}</th>
              <th style={{ padding: "6px 8px", fontSize: 10, fontWeight: 700, color: C.mid, width: 90 }}>{T.excelThType}</th>
              <th style={{ padding: "6px 8px", fontSize: 10, fontWeight: 700, color: C.mid, width: 65 }}>{T.excelThUnit}</th>
              <th style={{ padding: "6px 8px", fontSize: 10, fontWeight: 700, color: C.mid, width: 95 }}>{T.excelThPriceCol}</th>
              <th style={{ padding: "6px 8px", fontSize: 10, fontWeight: 700, color: C.mid, width: 100 }}>{T.excelThFolder}</th>
              <th style={{ width: 28 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(function(r, i) {
              return (
                <tr key={i} style={{ borderBottom: "1px solid " + C.border + "33" }}>
                  <td style={{ padding: "4px 8px", fontSize: 10, color: C.dim }}>{i + 1}</td>
                  <td style={{ padding: "4px 8px" }}>
                    <input value={r.name} onChange={function(e) { updateRow(i, "name", e.target.value); }}
                      style={{ width: "100%", background: "transparent", border: "none", color: C.text, fontSize: 12, fontWeight: 600, padding: "2px 0" }} />
                  </td>
                  <td style={{ padding: "4px 6px" }}>
                    <select value={r.nomType} onChange={function(e) { updateRow(i, "nomType", e.target.value); }}
                      style={{ width: "100%", background: C.sur, border: "1px solid " + C.border, borderRadius: 4, padding: "3px 4px", color: C.text, fontSize: 10 }}>
                      <option value="tovar">{T.ntTovar}</option>
                      <option value="zagotovka">{T.ntZagotovka}</option>
                      <option value="polufabrikat">{T.ntPolufabrikat}</option>
                      <option value="gotovaya">{T.ntGotovaya}</option>
                      <option value="blyudo">{T.ntBlyudo}</option>
                    </select>
                  </td>
                  <td style={{ padding: "4px 6px" }}>
                    <select value={r.unit} onChange={function(e) { updateRow(i, "unit", e.target.value); }}
                      style={{ width: "100%", background: C.sur, border: "1px solid " + C.border, borderRadius: 4, padding: "3px 4px", color: C.text, fontSize: 11 }}>
                      {UNITS.map(function(u) { return <option key={u} value={u}>{u}</option>; })}
                    </select>
                  </td>
                  <td style={{ padding: "4px 6px" }}>
                    <input value={r.price} type="number" onChange={function(e) { updateRow(i, "price", e.target.value); }}
                      style={{ width: "100%", background: C.sur, border: "1px solid " + C.border, borderRadius: 4, padding: "4px 6px", color: C.acc, fontSize: 12, fontWeight: 700, fontFamily: "'Inter',sans-serif", textAlign: "right" }} />
                  </td>
                  <td style={{ padding: "4px 6px" }}>
                    <input value={r.folder} onChange={function(e) { updateRow(i, "folder", e.target.value); }}
                      style={{ width: "100%", background: C.sur, border: "1px solid " + C.border, borderRadius: 4, padding: "3px 5px", color: C.text, fontSize: 11 }} />
                  </td>
                  <td style={{ padding: "4px 4px" }}>
                    <button onClick={function() { removeRow(i); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.red, padding: 2 }}><IX s={10} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", borderTop: "1px solid " + C.border, paddingTop: 12 }}>
        <Btn v="ghost" onClick={props.onClose}>{T.catCancel}</Btn>
        <Btn disabled={importing || rows.length === 0} onClick={doImport}>
          {importing ? T.excelImporting : "✓ " + rows.length + " " + T.excelImportBtn}
        </Btn>
      </div>
    </div>
  );
}

// ─── Batch Price Editor ──────────────────────────────────────────────────────
function BatchPriceEditor(props) {
  var [prices, setPrices] = useState({});
  var [packPrices, setPackPrices] = useState({});
  var [saving, setSaving] = useState(false);
  var [result, setResult] = useState(null);
  var [filterFolder, setFilterFolder] = useState("ALL");

  useEffect(function() {
    var init = {}, initPack = {};
    props.products.forEach(function(p) {
      init[p.id] = String(p.price || "");
      initPack[p.id] = String(p.packPrice || "");
    });
    setPrices(init);
    setPackPrices(initPack);
  }, [props.products]);

  function setPrice(id, val) {
    setPrices(function(prev) { return Object.assign({}, prev, { [id]: val }); });
  }
  function setPackPrice(id, val) {
    setPackPrices(function(prev) { return Object.assign({}, prev, { [id]: val }); });
  }

  async function saveAll() {
    var updates = [];
    props.products.forEach(function(p) {
      var newPrice = +prices[p.id] || 0;
      var newPackPrice = +packPrices[p.id] || 0;
      if (newPrice !== (+p.price || 0) || newPackPrice !== (+p.packPrice || 0)) {
        updates.push({ id: p.id, price: newPrice, packPrice: newPackPrice });
      }
    });
    if (!updates.length) { setResult(T.batchNoChanges); return; }
    setSaving(true);
    try {
      var r = await api.batchPrices(updates);
      setResult("" + r.updated + " " + T.batchUpdated);
      props.onSaved();
    } catch(e) { setResult(T.catError + ": " + e.message); }
    setSaving(false);
  }

  var filtered = props.products.filter(function(p) {
    return filterFolder === "ALL" || (filterFolder === "NONE" ? !p.folderId : p.folderId === filterFolder);
  });

  var changed = props.products.filter(function(p) {
    return (+prices[p.id] || 0) !== (+p.price || 0) || (+packPrices[p.id] || 0) !== (+p.packPrice || 0);
  }).length;

  if (result) return (
    <div style={{ textAlign: "center", padding: 30 }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
      <p style={{ fontSize: 15, fontWeight: 700, color: C.green, marginBottom: 16 }}>{result}</p>
      <Btn onClick={props.onClose}>{T.catClose}</Btn>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: C.mid }}>{T.batchFolder}</span>
        <select value={filterFolder} onChange={function(e) { setFilterFolder(e.target.value); }}
          style={{ background: C.sur, border: "1px solid " + C.border, borderRadius: 6, padding: "4px 8px", color: C.text, fontSize: 12 }}>
          <option value="ALL">{T.batchAll} ({props.products.length})</option>
          <option value="NONE">{T.batchNoFolder}</option>
          {props.folders.map(function(f) { return <option key={f.id} value={f.id}>{f.name}</option>; })}
        </select>
        {changed > 0 && <Badge col={C.orange}>{changed} {T.batchChanged}</Badge>}
      </div>
      <div style={{ maxHeight: 400, overflowY: "auto", border: "1px solid " + C.border, borderRadius: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: C.sur, position: "sticky", top: 0 }}>
              <th style={{ padding: "6px 8px", fontSize: 10, fontWeight: 700, color: C.mid, textAlign: "left" }}>{T.batchThName}</th>
              <th style={{ padding: "6px 8px", fontSize: 10, fontWeight: 700, color: C.mid, width: 50 }}>{T.batchThUnit}</th>
              <th style={{ padding: "6px 8px", fontSize: 10, fontWeight: 700, color: C.mid, width: 90 }}>{T.batchThPrice}</th>
              <th style={{ padding: "6px 8px", fontSize: 10, fontWeight: 700, color: C.mid, width: 55 }}>{T.batchThPacking}</th>
              <th style={{ padding: "6px 8px", fontSize: 10, fontWeight: 700, color: C.mid, width: 90 }}>{T.batchThPackPrice}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(function(p) {
              var priceChanged = (+prices[p.id] || 0) !== (+p.price || 0);
              var packChanged = (+packPrices[p.id] || 0) !== (+p.packPrice || 0);
              var isChanged = priceChanged || packChanged;
              return (
                <tr key={p.id} style={{ borderBottom: "1px solid " + C.border + "33", background: isChanged ? C.acc + "11" : "transparent" }}>
                  <td style={{ padding: "5px 8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <NomIcon type={p.nomType} s={11} />
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "5px 8px", textAlign: "center", fontSize: 11, color: C.mid }}>{p.unit}</td>
                  <td style={{ padding: "5px 8px" }}>
                    <input value={prices[p.id] || ""} type="number" placeholder="0"
                      onChange={function(e) { setPrice(p.id, e.target.value); }}
                      style={{ width: "100%", background: C.sur, border: "1px solid " + (priceChanged ? C.acc : C.border), borderRadius: 5,
                        padding: "5px 7px", color: C.acc, fontSize: 13, fontWeight: 700, fontFamily: "'Inter',sans-serif", textAlign: "right" }} />
                  </td>
                  <td style={{ padding: "5px 8px", textAlign: "center", fontSize: 10, color: C.dim }}>{p.packaging ? (p.packaging + (+p.packQty ? " " + p.packQty : "")) : "—"}</td>
                  <td style={{ padding: "5px 8px" }}>
                    <input value={packPrices[p.id] || ""} type="number" placeholder="0"
                      onChange={function(e) { setPackPrice(p.id, e.target.value); }}
                      style={{ width: "100%", background: C.sur, border: "1px solid " + (packChanged ? C.acc : C.border), borderRadius: 5,
                        padding: "5px 7px", color: C.purple, fontSize: 13, fontWeight: 700, fontFamily: "'Inter',sans-serif", textAlign: "right" }} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", borderTop: "1px solid " + C.border, paddingTop: 12 }}>
        <Btn v="ghost" onClick={props.onClose}>{T.catCancel}</Btn>
        <Btn disabled={saving || changed === 0} onClick={saveAll}>
          {saving ? T.batchSaving : T.batchSave + " (" + changed + ")"}
        </Btn>
      </div>
    </div>
  );
}

// ─── Admin Panel ─────────────────────────────────────────────────────────────
function AdminPanel(props) {
  var [orgs, setOrgs] = useState([]);
  var [users, setUsers] = useState([]);
  var [loading, setLoading] = useState(true);
  var [viewOrg, setViewOrg] = useState(null);
  var [orgData, setOrgData] = useState(null);
  var [adminTab, setAdminTab] = useState("orgs");

  useEffect(function() {
    (async function() {
      try {
        var [o, u] = await Promise.all([api.adminGetOrgs(), api.adminGetUsers()]);
        setOrgs(o || []);
        setUsers(u || []);
      } catch(e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  async function viewOrgDetails(id) {
    setViewOrg(id);
    try {
      var data = await api.adminGetOrg(id);
      setOrgData(data);
    } catch(e) { console.error(e); }
  }

  async function toggleRole(tgId, currentRole) {
    var newRole = currentRole === "admin" ? "user" : "admin";
    await api.adminSetRole(tgId, newRole);
    setUsers(function(prev) { return prev.map(function(u) { return u.tgId === tgId ? Object.assign({}, u, { role: newRole }) : u; }); });
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, color: C.mid }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid " + C.border, borderTopColor: C.acc, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
        {T.loading}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1360, margin: "0 auto", padding: "16px 12px" }}>
      {/* Admin stats summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 20 }}>
        {[
          { label: T.adminOrgs, value: orgs.length, color: C.purple, icon: function() { return <IBox s={18} c={C.purple} />; } },
          { label: T.adminUsers, value: users.length, color: C.blue, icon: function() { return <IUser s={18} c={C.blue} />; } },
          { label: T.adminProducts, value: orgs.reduce(function(s, o) { return s + (o.productCount || 0); }, 0), color: C.green, icon: function() { return <IPkg s={18} c={C.green} />; } },
          { label: T.adminCards, value: orgs.reduce(function(s, o) { return s + (o.cardCount || 0); }, 0), color: C.orange, icon: function() { return <ILayers s={18} c={C.orange} />; } },
        ].map(function(st, i) {
          return (
            <div key={i} className={"hover-lift slide-up stagger-" + (i + 1)} style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, animationFillMode: "both" }}>
              <div className="icon-bounce" style={{ width: 42, height: 42, background: st.color + "15", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .3s ease", cursor: "default" }}>
                {st.icon()}
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: st.color }}><AnimNum value={st.value} /></div>
                <div style={{ fontSize: 11, color: C.mid, fontWeight: 600 }}>{st.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin sub-tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, background: C.card, borderRadius: 12, padding: 4, border: "1px solid " + C.border }}>
        {[{ k: "orgs", l: T.adminOrgs, icon: function(c) { return <IBox s={13} c={c} />; } },
          { k: "users", l: T.adminUsers, icon: function(c) { return <IUser s={13} c={c} />; } }].map(function(at) {
          var active = adminTab === at.k;
          return (
            <button key={at.k} onClick={function() { setAdminTab(at.k); }}
              style={{ flex: 1, background: active ? C.acc + "15" : "transparent", border: "none",
                color: active ? C.acc : C.mid, fontWeight: 700, fontSize: 13,
                padding: "10px 16px", borderRadius: 10, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "all .2s ease" }}>
              {at.icon(active ? C.acc : C.mid)}
              {at.l}
            </button>
          );
        })}
      </div>

      {/* Organizations */}
      {adminTab === "orgs" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 12 }}>
          {orgs.map(function(o) {
            return (
              <div key={o.id} className="card-item" style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 14, padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid " + C.border + "44" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, background: C.purple + "15", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <IBox s={16} c={C.purple} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: C.text, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{o.name}</div>
                      <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>ID: {o.id}</div>
                    </div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid " + C.border + "44" }}>
                  {[
                    { n: o.userCount, l: T.adminStaff, c: C.blue },
                    { n: o.productCount, l: T.adminProducts, c: C.green },
                    { n: o.cardCount, l: T.adminCards, c: C.orange },
                  ].map(function(s, i) {
                    return (
                      <div key={i} style={{ padding: "10px 12px", textAlign: "center", borderRight: i < 2 ? "1px solid " + C.border + "44" : "none" }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: s.c }}>{s.n}</div>
                        <div style={{ fontSize: 9, color: C.mid, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.l}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ padding: "10px 18px" }}>
                  <Btn v="ghost" sz="sm" onClick={function() { viewOrgDetails(o.id); }}
                    sx={{ width: "100%", justifyContent: "center", borderRadius: 10 }}>
                    <ISearch s={11} /> {T.adminDetails}
                  </Btn>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Users */}
      {adminTab === "users" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {users.map(function(u) {
            return (
              <div key={u.id} className="card-item" style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, background: u.role === "admin" ? C.red + "15" : C.blue + "15", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <IUser s={16} c={u.role === "admin" ? C.red : C.blue} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{u.name || "—"}</span>
                    <Badge col={u.role === "admin" ? C.red : C.blue}>{u.role === "admin" ? T.adminRoleAdmin : T.adminRoleUser}</Badge>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
                    {u.orgName && <span style={{ fontSize: 11, color: C.mid, display: "flex", alignItems: "center", gap: 3 }}><IBox s={10} c={C.dim} /> {u.orgName}</span>}
                    {u.position && <span style={{ fontSize: 11, color: C.mid }}>{u.position}</span>}
                    {u.city && <span style={{ fontSize: 11, color: C.dim }}>{u.city}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {u.orgId && <Btn v="ghost" sz="xs" onClick={function() { viewOrgDetails(u.orgId); }} sx={{ borderRadius: 8 }}><IBox s={11} /></Btn>}
                  <Btn v={u.role === "admin" ? "danger" : "info"} sz="xs"
                    onClick={function() { toggleRole(u.tgId, u.role); }} sx={{ borderRadius: 8 }}>
                    {u.role === "admin" ? T.adminDemote : T.adminPromote}
                  </Btn>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewOrg && orgData && (
        <Modal title={T.adminOrgInfo} width={780} onClose={function() { setViewOrg(null); setOrgData(null); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[
                { n: orgData.users ? orgData.users.length : 0, l: T.adminOrgStaff, c: C.blue, icon: function() { return <IUser s={14} c={C.blue} />; } },
                { n: orgData.products ? orgData.products.length : 0, l: T.adminOrgProducts, c: C.green, icon: function() { return <IBox s={14} c={C.green} />; } },
                { n: orgData.cards ? orgData.cards.length : 0, l: T.adminOrgCards, c: C.orange, icon: function() { return <ILayers s={14} c={C.orange} />; } },
              ].map(function(s, i) {
                return (
                  <div key={i} style={{ background: s.c + "10", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                    <div style={{ marginBottom: 4 }}>{s.icon()}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: s.c }}>{s.n}</div>
                    <div style={{ fontSize: 10, color: C.mid, fontWeight: 600 }}>{s.l}</div>
                  </div>
                );
              })}
            </div>

            {/* Users */}
            {orgData.users && orgData.users.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.mid, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>{T.adminOrgStaff}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {orgData.users.map(function(u, i) {
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: C.bg, borderRadius: 10 }}>
                        <div style={{ width: 28, height: 28, background: C.blue + "15", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <IUser s={12} c={C.blue} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{u.name}</span>
                        {u.position && <Badge col={C.dim} sz={9}>{u.position}</Badge>}
                        {u.city && <span style={{ fontSize: 10, color: C.dim }}>{u.city}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Products */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.mid, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>{T.adminOrgProducts}</div>
              {orgData.products && orgData.products.length > 0 ? (
                <div style={{ maxHeight: 280, overflowY: "auto", border: "1px solid " + C.border, borderRadius: 10 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: C.bg, position: "sticky", top: 0 }}>
                        {[T.nomThName, T.nomThUnit, T.nomThPrice, T.nomThPack].map(function(h, i) {
                          return <th key={i} style={{ padding: "8px 10px", fontSize: 10, fontWeight: 700, color: C.mid, textAlign: "left", textTransform: "uppercase" }}>{h}</th>;
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {orgData.products.map(function(p) {
                        return (
                          <tr key={p.id} style={{ borderBottom: "1px solid " + C.border + "22" }}>
                            <td style={{ padding: "7px 10px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <NomIcon type={p.nomType} s={11} />
                                <span style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</span>
                              </div>
                            </td>
                            <td style={{ padding: "7px 10px", fontSize: 11, color: C.mid }}>{p.unit}</td>
                            <td style={{ padding: "7px 10px" }}><span style={{ fontSize: 12, color: C.acc, fontWeight: 700 }}>{fmt(p.price)}</span></td>
                            <td style={{ padding: "7px 10px", fontSize: 10, color: C.dim }}>{p.packaging || "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : <p style={{ fontSize: 12, color: C.dim, padding: "8px 0" }}>{T.noItems}</p>}
            </div>

            {/* Cards */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.mid, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>{T.adminOrgCards}</div>
              {orgData.cards && orgData.cards.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {orgData.cards.map(function(c) {
                    return (
                      <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: C.bg, borderRadius: 10 }}>
                        <div style={{ width: 28, height: 28, background: C.orange + "15", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <ILayers s={12} c={C.orange} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{c.name}</span>
                        {c.outputQty && <Badge col={C.blue} sz={9}>{c.outputQty} {c.outputUnit}</Badge>}
                        <Badge col={C.purple} sz={9}>{c.stepsCount} {T.stepNameDefault}</Badge>
                      </div>
                    );
                  })}
                </div>
              ) : <p style={{ fontSize: 12, color: C.dim, padding: "8px 0" }}>{T.noCards}</p>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Folder Tree ──────────────────────────────────────────────────────────────
function FolderNode(props) {
  var folder = props.folder, folders = props.folders, products = props.products;
  var [open, setOpen] = useState(true);
  var children = folders.filter(function(f) { return f.parentId === folder.id; });
  var count = products.filter(function(p) { return getFolderChildren(folder.id, folders).indexOf(p.folderId) >= 0; }).length;
  var sel = props.selected === folder.id;
  var col = sel ? C.acc : C.mid;
  return (
    <div>
      <div onClick={function() { props.onSelect(folder.id); }}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px 5px " + (8 + (props.depth || 0) * 14) + "px",
          borderRadius: 6, cursor: "pointer", background: sel ? C.acc + "18" : "transparent",
          color: col, marginBottom: 1, transition: "all .15s" }}>
        {children.length > 0
          ? <button onClick={function(e) { e.stopPropagation(); setOpen(function(o) { return !o; }); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, display: "flex" }}>
              {open ? <IChU s={10} /> : <IChD s={10} />}
            </button>
          : <div style={{ width: 10 }} />}
        <IFolder s={12} c={col} />
        <span style={{ fontSize: 12, fontWeight: sel ? 700 : 400, flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{folder.name}</span>
        <span style={{ fontSize: 9, color: C.dim, fontFamily: "'Inter',sans-serif" }}>{count}</span>
        <button onClick={function(e) { e.stopPropagation(); props.onDel(folder.id); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: C.red, padding: 1, opacity: 0.5, display: "flex" }}>
          <IX s={9} />
        </button>
      </div>
      {open && children.map(function(c) {
        return <FolderNode key={c.id} folder={c} folders={folders} products={products}
          selected={props.selected} onSelect={props.onSelect} onDel={props.onDel} depth={(props.depth || 0) + 1} />;
      })}
    </div>
  );
}

// ─── Image Upload ────────────────────────────────────────────────────────────
function ImageUpload(props) {
  var [uploading, setUploading] = useState(false);

  function handleFile(e) {
    var file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    var reader = new FileReader();
    reader.onload = async function() {
      try {
        var result = await api.uploadImage(reader.result, file.name);
        props.onChange(result.url);
      } catch(err) { console.error(err); }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: C.mid, textTransform: "uppercase", letterSpacing: 0.7 }}>{T.nomImage}</label>
      {props.value && (
        <div style={{ position: "relative", width: 100, height: 100, borderRadius: 8, overflow: "hidden", border: "1px solid " + C.border }}>
          <img src={props.value} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <button onClick={function() { props.onChange(""); }}
            style={{ position: "absolute", top: 4, right: 4, background: C.red, color: "#fff", border: "none", borderRadius: 4, width: 20, height: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IX s={10} />
          </button>
        </div>
      )}
      <label style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px",
        background: C.sur, border: "1px solid " + C.border, borderRadius: 7, cursor: "pointer", fontSize: 12, color: C.mid }}>
        <ICam s={14} /> {uploading ? T.loading : T.nomImageUpload}
        <input type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
      </label>
    </div>
  );
}

// ─── Nomenclature Form ────────────────────────────────────────────────────────
function NomForm(props) {
  var blank = { name: "", nomType: "tovar", unit: "кг", price: "", packaging: "", packQty: "", packPrice: "", folderId: "", grossWeight: "", netWeight: "", linkedCardId: "", description: "", image: "", fats: "", proteins: "", carbs: "", calories: "" };
  var init = props.init ? Object.assign({}, blank, props.init) : blank;
  var [f, setF] = useState(init);
  function set(k) { return function(v) { setF(function(p) { return Object.assign({}, p, { [k]: v }); }); }; }
  var isComplex = COMPLEX.indexOf(f.nomType) >= 0;
  var g = +f.grossWeight || 0, n = +f.netWeight || 0;
  var yp = g > 0 && n > 0 ? (n / g * 100) : 0;
  var nt = getNT(); var cfg = nt[f.nomType] || nt.tovar;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 10, fontWeight: 700, color: C.mid, textTransform: "uppercase", letterSpacing: 0.7 }}>{T.nomTypeLabel}</label>
        <div className="nom-type-btns" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {NT_KEYS.map(function(k) {
            var kc = getNT()[k];
            var sel = f.nomType === k;
            return (
              <button key={k} onClick={function() { set("nomType")(k); }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 11px", borderRadius: 7,
                  border: "1.5px solid " + (sel ? kc.color : C.border), background: sel ? kc.color + "22" : "transparent", cursor: "pointer" }}>
                <NomIcon type={k} s={13} />
                <span style={{ fontSize: 12, fontWeight: 700, color: sel ? kc.color : C.mid }}>{kc.label}</span>
                {k === "blyudo" && <span style={{ fontSize: 9, color: C.mid, background: C.sur, padding: "1px 5px", borderRadius: 3 }}>{T.nomFinal}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="form-2col" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
        <Inp label={T.nomName} value={f.name} onChange={set("name")} placeholder={T.nomNamePh} />
        <Sel label={T.nomUnit} value={f.unit} onChange={set("unit")} options={UNITS} />
      </div>
      <div className="form-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Inp label={T.nomPrice} value={f.price} onChange={set("price")} type="number" placeholder="0.00" hint={"1 " + f.unit + " " + T.nomPriceHint} />
        <Sel label={T.nomFolder} value={f.folderId} onChange={set("folderId")}
          options={[{ v: "", l: T.nomNoFolder }].concat(props.folders.map(function(fl) {
            var dots = "";
            for (var i = 0; i < getFolderDepth(fl.id, props.folders); i++) dots += "  ";
            return { v: fl.id, l: dots + fl.name };
          }))} />
      </div>
      <div style={{ background: C.bg, borderRadius: 8, padding: 12, border: "1px solid " + C.border }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <IPkg s={13} c={C.blue} />
          <span style={{ fontSize: 12, fontWeight: 700, color: C.blue }}>{T.nomPacking}</span>
        </div>
        <div className="form-3col" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 }}>
          <Inp label={T.nomPackName} value={f.packaging} onChange={set("packaging")} placeholder={T.nomPackNamePh} />
          <Inp label={T.nomPackQty} value={f.packQty} onChange={set("packQty")} type="number" placeholder="0" hint={f.packaging && f.unit ? f.packaging + " (" + f.unit + ")" : ""} />
          <Inp label={T.nomPackPrice} value={f.packPrice} onChange={set("packPrice")} type="number" placeholder="0.00" hint={f.packaging && +f.packQty ? f.packaging + " " + f.packQty + " " + f.unit : ""} />
        </div>
      </div>
      <Inp label={T.nomDesc} value={f.description} onChange={set("description")} placeholder={T.nomDescPh} />
      <ImageUpload value={f.image} onChange={set("image")} />

      <div style={{ background: C.bg, borderRadius: 8, padding: 12, border: "1px solid " + C.green + "33" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <IScale s={13} c={C.green} />
          <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>{T.nomNutrition}</span>
        </div>
        <div className="form-4col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
          <Inp label={T.nomProteins} value={f.proteins} onChange={set("proteins")} type="number" placeholder="0" />
          <Inp label={T.nomFats} value={f.fats} onChange={set("fats")} type="number" placeholder="0" />
          <Inp label={T.nomCarbs} value={f.carbs} onChange={set("carbs")} type="number" placeholder="0" />
          <Inp label={T.nomCalories} value={f.calories} onChange={set("calories")} type="number" placeholder="0" />
        </div>
      </div>

      {isComplex && (
        <div style={{ background: C.bg, borderRadius: 8, padding: 13, border: "1px solid " + cfg.color + "33", display: "flex", flexDirection: "column", gap: 11 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <NomIcon type={f.nomType} s={14} />
            <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{T.nomParams}: {cfg.label}</span>
          </div>
          <div className="form-3col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <Inp label={T.nomGross} value={f.grossWeight} onChange={set("grossWeight")} type="number" placeholder={T.nomGrossPh} hint={T.nomGrossHint} />
            <Inp label={T.nomNet} value={f.netWeight} onChange={set("netWeight")} type="number" placeholder={T.nomNetPh} hint={T.nomNetHint} />
            <Inp label={T.nomYield} value={yp > 0 ? yp.toFixed(1) : ""} readOnly placeholder={T.nomYieldAuto}
              hint={yp > 0 ? T.nomLoss + ": " + fmt(g - n) + " " + f.unit : T.nomFillGross}
              sx={{ color: C.green }} />
          </div>
          <Sel label={T.nomLinkedCard} value={f.linkedCardId || ""} onChange={set("linkedCardId")}
            options={[{ v: "", l: T.nomNoLinked }].concat(
              props.cards.filter(function(c) { return c.id !== f.id; }).map(function(c) {
                return { v: c.id, l: c.name + " (" + T.nomLinkedOut + ": " + c.outputQty + " " + c.outputUnit + ")" };
              })
            )} />
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", borderTop: "1px solid " + C.border, paddingTop: 12 }}>
        <Btn v="ghost" onClick={props.onClose}>{T.nomCancel}</Btn>
        <Btn onClick={function() {
          if (!f.name.trim()) return;
          props.onSave(Object.assign({}, f, { id: f.id || uid() }));
          props.onClose();
        }}><ICheck /> {T.nomSave}</Btn>
      </div>
    </div>
  );
}

// ─── Folder Form ──────────────────────────────────────────────────────────────
function FolderForm(props) {
  var [name, setName] = useState("");
  var [par, setPar] = useState("");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Inp label={T.folderFormName} value={name} onChange={setName} placeholder={T.folderFormNamePh} />
      <Sel label={T.folderFormParent} value={par} onChange={setPar}
        options={[{ v: "", l: T.folderFormRoot }].concat(props.folders.map(function(f) { return { v: f.id, l: f.name }; }))} />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn v="ghost" onClick={props.onClose}>{T.folderFormCancel}</Btn>
        <Btn onClick={function() {
          if (!name.trim()) return;
          props.onSave({ id: uid(), name: name.trim(), parentId: par || null });
          props.onClose();
        }}><ICheck /> {T.folderFormCreate}</Btn>
      </div>
    </div>
  );
}

// ─── Ingredient Row ───────────────────────────────────────────────────────────
function IngRow(props) {
  var ing = props.ing, products = props.products, cards = props.cards;
  var forbidden = useMemo(function() {
    var f = [props.currentCardId];
    cards.forEach(function(c) { if (getDeps(c.id, cards, []).indexOf(props.currentCardId) >= 0) f.push(c.id); });
    return f;
  }, [cards, props.currentCardId]);

  var avProds = products.filter(function(p) { return p.nomType !== "blyudo"; });
  var avCards = cards.filter(function(c) { return forbidden.indexOf(c.id) < 0; });
  var isP = ing.type === "product";

  var ref = isP
    ? products.find(function(p) { return p.id === ing.refId; })
    : cards.find(function(c) { return c.id === ing.refId; });

  var hint = "—";
  if (ref && ing.qty) {
    if (isP) hint = fmt(+ref.price * +ing.qty) + " " + T.currency;
    else hint = fmt(costPerUnit(ref.id, cards, products, []) * (+ing.qty)) + " " + T.currency;
  }

  var pNT = isP && ref ? ref.nomType : null;
  var pCol = pNT ? ntColor(pNT) : C.border;

  return (
    <div className="ing-row" style={{ display: "grid", gridTemplateColumns: "auto 1fr 85px 78px auto", gap: 6, alignItems: "end", marginBottom: 7 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: 9, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 0.6 }}>{T.ingType}</label>
        <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", border: "1px solid " + C.border }}>
          <button onClick={function() { props.onChange(Object.assign({}, ing, { type: "product", refId: "" })); }}
            style={{ padding: "6px 8px", background: isP ? C.blue + "22" : "transparent", color: isP ? C.blue : C.dim, border: "none", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>
            {T.ingProduct}
          </button>
          <button onClick={function() { props.onChange(Object.assign({}, ing, { type: "semifinished", refId: "" })); }}
            style={{ padding: "6px 8px", background: !isP ? C.orange + "22" : "transparent", color: !isP ? C.orange : C.dim, border: "none", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>
            {T.ingCard}
          </button>
        </div>
      </div>

      {isP ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <select value={ing.refId} onChange={function(e) { props.onChange(Object.assign({}, ing, { refId: e.target.value })); }}
            style={{ background: C.sur, border: "1px solid " + pCol + "55", borderRadius: 6, padding: "8px 10px", color: C.text, fontSize: 12 }}>
            <option value="">{T.ingSelectNom}</option>
            {NT_KEYS.filter(function(t) { return t !== "blyudo"; }).map(function(t) {
              var ps = avProds.filter(function(p) { return p.nomType === t; });
              if (!ps.length) return null;
              return (
                <optgroup key={t} label={ntLabel(t)}>
                  {ps.map(function(p) { return <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>; })}
                </optgroup>
              );
            })}
          </select>
          {pNT && ref && (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <NomIcon type={pNT} s={10} />
              <span style={{ fontSize: 10, color: pCol, fontWeight: 700 }}>{ntLabel(pNT)}</span>
              {ref.packaging && <span style={{ fontSize: 10, color: C.dim }}>· {ref.packaging}{+ref.packQty ? " " + ref.packQty + " " + ref.unit : ""}</span>}
            </div>
          )}
        </div>
      ) : (
        <Sel value={ing.refId} onChange={function(v) { props.onChange(Object.assign({}, ing, { refId: v })); }}
          options={[{ v: "", l: T.ingSelectCard }].concat(
            avCards.map(function(c) { return { v: c.id, l: c.name + " → " + (c.outputQty || "?") + " " + c.outputUnit }; })
          )} />
      )}

      <Inp value={ing.qty} onChange={function(v) { props.onChange(Object.assign({}, ing, { qty: v })); }} type="number" placeholder={T.ingQtyPh} />
      <div style={{ padding: "8px 9px", background: C.sur, border: "1px solid " + C.border, borderRadius: 6,
        fontSize: 11, color: hint !== "—" ? (isP ? C.green : C.orange) : C.dim,
        fontFamily: "'Inter',sans-serif", textAlign: "center" }}>
        {hint}
      </div>
      <Btn v="danger" sz="sm" onClick={props.onRemove}><IX s={11} /></Btn>
    </div>
  );
}

// ─── Step Editor ──────────────────────────────────────────────────────────────
function StepEditor(props) {
  var step = props.step;
  var [open, setOpen] = useState(true);
  function set(k) { return function(v) { props.onChange(Object.assign({}, step, { [k]: v })); }; }
  function setP(k) { return function(v) { props.onChange(Object.assign({}, step, { params: Object.assign({}, step.params, { [k]: v }) })); }; }
  function addIng(type) {
    props.onChange(Object.assign({}, step, { ingredients: step.ingredients.concat([{ id: uid(), type: type, refId: "", qty: "" }]) }));
  }
  function updIng(id, val) {
    props.onChange(Object.assign({}, step, { ingredients: step.ingredients.map(function(i) { return i.id === id ? val : i; }) }));
  }
  function remIng(id) {
    props.onChange(Object.assign({}, step, { ingredients: step.ingredients.filter(function(i) { return i.id !== id; }) }));
  }

  var stepCost = step.ingredients.reduce(function(acc, i) {
    if (i.type === "product") {
      var p = props.products.find(function(p) { return p.id === i.refId; });
      return acc + (p && i.qty ? +p.price * +i.qty : 0);
    }
    return acc + costPerUnit(i.refId, props.cards, props.products, []) * (+i.qty || 0);
  }, 0);

  var hasSemi = step.ingredients.some(function(i) { return i.type === "semifinished"; });
  var proc = step.process && step.process !== "—" ? step.process : null;

  return (
    <div style={{ border: "1px solid " + (open ? C.acc + "44" : C.border), borderRadius: 9, overflow: "hidden", marginBottom: 9, transition: "border-color .2s" }}>
      <div onClick={function() { setOpen(function(o) { return !o; }); }}
        style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 13px", cursor: "pointer", background: open ? C.acc + "18" : "transparent" }}>
        <div style={{ background: C.acc, color: "#000", borderRadius: 5, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
          {props.idx + 1}
        </div>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 13 }}>{step.name || (T.stepNameDefault + " " + (props.idx + 1))}</span>
        <div className="step-header-badges" style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {proc && <Badge col={C.purple}>{proc}</Badge>}
          {hasSemi && <Badge col={C.orange}><ILayers s={9} /> {T.expSemiTag}</Badge>}
          {step.params.temp && <Badge col={C.blue}>{step.params.temp}°C</Badge>}
          {step.params.time && <Badge col={C.teal}>{step.params.time}мин</Badge>}
          {stepCost > 0 && <Badge col={C.green}>{fmt(stepCost)} {T.currency}</Badge>}
          <Btn v="danger" sz="xs" onClick={function(e) { e.stopPropagation(); props.onRemove(); }}><ITrash s={11} /></Btn>
          {open ? <IChU /> : <IChD />}
        </div>
      </div>
      {open && (
        <div style={{ padding: 13, borderTop: "1px solid " + C.border + "33", display: "flex", flexDirection: "column", gap: 11 }} className="fi">
          <div className="form-2col" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
            <Inp label={T.stepName} value={step.name} onChange={set("name")} placeholder={T.stepNameDefault + " " + (props.idx + 1)} />
            <Sel label={T.stepProcess} value={step.process} onChange={set("process")} options={["—"].concat(getPROCESSES())} />
          </div>
          <div className="form-4col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 2fr", gap: 10 }}>
            <Inp label={T.stepTemp} value={step.params.temp} onChange={setP("temp")} type="number" placeholder="—" />
            <Inp label={T.stepTime} value={step.params.time} onChange={setP("time")} type="number" placeholder="—" />
            <Inp label={T.stepPressure} value={step.params.pressure} onChange={setP("pressure")} type="number" placeholder="—" />
            <Inp label={T.stepNote} value={step.params.note} onChange={setP("note")} placeholder={T.stepNotePh} />
          </div>
          <div style={{ background: C.bg, borderRadius: 8, padding: 11, border: "1px solid " + C.border + "33" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.mid, textTransform: "uppercase", letterSpacing: 0.7 }}>{T.stepComposition}</span>
              <div style={{ display: "flex", gap: 5 }}>
                <Btn v="info" sz="xs" onClick={function() { addIng("product"); }}><IBox s={10} /> {T.ingProduct}</Btn>
                <Btn v="warn" sz="xs" onClick={function() { addIng("semifinished"); }}><ILayers s={10} /> {T.ingCard}</Btn>
              </div>
            </div>
            {step.ingredients.length === 0 && <p style={{ textAlign: "center", color: C.dim, fontSize: 12, padding: "8px 0" }}>{T.stepNoIngs}</p>}
            {step.ingredients.map(function(ing) {
              return <IngRow key={ing.id} ing={ing} products={props.products} cards={props.cards}
                currentCardId={props.currentCardId}
                onChange={function(v) { updIng(ing.id, v); }}
                onRemove={function() { remIng(ing.id); }} />;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tech Card Form ───────────────────────────────────────────────────────────
function CardForm(props) {
  function newStep() { return { id: uid(), name: "", process: "", params: { temp: "", time: "", pressure: "", note: "" }, ingredients: [] }; }
  var initCard = props.init || { name: "", description: "", outputQty: "", outputUnit: "порц", grossWeight: "", netWeight: "", steps: [] };
  var [f, setF] = useState(initCard);
  function s(k) { return function(v) { setF(function(p) { return Object.assign({}, p, { [k]: v }); }); }; }
  function addStep() { setF(function(p) { return Object.assign({}, p, { steps: p.steps.concat([newStep()]) }); }); }
  function updStep(id, val) { setF(function(p) { return Object.assign({}, p, { steps: p.steps.map(function(x) { return x.id === id ? val : x; }) }); }); }
  function remStep(id) { setF(function(p) { return Object.assign({}, p, { steps: p.steps.filter(function(x) { return x.id !== id; }) }); }); }

  var tc = totalCost(f, props.cards, props.products);
  var g = +f.grossWeight || 0, n = +f.netWeight || 0;
  var yp = g > 0 && n > 0 ? (n / g * 100) : 0;
  var otherCards = props.cards.filter(function(c) { return c.id !== f.id; });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="form-3col" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 }}>
        <Inp label={T.cardName} value={f.name} onChange={s("name")} placeholder={T.cardNamePh} />
        <Inp label={T.cardOutputQty} value={f.outputQty} onChange={s("outputQty")} type="number" placeholder="10" />
        <Sel label={T.cardOutputUnit} value={f.outputUnit} onChange={s("outputUnit")} options={UNITS} />
      </div>
      <Inp label={T.cardDesc} value={f.description} onChange={s("description")} placeholder={T.cardDescPh} />

      <div style={{ background: C.bg, borderRadius: 8, padding: 12, border: "1px solid " + C.teal + "33" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
          <IScale s={13} c={C.teal} />
          <span style={{ fontSize: 12, fontWeight: 700, color: C.teal }}>{T.cardNorms}</span>
        </div>
        <div className="form-3col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <Inp label={T.cardGross} value={f.grossWeight} onChange={s("grossWeight")} type="number" placeholder={T.cardGrossPh} hint={T.cardGrossHint} />
          <Inp label={T.cardNet} value={f.netWeight} onChange={s("netWeight")} type="number" placeholder={T.cardNetPh} hint={T.cardNetHint} />
          <Inp label={T.cardYield} value={yp > 0 ? yp.toFixed(1) : ""} readOnly placeholder={T.cardYieldAuto}
            hint={yp > 0 ? T.cardLoss + ": " + fmt(g - n) + " " + f.outputUnit : T.cardFillGross}
            sx={{ color: C.green }} />
        </div>
      </div>

      {tc > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 13px", background: C.green + "18", border: "1px solid " + C.green + "33", borderRadius: 8 }}>
          <ICheck s={14} c={C.green} />
          <span style={{ fontSize: 13, color: C.green, fontWeight: 700 }}>{T.cardCostLabel}: <span className="mono">{fmt(tc)} {T.currency}</span></span>
          {f.outputQty && <span style={{ fontSize: 12, color: C.green, opacity: 0.7 }}>→ {fmt(tc / (+f.outputQty || 1))} {T.currency} / {f.outputUnit}</span>}
        </div>
      )}

      <div style={{ borderTop: "1px solid " + C.border, paddingTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <h4 style={{ fontWeight: 800, fontSize: 14 }}>{T.cardStepsTitle}</h4>
          <Btn sz="sm" onClick={addStep}><IPlus /> {T.cardAddStep}</Btn>
        </div>
        {f.steps.length === 0 && (
          <div style={{ textAlign: "center", padding: "20px 0", color: C.dim, border: "1px dashed " + C.border, borderRadius: 8 }}>
            <p style={{ marginBottom: 8, fontSize: 13 }}>{T.cardNoSteps}</p>
            <Btn sz="sm" onClick={addStep}><IPlus /> {T.cardAdd}</Btn>
          </div>
        )}
        {f.steps.map(function(step, i) {
          return <StepEditor key={step.id} step={step} products={props.products} cards={otherCards}
            currentCardId={f.id || "__new__"} idx={i}
            onChange={function(v) { updStep(step.id, v); }}
            onRemove={function() { remStep(step.id); }} />;
        })}
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", borderTop: "1px solid " + C.border, paddingTop: 12 }}>
        <Btn v="ghost" onClick={props.onClose}>{T.cardCancel}</Btn>
        <Btn onClick={function() {
          if (!f.name.trim()) return;
          props.onSave(Object.assign({}, f, { id: f.id || uid(), createdAt: f.createdAt || new Date().toISOString() }));
          props.onClose();
        }}><ICheck /> {T.cardSave}</Btn>
      </div>
    </div>
  );
}

// ─── Ingredient Tree (detail view) ───────────────────────────────────────────
function IngTree(props) {
  var [open, setOpen] = useState(props.depth < 2);
  var card = props.allCards.find(function(c) { return c.id === props.cardId; });
  if (!card) return null;
  var ings = [];
  card.steps.forEach(function(s) {
    s.ingredients.forEach(function(i) {
      if (i.type === "product") {
        var p = props.allProducts.find(function(p) { return p.id === i.refId; });
        if (p) ings.push({ kind: "p", name: p.name, qty: i.qty, unit: p.unit, cost: +p.price * +i.qty, nomType: p.nomType, step: s.name });
      } else {
        var c = props.allCards.find(function(c) { return c.id === i.refId; });
        if (c) ings.push({ kind: "s", name: c.name, qty: i.qty, unit: c.outputUnit, cardId: c.id, step: s.name });
      }
    });
  });
  var ind = (props.depth || 0) * 15;
  return (
    <div>
      {ings.map(function(ing, idx) {
        return (
          <div key={idx}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 0 5px " + ind + "px", borderBottom: "1px solid " + C.border + "22" }}>
              {ing.kind === "s" ? (
                <>
                  <button onClick={function() { setOpen(function(o) { return !o; }); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.orange, padding: 0 }}>
                    {open ? <IChU s={11} /> : <IChD s={11} />}
                  </button>
                  <ILayers s={11} c={C.orange} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.orange, flex: 1 }}>{ing.name}</span>
                  <span style={{ fontSize: 9, color: C.dim }}>{ing.step}</span>
                  <span className="mono" style={{ fontSize: 11, color: C.mid }}>{ing.qty} {ing.unit}</span>
                </>
              ) : (
                <>
                  <div style={{ width: 13 }} />
                  <NomIcon type={ing.nomType} s={11} />
                  <span style={{ fontSize: 12, color: C.text, flex: 1 }}>{ing.name}</span>
                  <span style={{ fontSize: 9, color: C.dim }}>{ing.step}</span>
                  <span className="mono" style={{ fontSize: 11, color: C.mid }}>{ing.qty} {ing.unit}</span>
                  {ing.cost > 0 && <span className="mono" style={{ fontSize: 11, color: C.green }}>{fmt(ing.cost)} {T.currency}</span>}
                </>
              )}
            </div>
            {ing.kind === "s" && open && (
              <IngTree cardId={ing.cardId} allCards={props.allCards} allProducts={props.allProducts} depth={(props.depth || 0) + 1} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Excel Export ─────────────────────────────────────────────────────────────
function buildBOM(cardId, allCards, allProds, qty, depth, rows, visited) {
  if (!qty) qty = 1; if (!depth) depth = 0; if (!rows) rows = []; if (!visited) visited = [];
  if (visited.indexOf(cardId) >= 0) return rows;
  var card = allCards.find(function(c) { return c.id === cardId; });
  if (!card) return rows;
  var nxt = visited.concat([cardId]);
  card.steps.forEach(function(s, si) {
    s.ingredients.forEach(function(i) {
      if (i.type === "product") {
        var p = allProds.find(function(p) { return p.id === i.refId; });
        if (p) rows.push({ depth: depth, step: s.name || (T.expStepDefault + " " + (si + 1)), process: s.process || "—",
          name: p.name, nomType: ntLabel(p.nomType), unit: p.unit,
          qty: +i.qty * qty, price: +p.price, cost: +p.price * +i.qty * qty });
      } else {
        var c = allCards.find(function(c) { return c.id === i.refId; });
        if (c) {
          var pu = costPerUnit(c.id, allCards, allProds, []);
          rows.push({ depth: depth, step: s.name || (T.expStepDefault + " " + (si + 1)), process: s.process || "—",
            name: c.name, nomType: T.expSemiLabel, unit: c.outputUnit,
            qty: +i.qty * qty, price: pu, cost: pu * +i.qty * qty });
          buildBOM(c.id, allCards, allProds, +i.qty * qty, depth + 1, rows, nxt);
        }
      }
    });
  });
  return rows;
}

function exportExcel(card, allCards, allProds) {
  var wb = XLSX.utils.book_new();
  var tc = totalCost(card, allCards, allProds);
  var perU = tc / (+card.outputQty || 1);
  var g = +card.grossWeight || 0, n = +card.netWeight || 0;
  var yp = g > 0 && n > 0 ? (n / g * 100).toFixed(1) + "%" : "—";

  var nut = calcNutrition(card, allCards, allProds);
  var outQ = +card.outputQty || 1;
  var sum = [
    [T.expTechCard], [],
    [T.expName, card.name], [T.expDesc, card.description || "—"],
    [T.expOutput, card.outputQty + " " + card.outputUnit],
    [T.expGross, g || "—"], [T.expNet, n || "—"], [T.expYieldPct, yp],
    [T.expCost, fmt(tc) + " " + T.currency], [T.expCostPerUnit, fmt(perU) + " " + T.currency],
    [],
    [T.expNutrPer + " (" + card.outputUnit + "):"],
    [T.expProteins, fmt(nut.proteins / outQ) + " г"],
    [T.expFats, fmt(nut.fats / outQ) + " г"],
    [T.expCarbs, fmt(nut.carbs / outQ) + " г"],
    [T.expCalories, fmt(nut.calories / outQ) + " ккал"],
    [],
    [T.expDate, new Date(card.createdAt).toLocaleDateString("ru")], [],
    [T.expBOM], [],
    [T.expIngredient, T.expNomType, T.excelThUnit, T.expQty, T.expPricePerUnit, T.expSum, T.expLevel, T.expStepName, T.expStepProcess]
  ];
  var bom = buildBOM(card.id, allCards, allProds);
  bom.forEach(function(r) {
    var indent = "";
    for (var i = 0; i < r.depth; i++) indent += "  ";
    sum.push([indent + r.name, r.nomType, r.unit, r.qty, fmt(r.price), fmt(r.cost),
      r.depth === 0 ? T.expMain : T.expLevelN + " " + r.depth, r.step || "", r.process || ""]);
  });
  sum.push([], [, T.expTotal, , , , fmt(tc) + " " + T.currency]);
  var ws1 = XLSX.utils.aoa_to_sheet(sum);
  ws1["!cols"] = [{ wch: 34 }, { wch: 20 }, { wch: 8 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws1, T.expCardSheet);

  var steps = [[T.expStepsSheet + " " + card.name], [],
    [T.expStepNum, T.expStepName, T.expStepProcess, T.expStepTemp, T.expStepMin, T.expStepPressure, T.expStepNote, T.expStepIng, T.expStepNomType, T.excelThUnit, T.expQty, T.expStepCost]];
  card.steps.forEach(function(s, si) {
    var rows = s.ingredients.length === 0 ? [["—", "—", "—", "—", "—"]] :
      s.ingredients.map(function(i) {
        if (i.type === "product") {
          var p = allProds.find(function(p) { return p.id === i.refId; });
          return p ? [p.name, ntLabel(p.nomType), p.unit, i.qty, i.qty ? fmt(+p.price * +i.qty) : "—"] : ["—", "—", "—", "—", "—"];
        }
        var c = allCards.find(function(c) { return c.id === i.refId; });
        if (!c) return ["—", "—", "—", "—", "—"];
        var pu = costPerUnit(c.id, allCards, allProds, []);
        return [c.name + " [" + T.expSemiTag + "]", T.expSemiLabel, c.outputUnit, i.qty, i.qty ? fmt(pu * +i.qty) : "—"];
      });
    rows.forEach(function(r, ri) {
      if (ri === 0) steps.push([si + 1, s.name || (T.expStepDefault + " " + (si + 1)), s.process || "—", s.params.temp || "—", s.params.time || "—", s.params.pressure || "—", s.params.note || "—"].concat(r));
      else steps.push(["", "", "", "", "", "", ""].concat(r));
    });
    steps.push([]);
  });
  var ws2 = XLSX.utils.aoa_to_sheet(steps);
  ws2["!cols"] = [{ wch: 4 }, { wch: 20 }, { wch: 14 }, { wch: 8 }, { wch: 8 }, { wch: 9 }, { wch: 20 }, { wch: 28 }, { wch: 20 }, { wch: 8 }, { wch: 8 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws2, T.expStepsSheetName);

  // Sheet 3: Product details used in this card
  var usedProds = {};
  bom.forEach(function(r) {
    var p = allProds.find(function(p) { return p.name === r.name; });
    if (p && !usedProds[p.id]) usedProds[p.id] = p;
  });
  var prodRows = [
    [T.adminOrgProducts + " — " + card.name], [],
    [T.nomThName, T.nomThUnit, T.nomThPrice + " " + T.currency, T.nomPacking, T.nomPackQty, T.nomPackPrice + " " + T.currency, T.nomProteins, T.nomFats, T.nomCarbs, T.nomCalories]
  ];
  Object.keys(usedProds).forEach(function(id) {
    var p = usedProds[id];
    prodRows.push([p.name, p.unit, p.price, p.packaging || "—", p.packQty || "—", p.packPrice || "—",
      p.proteins || "—", p.fats || "—", p.carbs || "—", p.calories || "—"]);
  });
  var ws3 = XLSX.utils.aoa_to_sheet(prodRows);
  ws3["!cols"] = [{ wch: 30 }, { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, ws3, T.adminOrgProducts);

  XLSX.writeFile(wb, T.expCardSheet + "_" + card.name.replace(/\s+/g, "_") + ".xlsx");
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function SettingsPanel(props) {
  var user = props.user;
  var [section, setSection] = useState(null);
  var [pf, setPf] = useState({ name: user.name, age: user.age || "", city: user.city || "", position: user.position || "", workplace: user.workplace || "", purpose: user.purpose || "" });
  var [pfMsg, setPfMsg] = useState("");
  var [pfLoading, setPfLoading] = useState(false);
  var [secLogin, setSecLogin] = useState(user.login || "");
  var [secOldPw, setSecOldPw] = useState("");
  var [secNewPw, setSecNewPw] = useState("");
  var [secMsg, setSecMsg] = useState("");
  var [secLoading, setSecLoading] = useState(false);
  var [avatarLoading, setAvatarLoading] = useState(false);
  var [delConfirm, setDelConfirm] = useState("");
  var [delMsg, setDelMsg] = useState("");
  var [delLoading, setDelLoading] = useState(false);

  async function saveProfile() {
    setPfLoading(true); setPfMsg("");
    try {
      var u = await api.updateProfile(pf);
      props.onUserUpdate(u);
      setPfMsg(T.setSaved);
    } catch(e) { setPfMsg("Error"); }
    setPfLoading(false);
  }

  async function doChangeLogin() {
    if (secLogin.trim().length < 3) { setSecMsg(T.setLoginShort); return; }
    setSecLoading(true); setSecMsg("");
    try {
      await api.changeLogin(secLogin.trim());
      setSecMsg(T.setLoginChanged);
    } catch(e) { setSecMsg(e.message.indexOf("400") >= 0 ? T.setLoginTaken : "Error"); }
    setSecLoading(false);
  }

  async function doChangePassword() {
    if (secNewPw.length < 4) { setSecMsg(T.setPasswordShort); return; }
    setSecLoading(true); setSecMsg("");
    try {
      await api.changePassword(secOldPw, secNewPw);
      setSecMsg(T.setPasswordChanged);
      setSecOldPw(""); setSecNewPw("");
    } catch(e) { setSecMsg(e.message.indexOf("400") >= 0 ? T.setWrongPassword : "Error"); }
    setSecLoading(false);
  }

  async function handleAvatarUpload(e) {
    var file = e.target.files[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      var reader = new FileReader();
      reader.onload = async function(ev) {
        var res = await api.uploadImage(ev.target.result, file.name);
        await api.uploadAvatar(res.url || res.path || ev.target.result);
        props.onUserUpdate(Object.assign({}, user, { avatar: res.url || res.path || ev.target.result }));
        setAvatarLoading(false);
      };
      reader.readAsDataURL(file);
    } catch(e) { setAvatarLoading(false); }
  }

  async function removeAvatar() {
    await api.uploadAvatar("");
    props.onUserUpdate(Object.assign({}, user, { avatar: "" }));
  }

  async function doDeleteData() {
    if (delConfirm !== T.setConfirmWord) return;
    setDelLoading(true);
    try {
      await api.deleteData();
      setDelMsg(T.setDeleteDataDone);
      setDelConfirm("");
    } catch(e) { setDelMsg("Error"); }
    setDelLoading(false);
  }

  async function doDeleteAccount() {
    if (delConfirm !== T.setConfirmWord) return;
    setDelLoading(true);
    try {
      await api.deleteAccount();
      props.onLogout();
    } catch(e) { setDelMsg("Error"); setDelLoading(false); }
  }

  var sectionStyle = { background: C.card, border: "1px solid " + C.border, borderRadius: 12, padding: 18, marginBottom: 12, cursor: "pointer" };
  var sectionHead = function(icon, title, key, color) {
    var open = section === key;
    return (
      <div onClick={function() { setSection(open ? null : key); setDelConfirm(""); setDelMsg(""); setPfMsg(""); setSecMsg(""); }}
        style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
        {icon}
        <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: color || C.text }}>{title}</span>
        {open ? <IChU s={14} c={C.mid} /> : <IChD s={14} c={C.mid} />}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <IGear s={20} c={C.acc} />
        <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{T.settingsTitle}</h2>
      </div>

      {/* Profile */}
      <div style={sectionStyle}>
        {sectionHead(<IUser s={16} c={C.blue} />, T.setProfile, "profile")}
        {section === "profile" && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <Inp label={T.regName} value={pf.name} onChange={function(v) { setPf(function(p) { return Object.assign({}, p, { name: v }); }); }} placeholder={T.regNamePh} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Inp label={T.regAge} value={pf.age} onChange={function(v) { setPf(function(p) { return Object.assign({}, p, { age: v }); }); }} type="number" placeholder="25" />
              <Inp label={T.regCity} value={pf.city} onChange={function(v) { setPf(function(p) { return Object.assign({}, p, { city: v }); }); }} placeholder={T.regCityPh} />
            </div>
            <Inp label={T.regWorkplace} value={pf.workplace} onChange={function(v) { setPf(function(p) { return Object.assign({}, p, { workplace: v }); }); }} placeholder={T.regWorkplacePh} />
            <Inp label={T.regPosition} value={pf.position} onChange={function(v) { setPf(function(p) { return Object.assign({}, p, { position: v }); }); }} placeholder={T.regPositionPh} />
            <Inp label={T.regPurpose} value={pf.purpose} onChange={function(v) { setPf(function(p) { return Object.assign({}, p, { purpose: v }); }); }} placeholder={T.regPurposePh} />
            {pfMsg && <p style={{ fontSize: 12, color: pfMsg === T.setSaved ? C.green : C.red, textAlign: "center" }}>{pfMsg}</p>}
            <Btn disabled={pfLoading || !pf.name.trim()} onClick={saveProfile}><ICheck s={12} /> {T.setSave}</Btn>
          </div>
        )}
      </div>

      {/* Security */}
      <div style={sectionStyle}>
        {sectionHead(<IShield s={16} c={C.purple} />, T.setSecurity, "security")}
        {section === "security" && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: C.bg, borderRadius: 8, padding: 12, border: "1px solid " + C.border }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.mid, textTransform: "uppercase", marginBottom: 8, display: "block" }}>{T.setChangeLogin}</span>
              <Inp label={T.setNewLogin} value={secLogin} onChange={setSecLogin} placeholder={T.regLoginPh} />
              <div style={{ marginTop: 8 }}><Btn sz="sm" disabled={secLoading} onClick={doChangeLogin}>{T.setChangeLogin}</Btn></div>
            </div>
            <div style={{ background: C.bg, borderRadius: 8, padding: 12, border: "1px solid " + C.border }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.mid, textTransform: "uppercase", marginBottom: 8, display: "block" }}>{T.setChangePassword}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Inp label={T.setOldPassword} value={secOldPw} onChange={setSecOldPw} type="password" placeholder="••••" />
                <Inp label={T.setNewPassword} value={secNewPw} onChange={setSecNewPw} type="password" placeholder="••••" />
              </div>
              <div style={{ marginTop: 8 }}><Btn sz="sm" disabled={secLoading} onClick={doChangePassword}>{T.setChangePassword}</Btn></div>
            </div>
            {secMsg && <p style={{ fontSize: 12, color: secMsg === T.setPasswordChanged || secMsg === T.setLoginChanged ? C.green : C.red, textAlign: "center" }}>{secMsg}</p>}
          </div>
        )}
      </div>

      {/* Avatar */}
      <div style={sectionStyle}>
        {sectionHead(<ICam s={16} c={C.teal} />, T.setAvatar, "avatar")}
        {section === "avatar" && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: C.acc + "22", border: "3px solid " + C.border, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {user.avatar ? <img src={user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <IUser s={32} c={C.acc} />}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <label style={{ cursor: "pointer" }}>
                <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: "none" }} />
                <Btn sz="sm" disabled={avatarLoading}><ICam s={12} /> {T.setUploadPhoto}</Btn>
              </label>
              {user.avatar && <Btn v="danger" sz="sm" onClick={removeAvatar}><ITrash s={12} /> {T.setRemovePhoto}</Btn>}
            </div>
          </div>
        )}
      </div>

      {/* Tariff */}
      <div style={sectionStyle}>
        {sectionHead(<IStar s={16} c={C.orange} />, T.setTariff, "tariff")}
        {section === "tariff" && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, background: C.bg, borderRadius: 8, border: "1px solid " + C.green + "33" }}>
              <Badge col={C.green} sz={12}>{T.setTariffFree}</Badge>
              <span style={{ fontSize: 12, color: C.mid }}>{T.setTariffCurrent}</span>
            </div>
            <p style={{ fontSize: 12, color: C.dim, textAlign: "center", marginTop: 10 }}>{T.setTariffSoon}</p>
          </div>
        )}
      </div>

      {/* Delete Data */}
      <div style={Object.assign({}, sectionStyle, { borderColor: C.red + "33" })}>
        {sectionHead(<ITrash s={16} c={C.red} />, T.setDeleteData, "deleteData", C.red)}
        {section === "deleteData" && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 12, color: C.red, background: C.red + "11", padding: 10, borderRadius: 6 }}>{T.setDeleteDataWarn}</p>
            <Inp label={T.setConfirmDelete} value={delConfirm} onChange={setDelConfirm} placeholder={T.setConfirmWord} />
            {delMsg && <p style={{ fontSize: 12, color: delMsg === T.setDeleteDataDone ? C.green : C.red, textAlign: "center" }}>{delMsg}</p>}
            <Btn v="danger" disabled={delLoading || delConfirm !== T.setConfirmWord} onClick={doDeleteData}><ITrash s={12} /> {T.setDeleteDataBtn}</Btn>
          </div>
        )}
      </div>

      {/* Delete Account */}
      <div style={Object.assign({}, sectionStyle, { borderColor: C.red + "33" })}>
        {sectionHead(<IX s={16} c={C.red} />, T.setDeleteAccount, "deleteAccount", C.red)}
        {section === "deleteAccount" && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 12, color: C.red, background: C.red + "11", padding: 10, borderRadius: 6 }}>{T.setDeleteAccountWarn}</p>
            <Inp label={T.setConfirmDelete} value={delConfirm} onChange={setDelConfirm} placeholder={T.setConfirmWord} />
            <Btn v="danger" disabled={delLoading || delConfirm !== T.setConfirmWord} onClick={doDeleteAccount}><IX s={12} /> {T.setDeleteAccountBtn}</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  var [tab, setTab] = useState("cards");
  var [products, setProducts] = useState([]);
  var [cards, setCards] = useState([]);
  var [folders, setFolders] = useState([]);
  var [modal, setModal] = useState(null);
  var [search, setSearch] = useState("");
  var [selFolder, setSelFolder] = useState("ALL");
  var [filterType, setFilterType] = useState("ALL");
  var [loaded, setLoaded] = useState(false);
  var [user, setUser] = useState(null);
  var [theme, setTheme] = useState("dark");
  var [lang, setLang] = useState(function() { try { return localStorage.getItem("techkarty_lang") || "uz"; } catch(e) { return "uz"; } });
  var [authChecked, setAuthChecked] = useState(false);
  var [authMode, setAuthMode] = useState("login");

  T = lang === "ru" ? T_RU : T_UZ;
  C = theme === "dark" ? DARK : LIGHT;

  var isTelegram = !!(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData);

  useEffect(function() {
    try {
      if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        var params = new URLSearchParams(window.location.search);
        var t = params.get("tab");
        if (t === "nom" || t === "cards") setTab(t);
      }
    } catch(e) {}
  }, []);

  useEffect(function() {
    (async function() {
      try {
        var profile = await api.getProfile();
        if (profile.registered) {
          setUser(profile);
          setTheme(profile.theme || "dark");
        }
      } catch(e) {
        console.error(e);
      }
      setAuthChecked(true);
    })();
  }, []);

  useEffect(function() {
    if (!user || !user.registered) return;
    (async function() {
      try {
        var [pr, ca, fo] = await Promise.all([
          api.getProducts(),
          api.getCards(),
          api.getFolders(),
        ]);
        setProducts(pr || []);
        setCards(ca || []);
        setFolders(fo || []);
      } catch(e) {
        console.error("Failed to load data:", e);
      }
      setLoaded(true);
    })();
  }, [user]);

  async function toggleTheme() {
    var next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try { await api.setTheme(next); } catch(e) {}
  }

  function toggleLang() {
    var next = lang === "uz" ? "ru" : "uz";
    setLang(next);
    try { localStorage.setItem("techkarty_lang", next); } catch(e) {}
  }

  function onRegistered(u) {
    setUser(u);
    setTheme(u.theme || "dark");
  }

  async function handleLogout() {
    try { await api.logout(); } catch(e) {}
    setUser(null);
    setLoaded(false);
    setAuthMode("login");
  }

  var saveProd = useCallback(async function(item) {
    await api.saveProduct(item);
    var fresh = await api.getProducts();
    setProducts(fresh);
  }, []);
  var deleteProd = useCallback(async function(id) {
    await api.deleteProduct(id);
    var fresh = await api.getProducts();
    setProducts(fresh);
  }, []);

  var saveCard = useCallback(async function(item) {
    await api.saveCard(item);
    var fresh = await api.getCards();
    setCards(fresh);
  }, []);
  var deleteCard = useCallback(async function(id) {
    await api.deleteCard(id);
    var fresh = await api.getCards();
    setCards(fresh);
  }, []);

  var saveFolderFn = useCallback(async function(item) {
    await api.saveFolder(item);
    var fresh = await api.getFolders();
    setFolders(fresh);
  }, []);
  var deleteFolderFn = useCallback(async function(id) {
    await api.deleteFolder(id);
    var fresh = await api.getFolders();
    setFolders(fresh);
  }, []);

  var rootFolders = folders.filter(function(f) { return !f.parentId; });

  var filteredProds = useMemo(function() {
    return products.filter(function(p) {
      var ms = p.name.toLowerCase().indexOf(search.toLowerCase()) >= 0;
      var mf = selFolder === "ALL" ? true : selFolder === "NONE" ? !p.folderId : getFolderChildren(selFolder, folders).indexOf(p.folderId) >= 0;
      var mt = filterType === "ALL" || p.nomType === filterType;
      return ms && mf && mt;
    });
  }, [products, search, selFolder, filterType, folders]);

  var filteredCards = cards.filter(function(c) { return c.name.toLowerCase().indexOf(search.toLowerCase()) >= 0; });

  if (!authChecked) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg, color: C.mid, fontFamily: "'Inter',sans-serif", gap: 16 }}>
      <style>{buildCSS(C)}</style>
      <div style={{ width: 36, height: 36, border: "3px solid " + C.border, borderTopColor: C.acc, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      <span style={{ fontSize: 13, fontWeight: 600, animation: "bgPulse 1.5s ease infinite" }}>{T.loading}</span>
    </div>
  );

  if (!user || !user.registered) {
    return (
      <>
        <style>{buildCSS(C)}</style>
        {authMode === "login"
          ? <LoginForm onDone={onRegistered} onSwitch={function() { setAuthMode("register"); }} />
          : <RegForm onDone={onRegistered} onSwitch={function() { setAuthMode("login"); }} />}
      </>
    );
  }

  if (!loaded) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg, color: C.mid, fontFamily: "'Inter',sans-serif", gap: 16 }}>
      <style>{buildCSS(C)}</style>
      <div style={{ width: 36, height: 36, border: "3px solid " + C.border, borderTopColor: C.acc, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      <span style={{ fontSize: 13, fontWeight: 600, animation: "bgPulse 1.5s ease infinite" }}>{T.dataLoading}</span>
    </div>
  );

  var isAdmin = user.role === "admin";

  return (
    <>
      <style>{buildCSS(C)}</style>
      <div style={{ minHeight: "100vh", background: C.bg }}>

        {/* NAV */}
        <div style={{ background: C.card, borderBottom: "1px solid " + C.border, position: "sticky", top: 0, zIndex: 10, marginBottom: 10 }}>
          <div style={{ maxWidth: 1360, margin: "0 auto", padding: "10px 16px" }}>
            {/* Top bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="nav-logo-icon hover-scale" style={{ width: 32, height: 32, background: "linear-gradient(135deg, " + C.acc + ", " + C.orange + ")", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px " + C.acc + "33" }}>
                  <ILayers s={16} c="#000" />
                </div>
                <div>
                  <span style={{ fontWeight: 800, fontSize: 15, color: C.text }}>ТехКарты</span>
                  <span style={{ fontSize: 10, color: C.dim, marginLeft: 4, fontWeight: 600 }}>PRO</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button onClick={toggleLang} title={T.toggleLang} className="hover-glow icon-spin"
                  style={{ background: C.bg, border: "1px solid " + C.border, borderRadius: 10, padding: "6px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                    fontSize: 11, fontWeight: 700, color: C.acc }}>
                  <IGlobe s={12} c={C.acc} />
                  {lang === "uz" ? "UZ" : "RU"}
                </button>
                <button onClick={toggleTheme} title={T.toggleTheme} className="hover-glow icon-spin"
                  style={{ background: C.bg, border: "1px solid " + C.border, borderRadius: 10, padding: "6px 9px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                  {theme === "dark" ? <ISun s={14} c={C.acc} /> : <IMoon s={14} c={C.acc} />}
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: C.bg, borderRadius: 10, border: "1px solid " + C.border }}>
                  <div style={{ width: 22, height: 22, background: C.acc + "22", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <IUser s={11} c={C.acc} />
                  </div>
                  <span className="nav-user-name" style={{ fontSize: 12, color: C.text, fontWeight: 600, maxWidth: 90, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{user.name}</span>
                </div>
                <button onClick={handleLogout} title={T.logoutBtn} className="hover-glow"
                  style={{ background: C.red + "18", border: "1px solid " + C.red + "33", borderRadius: 10, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                    fontSize: 11, fontWeight: 700, color: C.red }}>
                  <ILogout s={12} c={C.red} />
                  <span className="nav-btn-text">{T.logoutBtn}</span>
                </button>
              </div>
            </div>
            {/* Tab bar + actions */}
            <div className="nav-inner" style={{ display: "flex", alignItems: "center", gap: 4, paddingBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                {[{ k: "cards", l: T.tabCards, n: cards.length, icon: function(c) { return <ILayers s={14} c={c} />; } },
                  { k: "nom", l: T.tabNom, n: products.length, icon: function(c) { return <IBox s={14} c={c} />; } },
                  { k: "settings", l: T.tabSettings, n: "", icon: function(c) { return <IGear s={14} c={c} />; } }]
                  .concat(isAdmin ? [{ k: "admin", l: T.tabAdmin, n: "", icon: function(c) { return <IShield s={14} c={c} />; } }] : [])
                  .map(function(t) {
                  var active = tab === t.k;
                  return (
                    <button key={t.k} className="nav-tab" onClick={function() { setTab(t.k); setSearch(""); }}
                      style={{ background: active ? C.acc + "15" : "transparent", border: "none",
                        color: active ? C.acc : C.mid, fontWeight: 700, fontSize: 13,
                        padding: "9px 16px", borderRadius: 10, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 7, transition: "all .2s ease" }}>
                      {t.icon(active ? C.acc : C.mid)}
                      <span className="nav-tab-text">{t.l}</span>
                      {t.n !== "" && <span style={{ background: active ? C.acc : C.border, color: active ? "#000" : C.dim, borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 700, minWidth: 20, textAlign: "center" }}>{t.n}</span>}
                    </button>
                  );
                })}
              </div>
              <div style={{ flex: 1 }} />
              {tab !== "admin" && tab !== "settings" && (
                <div className="nav-inner" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div className="nav-search" style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: C.dim }}><ISearch s={12} /></span>
                    <input value={search} onChange={function(e) { setSearch(e.target.value); }} placeholder={T.searchPlaceholder}
                      style={{ background: C.bg, border: "1px solid " + C.border, borderRadius: 10, padding: "7px 11px 7px 28px", color: C.text, fontSize: 12, width: 160 }} />
                  </div>
                  {tab === "nom" && (
                    <>
                      <Btn className="nav-btn" v="ghost" sz="sm" onClick={function() { setModal({ type: "excelImport" }); }} title={T.btnImport}
                        sx={{ borderRadius: 10 }}>
                        <IDown s={12} /> <span className="nav-btn-text">{T.btnImport}</span>
                      </Btn>
                      <Btn className="nav-btn" v="warn" sz="sm" onClick={function() { setModal({ type: "batchPrices" }); }} title={T.btnPrice}
                        sx={{ borderRadius: 10 }}>
                        <IFire s={11} /> <span className="nav-btn-text">{T.btnPrice}</span>
                      </Btn>
                    </>
                  )}
                  <Btn className="nav-btn" onClick={function() { setModal({ type: tab === "cards" ? "newCard" : "newNom" }); }}
                    sx={{ borderRadius: 10 }}>
                    <IPlus /> <span className="nav-btn-text">{tab === "cards" ? T.btnNew : T.btnAdd}</span>
                  </Btn>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── SETTINGS TAB ── */}
        {tab === "settings" && (
          <TabTransition tabKey="settings"><SettingsPanel user={user} onUserUpdate={function(u) { setUser(u); }} onLogout={handleLogout} /></TabTransition>
        )}

        {/* ── ADMIN TAB ── */}
        {tab === "admin" && isAdmin && <TabTransition tabKey="admin"><AdminPanel /></TabTransition>}

        {/* ── CARDS TAB ── */}
        {tab === "cards" && (
          <TabTransition tabKey="cards"><div style={{ maxWidth: 1360, margin: "0 auto", padding: "12px 10px" }}>
            <div className="type-legend" style={{ display: "flex", gap: 8, marginBottom: 14, padding: "8px 12px", background: C.card, borderRadius: 8, border: "1px solid " + C.border, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, color: C.mid, fontWeight: 700 }}>{T.typesLabel}</span>
              {NT_KEYS.map(function(k) {
                return (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 7px", background: ntColor(k) + "1a", border: "1px solid " + ntColor(k) + "33", borderRadius: 4 }}>
                    <NomIcon type={k} s={10} />
                    <span style={{ fontSize: 10, color: ntColor(k), fontWeight: 700 }}>{ntShort(k)} = {ntLabel(k)}</span>
                  </div>
                );
              })}
            </div>

            {filteredCards.length === 0 ? (
              <div className="slide-up" style={{ textAlign: "center", padding: "70px 0" }}>
                <div style={{ width: 56, height: 56, background: C.acc + "15", borderRadius: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <ILayers s={24} c={C.acc} />
                </div>
                <p style={{ color: C.mid, fontSize: 14, marginBottom: 16 }}>{T.noCards}</p>
                <Btn onClick={function() { setModal({ type: "newCard" }); }}><IPlus /> {T.createFirst}</Btn>
              </div>
            ) : (
              <div className="cards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(350px,1fr))", gap: 12 }}>
                {filteredCards.map(function(card) {
                  var tc = totalCost(card, cards, products);
                  var dep = getDepth(card.id, cards, []);
                  var semiCnt = [].concat.apply([], card.steps.map(function(s) { return s.ingredients.filter(function(i) { return i.type === "semifinished"; }).map(function(i) { return i.refId; }); }));
                  semiCnt = semiCnt.filter(function(v, i, a) { return a.indexOf(v) === i; }).length;
                  var usedAsSemi = cards.some(function(c) { return c.id !== card.id && c.steps.some(function(s) { return s.ingredients.some(function(i) { return i.type === "semifinished" && i.refId === card.id; }); }); });
                  var g = +card.grossWeight || 0, n = +card.netWeight || 0;
                  var yp = g > 0 && n > 0 ? (n / g * 100) : 0;
                  return (
                    <div key={card.id} className="fi card-item"
                      style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
                            <h3 style={{ fontWeight: 800, fontSize: 14 }}>{card.name}</h3>
                            {usedAsSemi && <Badge col={C.orange} sz={9}><ILayers s={9} /> {T.expSemiTag}</Badge>}
                          </div>
                          {card.description && <p style={{ color: C.mid, fontSize: 11 }}>{card.description}</p>}
                        </div>
                        <div style={{ display: "flex", gap: 4 }}>
                          <Btn v="ghost" sz="xs" onClick={function() { setModal({ type: "editCard", data: card }); }}><IEdit s={11} /></Btn>
                          <Btn v="danger" sz="xs" onClick={function() { deleteCard(card.id); }}><ITrash s={11} /></Btn>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {card.outputQty && <Badge col={C.blue} sz={10}>{T.outputLabel}: {card.outputQty} {card.outputUnit}</Badge>}
                        <Badge col={C.purple} sz={10}>{card.steps.length} {lang === "ru" ? "эт." : "бос."}</Badge>
                        {semiCnt > 0 && <Badge col={C.orange} sz={10}><ILayers s={9} /> {semiCnt} {T.expSemiTag}</Badge>}
                        {dep > 1 && <Badge col={C.teal} sz={10}><ITree s={9} /> {dep - 1} {lang === "ru" ? "ур." : "дар."}</Badge>}
                        {yp > 0 && <Badge col={C.teal} sz={10}>{yp.toFixed(1)}%</Badge>}
                      </div>
                      {(g > 0 || n > 0) && (
                        <div style={{ display: "flex", gap: 10, padding: "6px 10px", background: C.sur, borderRadius: 6, fontSize: 11 }}>
                          {g > 0 && <span><span style={{ color: C.dim }}>{T.bruttoLabel} </span><span className="mono" style={{ color: C.text }}>{fmt(g)} {card.outputUnit}</span></span>}
                          {n > 0 && <span><span style={{ color: C.dim }}>{T.nettoLabel} </span><span className="mono" style={{ color: C.green }}>{fmt(n)} {card.outputUnit}</span></span>}
                          {yp > 0 && <span><span style={{ color: C.dim }}>{T.yieldLabel} </span><span className="mono" style={{ color: C.teal }}>{yp.toFixed(1)}%</span></span>}
                        </div>
                      )}
                      {card.steps.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          {card.steps.map(function(s, i) {
                            var hS = s.ingredients.some(function(x) { return x.type === "semifinished"; });
                            var nts = s.ingredients.filter(function(x) { return x.type === "product"; })
                              .map(function(x) { var p = products.find(function(p) { return p.id === x.refId; }); return p ? p.nomType : null; })
                              .filter(function(v, i, a) { return v && a.indexOf(v) === i; });
                            return (
                              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 8px", background: "#12142040", borderRadius: 5 }}>
                                <span style={{ color: C.acc, fontWeight: 800, fontSize: 9, flexShrink: 0, fontFamily: "'Inter',sans-serif" }}>{i + 1}</span>
                                <span style={{ flex: 1, color: C.mid, fontSize: 11, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{s.name || (T.stepNameDefault + " " + (i + 1))}</span>

                                {nts.map(function(t) { return <NomIcon key={t} type={t} s={10} />; })}
                                {hS && <ILayers s={9} c={C.orange} />}
                                {s.process && s.process !== "—" && <Badge col={C.dim} sz={9}>{s.process}</Badge>}
                                {s.params.temp && <span className="mono" style={{ color: C.blue, fontSize: 9 }}>{s.params.temp}°</span>}
                                {s.params.time && <span className="mono" style={{ color: C.teal, fontSize: 9 }}>{s.params.time}м</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {(function() {
                        var nut = calcNutrition(card, cards, products);
                        var hasNut = nut.calories > 0 || nut.proteins > 0;
                        var perServ = +card.outputQty || 1;
                        return hasNut ? (
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "6px 0" }}>
                            <Badge col={C.red} sz={9}>Б: {fmt(nut.proteins / perServ)}г</Badge>
                            <Badge col={C.orange} sz={9}>Ж: {fmt(nut.fats / perServ)}г</Badge>
                            <Badge col={C.blue} sz={9}>У: {fmt(nut.carbs / perServ)}г</Badge>
                            <Badge col={C.purple} sz={9}>{fmt(nut.calories / perServ)} ккал</Badge>
                          </div>
                        ) : null;
                      })()}
                      <div style={{ borderTop: "1px solid " + C.border, paddingTop: 9, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: 9, color: C.dim, textTransform: "uppercase", letterSpacing: 0.7 }}>{T.costLabel}</div>
                          <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: tc > 0 ? C.green : C.dim }}>{tc > 0 ? fmt(tc) + " " + T.currency : "—"}</div>
                          {tc > 0 && card.outputQty && <div className="mono" style={{ fontSize: 10, color: C.dim }}>{fmt(tc / (+card.outputQty))} {T.currency} / {card.outputUnit}</div>}
                        </div>
                        <div style={{ display: "flex", gap: 5 }}>
                          <Btn v="info" sz="sm" onClick={function() { setModal({ type: "detail", data: card }); }}><ITree s={11} /> {T.treeBtn}</Btn>
                          <Btn v="success" sz="sm" onClick={function() { exportExcel(card, cards, products); }}><IDown s={11} /> Excel</Btn>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          </TabTransition>
        )}

        {/* ── NOM TAB ── */}
        {tab === "nom" && (
          <TabTransition tabKey="nom"><div className="nom-layout" style={{ maxWidth: 1360, margin: "0 auto", padding: "12px 10px", display: "grid", gridTemplateColumns: "210px 1fr", gap: 16, alignItems: "start" }}>
            {/* Sidebar */}
            <div className="nom-sidebar" style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 10, padding: 11, position: "sticky", top: 70 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.mid, textTransform: "uppercase", letterSpacing: 0.7 }}>{T.folders}</span>
                <Btn v="ghost" sz="xs" onClick={function() { setModal({ type: "newFolder" }); }}><IPlus s={10} /> {T.folderCreate}</Btn>
              </div>
              {[{ id: "ALL", name: T.folderAll }, { id: "NONE", name: T.folderNone }].map(function(fld) {
                var sel = selFolder === fld.id;
                return (
                  <div key={fld.id} onClick={function() { setSelFolder(fld.id); }}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", borderRadius: 6, cursor: "pointer", marginBottom: 1,
                      background: sel ? C.acc + "18" : "transparent", color: sel ? C.acc : C.mid, fontSize: 12, fontWeight: sel ? 700 : 400 }}>
                    <IFolder s={12} c={sel ? C.acc : C.mid} />
                    {fld.name}
                    <span style={{ marginLeft: "auto", fontSize: 9, fontFamily: "'Inter',sans-serif" }}>
                      {fld.id === "ALL" ? products.length : products.filter(function(p) { return !p.folderId; }).length}
                    </span>
                  </div>
                );
              })}
              <div style={{ height: 1, background: C.border, margin: "7px 0" }} />
              {rootFolders.map(function(f) {
                return <FolderNode key={f.id} folder={f} folders={folders} products={products}
                  selected={selFolder} onSelect={setSelFolder}
                  onDel={function(id) { deleteFolderFn(id); if (selFolder === id) setSelFolder("ALL"); }} />;
              })}
              {rootFolders.length === 0 && <p style={{ fontSize: 11, color: C.dim, textAlign: "center", padding: "6px 0" }}>{T.folderNoFolders}</p>}
              <div style={{ height: 1, background: C.border, margin: "9px 0" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.mid, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 2 }}>Тип</span>
                {[{ k: "ALL", l: "Все типы", c: C.mid }].concat(NT_KEYS.map(function(k) { return { k: k, l: ntLabel(k), c: ntColor(k) }; })).map(function(t) {
                  var sel = filterType === t.k;
                  return (
                    <button key={t.k} onClick={function() { setFilterType(t.k); }}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 7px", borderRadius: 5,
                        border: "1px solid " + (sel ? t.c : C.border), background: sel ? t.c + "18" : "transparent", cursor: "pointer", textAlign: "left" }}>
                      {t.k !== "ALL" && <NomIcon type={t.k} s={10} />}
                      <span style={{ fontSize: 11, color: sel ? t.c : C.mid, fontWeight: sel ? 700 : 400, flex: 1 }}>{t.l}</span>
                      <span style={{ fontSize: 9, color: C.dim, fontFamily: "'Inter',sans-serif" }}>
                        {t.k === "ALL" ? products.length : products.filter(function(p) { return p.nomType === t.k; }).length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main */}
            <div>
              <div className="nom-stats" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 7, marginBottom: 14 }}>
                {NT_KEYS.map(function(k, i) {
                  var cnt = products.filter(function(p) { return p.nomType === k; }).length;
                  var isActive = filterType === "ALL" || filterType === k;
                  return (
                    <div key={k} className={"nom-stat-card slide-up stagger-" + (i + 1)} onClick={function() { setFilterType(filterType === k ? "ALL" : k); }}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: ntColor(k) + "1a",
                        border: "2px solid " + (filterType === k ? ntColor(k) : ntColor(k) + "33"), borderRadius: 10, cursor: "pointer",
                        opacity: isActive ? 1 : 0.4, transform: filterType === k ? "scale(1.02)" : "scale(1)" }}>
                      <div className="icon-bounce" style={{ display: "flex" }}>
                        <NomIcon type={k} s={14} />
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: ntColor(k), fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{ntLabel(k)}</div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: ntColor(k) }}><AnimNum value={cnt} /></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredProds.length === 0 ? (
                <div className="slide-up" style={{ textAlign: "center", padding: "60px 0", background: C.card, borderRadius: 10, border: "1px solid " + C.border }}>
                  <div style={{ width: 56, height: 56, background: C.acc + "15", borderRadius: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                    <IBox s={24} c={C.acc} />
                  </div>
                  <p style={{ color: C.mid, fontSize: 14, marginBottom: 16 }}>{T.noItems}</p>
                  <Btn onClick={function() { setModal({ type: "newNom" }); }}><IPlus /> {T.addItem}</Btn>
                </div>
              ) : (
                <div className="nom-table" style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 10, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: C.sur }}>
                        {[T.nomThType, T.nomThName, T.nomThUnit, T.nomThPrice, T.nomThPack, "Б", "Ж", "У", "Ккал", T.nomThFolder, ""].map(function(h, i) {
                          var nutCol = h === "Б" ? C.blue : h === "Ж" ? C.orange : h === "У" ? C.green : h === "Ккал" ? C.red : C.mid;
                          return <th key={i} style={{ padding: "8px 11px", textAlign: "left", fontSize: 9, fontWeight: 700, color: nutCol, textTransform: "uppercase", letterSpacing: 0.7, borderBottom: "1px solid " + C.border, whiteSpace: "nowrap" }}>{h}</th>;
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProds.map(function(p) {
                        var col = ntColor(p.nomType);
                        var fl = folders.find(function(f) { return f.id === p.folderId; });
                        var lc = p.linkedCardId ? cards.find(function(c) { return c.id === p.linkedCardId; }) : null;
                        var packLabel = p.packaging ? (p.packaging + (+p.packQty ? " " + p.packQty + " " + p.unit : "") + (+p.packPrice ? " · " + fmt(p.packPrice) + " " + T.currency : "")) : "—";
                        return (
                          <tr key={p.id} style={{ borderBottom: "1px solid " + C.border + "22" }}>
                            <td style={{ padding: "8px 11px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 6px", background: col + "1a", borderRadius: 5, width: "fit-content" }}>
                                <NomIcon type={p.nomType} s={11} />
                                <span style={{ fontSize: 10, color: col, fontWeight: 700, fontFamily: "'Inter',sans-serif" }}>{ntShort(p.nomType)}</span>
                              </div>
                            </td>
                            <td style={{ padding: "8px 11px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                {p.image && <img src={p.image} style={{ width: 32, height: 32, borderRadius: 5, objectFit: "cover", border: "1px solid " + C.border }} />}
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                                  {p.description && <div style={{ fontSize: 10, color: C.dim }}>{p.description}</div>}
                                  {lc && <div style={{ fontSize: 10, color: C.teal, marginTop: 1 }}>↳ {lc.name}</div>}
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "8px 11px" }}><span className="mono" style={{ fontSize: 12, color: C.mid }}>{p.unit}</span></td>
                            <td style={{ padding: "8px 11px" }}><span className="mono" style={{ fontSize: 13, color: C.acc, fontWeight: 600 }}>{fmt(p.price)}</span></td>
                            <td style={{ padding: "8px 11px" }}><span style={{ fontSize: 11, color: C.mid }}>{packLabel}</span></td>
                            <td style={{ padding: "8px 11px" }}><span className="mono" style={{ fontSize: 11, color: C.blue }}>{+p.proteins ? p.proteins : "—"}</span></td>
                            <td style={{ padding: "8px 11px" }}><span className="mono" style={{ fontSize: 11, color: C.orange }}>{+p.fats ? p.fats : "—"}</span></td>
                            <td style={{ padding: "8px 11px" }}><span className="mono" style={{ fontSize: 11, color: C.green }}>{+p.carbs ? p.carbs : "—"}</span></td>
                            <td style={{ padding: "8px 11px" }}><span className="mono" style={{ fontSize: 11, color: C.red }}>{+p.calories ? p.calories : "—"}</span></td>
                            <td style={{ padding: "8px 11px" }}>
                              {fl ? <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: C.mid }}><IFolder s={10} c={C.mid} />{fl.name}</div> : <span style={{ color: C.dim, fontSize: 11 }}>—</span>}
                            </td>
                            <td style={{ padding: "8px 11px" }}>
                              <div style={{ display: "flex", gap: 4 }}>
                                <Btn v="ghost" sz="xs" onClick={function() { setModal({ type: "editNom", data: p }); }}><IEdit s={11} /></Btn>
                                <Btn v="danger" sz="xs" onClick={function() { deleteProd(p.id); }}><ITrash s={11} /></Btn>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          </TabTransition>
        )}

        {/* MODALS */}
        {modal && modal.type === "newNom" && (
          <Modal title={T.modalNewNom} width={740} onClose={function() { setModal(null); }}>
            <NomForm folders={folders} cards={cards} onSave={function(p) { saveProd(Object.assign({ nomType: "tovar" }, p)); }} onClose={function() { setModal(null); }} />
          </Modal>
        )}
        {modal && modal.type === "editNom" && (
          <Modal title={T.modalEditNom} width={740} onClose={function() { setModal(null); }}>
            <NomForm init={modal.data} folders={folders} cards={cards}
              onSave={function(p) { saveProd(p); }}
              onClose={function() { setModal(null); }} />
          </Modal>
        )}
        {modal && modal.type === "newCard" && (
          <Modal title={T.modalNewCard} sub={T.modalNewCardSub} width={980} onClose={function() { setModal(null); }}>
            <CardForm products={products} cards={cards} onSave={function(c) { saveCard(c); }} onClose={function() { setModal(null); }} />
          </Modal>
        )}
        {modal && modal.type === "editCard" && (
          <Modal title={T.modalEditCard} width={980} onClose={function() { setModal(null); }}>
            <CardForm init={modal.data} products={products} cards={cards}
              onSave={function(c) { saveCard(c); }}
              onClose={function() { setModal(null); }} />
          </Modal>
        )}
        {modal && modal.type === "newFolder" && (
          <Modal title={T.modalNewFolder} width={420} onClose={function() { setModal(null); }}>
            <FolderForm folders={folders} onSave={function(f) { saveFolderFn(f); }} onClose={function() { setModal(null); }} />
          </Modal>
        )}
        {modal && modal.type === "excelImport" && (
          <Modal title={T.modalExcelImport} sub={T.modalExcelSub} width={700} onClose={function() { setModal(null); }}>
            <ExcelImport onClose={function() { setModal(null); }}
              onImported={async function() {
                var [pr, fo] = await Promise.all([api.getProducts(), api.getFolders()]);
                setProducts(pr || []); setFolders(fo || []);
              }} />
          </Modal>
        )}
        {modal && modal.type === "batchPrices" && (
          <Modal title={T.modalBatchPrice} sub={T.modalBatchPriceSub} width={600} onClose={function() { setModal(null); }}>
            <BatchPriceEditor products={products} folders={folders} onClose={function() { setModal(null); }}
              onSaved={async function() {
                var pr = await api.getProducts();
                setProducts(pr || []);
              }} />
          </Modal>
        )}
        {modal && modal.type === "detail" && (
          <Modal title={modal.data.name} sub={T.modalDetailSub} width={680} onClose={function() { setModal(null); }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {modal.data.outputQty && <Badge col={C.blue}>{T.outputLabel}: {modal.data.outputQty} {modal.data.outputUnit}</Badge>}
                {(function() { var tc = totalCost(modal.data, cards, products); return tc > 0 ? <Badge col={C.green}>{fmt(tc)} {T.currency} · {fmt(tc / (+modal.data.outputQty || 1))} {T.currency}/{T.perUnit}</Badge> : null; })()}
                {modal.data.grossWeight && <Badge col={C.acc}>{T.bruttoLabel} {modal.data.grossWeight} {modal.data.outputUnit}</Badge>}
                {modal.data.netWeight && <Badge col={C.green}>{T.nettoLabel} {modal.data.netWeight} {modal.data.outputUnit}</Badge>}
              </div>
              <div style={{ background: C.bg, borderRadius: 8, padding: 12, border: "1px solid " + C.border }}>
                <IngTree cardId={modal.data.id} allCards={cards} allProducts={products} depth={0} />
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <Btn v="ghost" onClick={function() { setModal(null); }}>{T.modalClose}</Btn>
                <Btn v="success" onClick={function() { exportExcel(modal.data, cards, products); }}><IDown /> {T.modalDownloadExcel}</Btn>
              </div>
            </div>
          </Modal>
        )}

      </div>
    </>
  );
}
