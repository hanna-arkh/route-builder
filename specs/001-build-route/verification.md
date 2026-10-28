# Verification: Route Builder

## 2026-10-28 — Phase 1 / Setup

Разрешенный объем этой итерации: T001–T004. Foundation, экраны и приемка iOS
не выполняются в рамках Setup. Отметки ниже не подтверждают готовность приложения.

### T001 — окружение и документация

| Проверка | Фактический результат |
|---|---|
| Node | v22.22.0 — соответствует >=22.13.x |
| npm | 10.9.4 |
| Expo | 58.0.16; package.json: ~58.0.16 |
| React Native | 0.88.0 |
| React | 19.3.0 |
| TypeScript | 6.0.3; package.json: ~6.0.3 |
| tsconfig.json | extends expo/tsconfig.base, strict=true |
| Менеджер пакетов | npm, package-lock.json; bun.lock отсутствует |
| requirements.md | 16/16 отмечено, 0 неотмеченных; чеклист не изменялся |

Версии подтверждены командами node --version, npm --version и чтением установленных
package.json пакетов. SDK и entry point не меняются. Доступные skills проверены:
дополнительной процедуры для safe-area/ESLint среди них нет; используется Expo CLI.

Перед изменениями прочитаны официальные источники:

- [Версионная документация Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/):
  совместимость React Native 0.88 / React 19.3.0 / Node >=22.13.x.
- [Индекс Expo и исправления распространенных ошибок](https://docs.expo.dev/llms.txt).
- [safe-area-context для SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/safe-area-context/):
  рекомендуемая версия ~5.10.1; модуль включен в Expo Go.
- [Настройка ESLint через Expo CLI](https://docs.expo.dev/guides/using-eslint/):
  expo lint и flat config eslint-config-expo.

Исходный макет прочитан после распаковки JSON-template из
designs/RouteBuilder-Screens.html; значения оформления не берутся из обложки bundle.

### Исходные контрольные суммы SHA-256

Для проверки границы Setup зафиксированы до изменений:

| Файл | SHA-256 |
|---|---|
| server.js | d213029e846a69065ff847e71875acbb6024122b1aa829851cf0351ae1a96abb |
| index.ts | 5c157f4d44972d9c84415e1e4bda595b3abcd8cf733f8a9cd20935bec3eccc42 |
| App.tsx | c61c877a2e12a17a0f54189be468e0c8b16e4f071a19109fc929a149f642e473 |

Запуск iOS runtime и HTTP из приложения относится к T014; здесь не проверялся.

### T002 — safe-area dependency

- Выполнено: `npx --no-install expo install react-native-safe-area-context`.
- Установлено 5.10.1, диапазон package.json — ~5.10.1; совпадает с
  expo/bundledNativeModules.json. Проверка semver.satisfies вернула true.
- package-lock.json содержит версию, registry URL и integrity.
- Первая попытка в sandbox завершилась ENOTFOUND registry.npmjs.org; повтор
  с разрешенным сетевым доступом успешен. SDK/React/React Native и index.ts не менялись.
- npm сообщил 12 уязвимостей дерева зависимостей (5 low, 3 moderate, 4 high).
  Автоматическое audit fix и обновление SDK не выполнялись: это вне Setup.

### T003 — ESLint

- Выполнено через Expo CLI:
  `npx --no-install expo install --dev 'eslint@^9.0.0' eslint-config-expo`.
- Установлены ESLint 9.39.5 и eslint-config-expo 58.0.4 (~58.0.4).
  Версия config соответствует expo/bundledNativeModules.json; диапазон ESLint
  ^9.0.0 соответствует bootstrap установленного Expo CLI.
- Создан eslint.config.js с defineConfig/globalIgnores и eslint-config-expo/flat.
  App.tsx, index.ts и src/components/theme.ts не игнорируются; server.js,
  HTML-макет, артефакты Spec Kit и генерируемые файлы исключены.
- В package.json добавлен script lint: expo lint; Prettier и тестовый framework
  не устанавливались. Настройка Markdown formatOnSave не изменялась.
- npm предупредил, что установленная версия ESLint 9 больше не поддерживается.
  Она сохранена в диапазоне bootstrap SDK58; самовольная миграция на следующий
  major ESLint или audit fix не выполнялись. Итоговый npm audit после установки
  по-прежнему сообщает 12 уязвимостей дерева зависимостей.

### T004 — токены оформления

- Создан src/components/theme.ts: цвета из распакованного HTML-макета,
  интервалы, скругления, размеры/межстрочные интервалы/веса текста.
- LTR: direction и writingDirection; minTouchTarget=44, fieldHeight=44,
  buttonHeight=52. Это токены для последующего UI, а не проверка одноручного UX.
- Используются системные шрифты; дополнительные шрифтовые зависимости не добавлены.
- Данные контактов, количества из примеров, экраны и сетевой клиент не создавались.

### Итоговые проверки Phase 1

| Команда / проверка | Результат |
|---|---|
| CI=1 npx --no-install expo lint | PASS, exit 0, без ошибок/предупреждений и setup prompt |
| npx --no-install tsc --noEmit | PASS, exit 0 |
| git diff --check | PASS |
| semver для safe-area-context и eslint-config-expo по SDK map | PASS |
| ESLint isPathIgnored для App.tsx/index.ts/theme.ts | false для всех трех |
| Контрольные суммы server.js/index.ts/App.tsx | Совпадают с исходными |

Проверены .gitignore и flat-config ignores; дополнены отсутствовавшие шаблоны
build/, *.log, .env*, временных файлов и .idea/. Публикация пакета не планируется,
поэтому .npmignore не добавлялся. Docker/Terraform/Helm/Prettier конфигурации
не обнаружены и не создавались. Extension hooks не зарегистрированы.

T001–T004 выполнены и отмечены [X]. T005–T042 остаются невыполненными.
Следующий runtime/HTTP gate находится в T014 и не запускался в этой итерации.


## 2026-10-28 — Phase 2 / Foundation

Объем: только T005–T014. Все десять задач выполнены; T015–T042 не начинались.
Новых зависимостей и экранов не добавлено. App.tsx временно заменен диагностическим
starter для gate T014, как предусмотрено задачей; вывод удалить при T023.

### Реализованные задачи

| Задача | Результат |
|---|---|
| T005 | src/types/dto.ts: строгие интерфейсы двух операций API и ошибок |
| T006 | src/types/domain.ts: Domain, readonly-черновик, состояния, ApiFailure и отмена |
| T007 | src/config/api.ts: единый baseUrl, pageSize=50, debounce=400, timeout=10000, fallback=2 |
| T008 | src/api/decoders.ts: unknown → DTO → Domain, nullable/строковые максимумы, null items |
| T009 | src/api/client.ts: native fetch, HTTP/JSON/timeout, общий Retry-After cooldown, cleanup |
| T010 | src/api/stops.ts: страницы, дедупликация, короткая страница/no-new-id, progress/resume |
| T011 | src/api/routes.ts: один POST, проверенный 201 и сверка snapshot, unknown при расхождении |
| T012 | src/context/validation.ts: все ошибки по id, пробелы, количества, 200 UTF-16, emoji |
| T013 | src/context/routeBuilderReducer.ts: immutable-переходы, порядок/режимы, guards и reset |
| T014 | src/context/RouteBuilderContext.tsx и диагностический App.tsx; iOS/HTTP gate PASS |

Общий retryAt хранится также в состоянии провайдера, чтобы исправление черновика
не снимало блокировку ожидания. browseLoaded различает пустой загруженный справочник
и еще не загруженный кеш. Context не экспортирует submit: его подключение — T022.
Provider отменяет GET при размонтировании; requestId защищает данные, ошибки и progress.
Для lifecycle-флага используется layout effect, чтобы дочерний load effect корректно
работал также при development cleanup/remount. Debounced UI-поиск остается T029.

### Проверки логики без нового framework

Временный скрипт `/private/tmp/route-builder-phase2-check.cjs` загружает TypeScript
через установленный TypeScript transpiler и использует node:assert. Он не является
новой инфраструктурой приложения. Команда `node /private/tmp/route-builder-phase2-check.cjs`
завершилась exit 0; 11 групп PASS:

1. Декодирование DTO и number/string/null packages_max, строгость обязательных полей.
2. Пробелы, целые количества, 200/201 UTF-16, emoji/непарные суррогаты, frozen snapshot.
3. Кодирование q с сохранением регистра, страницы 50+2 и дедупликация границы.
4. Остановка на короткой странице и при отсутствии новых id несмотря на метаданные.
5. Ошибка страницы и продолжение с сохраненного nextPage.
6. Общий cooldown 429/503, Retry-After/fallback и отсутствие скрытых повторов.
7. Отличие таймаута POST (unknown) от отмененного GET (не UI-ошибка).
8. Невалидный JSON: protocol error; поврежденное тело 422 не скрывает HTTP-отказ.
9. Неизмененный текст POST, сверка ответа, сохранение receivedRouteId при mismatch.
10. Reducer: режимы/уникальность/сохранение текста, игнорирование устаревших ответов.
11. Reducer: отправка/unknown/success guards, cooldown после правки и New route.

SHA-256 временного проверочного скрипта: `09fb408b8b840d9b95f56c8ddd6d518eaf90b8fdd2a631c5a1135b02a6ad40ca`.
Это проверка Foundation, не приемка всех SC пользовательского интерфейса.

### Проверка реального server.js

Сервер запущен командой `node server.js`, без правок. Клиентские функции проверены
скриптом `/private/tmp/route-builder-phase2-live.cjs` с разрешенным localhost-доступом:

- listStops: 24 уникальные точки за один GET, включая 24/7 Pharmacy.
- createRoute: 201, id rt_2000, status draft, одна остановка; исходный текст
  с краевыми пробелами подтвержден без изменений.
- Автоматического повторного POST нет. Проверочный маршрут существует только
  в памяти этого локального mock-процесса.

### Обязательный iOS/HTTP gate T014

| Проверка | Наблюдение |
|---|---|
| Runtime | iPhone 17 Pro Max Simulator, iOS 26.0 |
| Simulator UDID | FC155EDC-25DA-4B3D-8030-F8A1DFBF7D15 |
| Expo Go | 58.0.7, установлен Expo CLI вместо прежнего 57.0.9 |
| Запуск | npx --no-install expo start --ios --lan |
| API baseUrl | http://localhost:4000 (симулятор, задан через src/config/api.ts) |
| iOS bundle | Metro: Bundled index.ts, 732 modules |
| HTTP из приложения | Экран показывает Loaded 24 unique stops |
| Gate | PASS; это наблюдение реального iOS-приложения, не curl |

[Скриншот результата T014](evidence/phase2-ios.png).

Первый запуск Metro с --localhost не дал подключения по адресу 127.0.0.1:
localhost был доступен по IPv6, IPv4-запрос к 8081 отвергался. Перезапуск с --lan
устранил проблему, после чего приложение загрузилось. Изменения app.json/ATS
не потребовались. SDK не обновлялся, несмотря на информационное предложение CLI.
Физический iPhone не проверялся; для него EXPO_PUBLIC_API_URL в конфигурации
должен указывать LAN-IP компьютера, а не localhost.

### Итоговые quality gates и границы

- `npx --no-install tsc --noEmit`: PASS, exit 0.
- `CI=1 npx --no-install expo lint`: PASS, exit 0.
- `git diff --check`: PASS.
- server.js SHA-256: `d213029e846a69065ff847e71875acbb6024122b1aa829851cf0351ae1a96abb` — исходная сумма сохранена.
- index.ts неизменен; package.json/package-lock.json не менялись в Phase 2.
- Только две штатные операции API, без дополнительных возможностей или библиотек.
- Checklists не изменялись; до старта было 16/16. Extension hooks отсутствуют.
- T001–T014 отмечены [X]; T015–T042 остаются [ ]. Полный UI и его SC еще не реализованы.

## Phase 3 — одностопный MVP, T015–T024 (2026-10-28)

### Реализованный срез

Добавлены StopRow, PackageQuantityModal, SelectionTray, InstructionCard и
RequestState; StopsScreen/InstructionsScreen подключены через состояние App.tsx.
Provider находится выше экранов, диагностический экран T014 удален. В UI доступны
выбор/замена/снятие одной точки, количество, инструкция с N/200, Clear all,
Back/Continue, создание маршрута и New route. Английский LTR, native StyleSheet,
safe area, прокрутка/клавиатура и области действий не менее 44×44.

Submit использует синхронный inFlight ref, reducer формирует frozen snapshot;
201 проверяется существующим API-клиентом. sending/unknown/success запрещают
изменения на уровне Context; навигация читает актуальную блокировку через ref.
Подтвержденный отказ сохраняет редактируемый черновик; unknown сохраняет данные,
блокирует правки и слепой повтор. Автоматической отправки/повторов нет.

Перед изменениями прочитаны SDK 58 docs и llms.txt, официальные страницы React
Native SectionList, TextInput, Modal, KeyboardAvoidingView. Установленные TypeScript
типы и runtime использованы для проверки совместимости. Источники:
https://docs.expo.dev/versions/v58.0.0/,
https://docs.expo.dev/llms.txt,
https://reactnative.dev/docs/sectionlist,
https://reactnative.dev/docs/textinput,
https://reactnative.dev/docs/modal,
https://reactnative.dev/docs/keyboardavoidingview.

### Проверки логики

- `node /private/tmp/route-builder-phase2-check.cjs`: 11 групп PASS, включая DTO,
  пагинацию, Retry-After, лимит UTF-16/emoji, сверку POST и reducer guards.
- `node /private/tmp/route-builder-phase3-check.cjs`: PASS. Временный Node/assert
  harness исполняет реальные функции Provider с заменами React hooks и транспорта;
  он проверяет синхронные callbacks, не заменяет React renderer или проверку UI.
- Пустая/пробельная инструкция: ошибка по id, 0 POST. 11 вызовов submit в одном
  кадре: 1 вызов транспорта; snapshot и исходный текст неизменны.
- Пока Promise отправки открыт, setMode/toggleStop/savePackages/setInstructions/
  clearInstructions/removeStop/newRoute не меняют черновик. После success новый
  submit блокируется; New route сбрасывает выбор/режим и сохраняет browse-кеш.
- После 422 данные сохранены, ручной повтор доступен. После timeout/unknown данные
  сохранены, правки и повтор отклоняются; нет скрытого повторного запроса.
- SHA-256 harness Phase 3:
  `7f259199ca00541c6e2a3dc9443172c0ee235c9c2c1e3a2fb11b05ae59d4cbf2`.

### T024 — фактический iOS-прогон

Среда: iPhone 17 Pro Max Simulator, iOS 26.0, Expo Go 58.0.7; Metro --lan,
SDK 58.0.16 / RN 0.88.0. Прогон выполнен через native UI automation
agent-device 0.21.33; инструмент не добавлялся в зависимости проекта.
Это runtime-приемка, а не unit-тест и не проверка на физическом iPhone.

| Проверка | Фактический результат |
|---|---|
| Справочник | Строки реального API, буквенные секции; # в конце; Continue (0 stops) disabled |
| Количество | stp_1001 / North Cafe: 1 → + → 2 → Save; карточка показывает 2× |
| Нижняя граница / Cancel | При 1 кнопка − disabled; на Almond Patisserie + → Cancel оставляет пилюлю 1 |
| Пустая инструкция | Finish показывает ошибку на карточке; счетчик 0/200; POST отсутствует |
| Back/Continue | Текст Leave at reception. и количество 2 сохраняются; счетчик 19/200 |
| Быстрые нажатия | Native runner выполнил 10 нажатий Finish с intervalMs=20; захвачен ровно 1 POST |
| sending | Snapshot: Back disabled, TextInput enabled=false, Clear all disabled; вместо Submit — Creating route… |
| Остальные sending-действия | Выбор/количество/Remove/New route недоступны на этом экране; прямые Context-вызовы заблокированы harness-проверкой выше |
| Реальный POST | /v1/routes, stops=[{stop_id: stp_1001, packages: 2, instructions: Leave at reception.}] |
| Ответ | 201, id rt_2001, status draft; stops совпадают с исходным запросом |
| success | Route created / Route ID: rt_2001; Back и редактирование заблокированы, Submit отсутствует, доступен New route |
| Новый маршрут | One stop, пустой выбор, Continue (0 stops) disabled; справочник сохранен |

Для наблюдения sending через Metro CDP временно обернут fetch **в памяти runtime
симулятора**: перед POST установлена задержка 8 секунд, сохранены запрос/ответ.
Запрос переслан исходному fetch и неизмененному server.js. После проверки исходный
fetch восстановлен. Это не production-код, proxy или изменение API-клиента.
Временные сценарии — `/private/tmp/route-builder-phase3-ui-*.json`, захват —
`/private/tmp/route-builder-phase3-cdp.cjs`; app-код не содержит инструментирования.

Артефакты: [ошибка валидации](evidence/phase3-ios-validation.png),
[sending](evidence/phase3-ios-sending.png), [успех](evidence/phase3-ios-success.png),
[новый маршрут](evidence/phase3-ios-new-route.png),
[единственный POST и подтвержденный ответ](evidence/phase3-network.json).
Последующая косметическая правка делает disabled Clear all визуально приглушенным;
ее состояние disabled уже подтверждено native snapshot приведенного прогона.

### Итог и границы Phase 3

- `npx expo lint`: PASS, exit 0; `npx tsc --noEmit`: PASS, exit 0.
- `git diff --check`: PASS.
- server.js SHA-256 прежний:
  `d213029e846a69065ff847e71875acbb6024122b1aa829851cf0351ae1a96abb`.
- index.ts, package.json/package-lock.json и server.js не изменены.
- T015–T024 отмечены [X]; T025–T042 остаются [ ]. Checklists не изменены.
- Multi-stop UI, серверный поиск в UI, расширенные действия восстановления и
  итоговая приемка всех SC остаются задачами следующих фаз. 20 прогонов SC-003,
  пять участников SC-001 и физическое устройство этим этапом не проверялись.
- Extension hooks отсутствуют; новых runtime-зависимостей нет.
- При ручной проверке на симуляторе выявлено некорректное позиционирование футера относительно нижней границы экрана. Исправлено добавлением insets.bottom через useSafeAreaInsets до фиксации MVP.