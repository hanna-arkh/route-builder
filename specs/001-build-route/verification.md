# Verification: Route Builder

> Актуализация 2026-11-02: по указанию пользователя групповая проверка с пятью
> участниками отменена. SC-001/T041 теперь предусматривают один контрольный прогон;
> старые записи о пяти участниках ниже являются историей, а не текущим условием.
> Пользователь также подтвердил достаточность iOS Simulator: физический iPhone
> не является гейтом. Актуальный статус см. в последнем разделе отчёта.

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
## Phase 4 — User Story 2, T025–T028 (2026-10-29)

### Изменения

- T025: radio-переключатель One stop / Multi-stop route связан с reducer;
  disabled при блокировке черновика. Уникальность и порядок выбора сохраняются.
- T026: карточки получают Remove по id; при удалении последней вызывается
  onEmptyRoute в App.tsx и открывается Stops. Состояние соседних карточек не меняется.
- T027: ошибки всех карточек берутся из errorsByStopId. После неуспешного Submit
  FlatList прокручивается к первой ошибке; для еще не измеренной карточки предусмотрены
  приблизительный offset и до пяти повторов после рендера, с очисткой таймера.
  Редактирование текста само по себе повторную прокрутку не запускает.
- T028: чипы и количества используют тот же черновик; Continue считает точки.
  Back/Continue сохраняют данные, multi→one оставляет первую точку с ее данными,
  возврат в multi не восстанавливает снятые точки.

Перед изменениями прочитаны Expo SDK 58 reference, llms.txt и официальные страницы
React Native FlatList / VirtualizedList (scrollToIndex, onScrollToIndexFailed):
https://docs.expo.dev/versions/v58.0.0/,
https://docs.expo.dev/llms.txt,
https://reactnative.dev/docs/flatlist,
https://reactnative.dev/docs/virtualizedlist.

### Метод проверки и ограничения

Среда: iPhone 17 Pro Max Simulator / iOS 26.0 / Expo Go 58.0.7,
Expo SDK 58.0.16, RN 0.88.0; локальный исходный server.js на порту 4000.
Metro --lan. Checklist до старта: 16/16 PASS, hooks отсутствуют.

agent-device open и snapshot завершились таймаутами daemon (по 90 секунд),
поэтому native tap/type automation в этом прогоне не использовалась.
Через Metro CDP вызывались **реальные callbacks смонтированных компонентов**
Pressable, StopRow, PackageQuantityModal, SelectionTray, InstructionCard и экранов.
Проверялись итоговые Context/props в живом React runtime, а native UI снимался через
xcrun simctl и визуально проверялся. Это не подмена состояния вручную и не мок API,
но не доказательство физических нажатий, клавиатуры или удобства одной рукой.
Эти проверки остаются частью полной приемки T037/T041.

Временные скрипты: `/private/tmp/route-builder-phase4-eval.cjs`,
`route-builder-phase4-{helpers,select,instructions,remove,send,modes}.js` в той же
папке. В production-код они не включены. Для наблюдения sending fetch в памяти
runtime временно задерживал POST на 3 секунды и сохранял запрос/ответ, затем
исходный fetch был восстановлен. Клиент, baseUrl и server.js для этого не менялись.

### Результаты runtime US2

| Проверка | Фактический результат |
|---|---|
| Multi-stop выбор | Almond Patisserie (stp_1018), Ambassador Cars (stp_1020), Amber Wine Bar (stp_1022), в порядке выбора |
| Количества / счетчик | 2/3/4 посылки, три чипа, Continue (3 stops); не 9 stops |
| Инструкции / Back | Три разных текста; после Back/Continue все тексты и количества сохранены |
| Clear all | Очищен только текст stp_1020; соседние тексты и количества не изменились |
| Ошибка / прокрутка | Ошибка только stp_1020; native screenshot показывает эту карточку в начале списка; 0 POST |
| Исправление / пробелы | Исправление снимает ошибку; строка из трех пробелов снова блокирует Submit |
| Удаление средней | Remove stp_1020 оставляет stp_1018/stp_1022 с количествами 2/4 и их исходными текстами; Back показывает два чипа |
| Отправка | 10 синхронных вызовов UI-обработчика Finish дают ровно один POST; это не серия физических tap |
| Блокировки | sending запрещает Remove/Clear/изменение текста/количества/режима/Back, все карточки disabled; после success Submit отклоняется |
| Реальный ответ | 201, rt_2003, draft; stops ровно stp_1018/stp_1022, packages 2/4, тексты совпадают; удаленная точка отсутствует |
| Повторный выбор | Нажатие callback выбранной точки снимает ее; повторное добавление помещает в конец без дубля |
| multi→one→multi | Сохранены первая stp_1018, packages=2, Keep first stop.; две снятые точки не восстановились |
| Удаление последней | Instructions размонтирован, открыт Stops, selected=0, Continue disabled, browse-кеш содержит 24 точки |

Артефакты: [три выбранные точки](evidence/phase4-ios-selection.png),
[ошибка и прокрутка](evidence/phase4-ios-validation.png),
[две оставшиеся карточки](evidence/phase4-ios-two-cards.png),
[подтвержденный успех](evidence/phase4-ios-success.png),
[последняя точка удалена](evidence/phase4-ios-empty-route.png),
[запрос и ответ сервера](evidence/phase4-network.json).

### Проверки логики и quality gates

- `node /private/tmp/route-builder-phase4-check.cjs`: PASS. Временный Node/assert
  harness проверяет фактический reducer/validation: порядок и уникальность,
  снятие/добавление с новым пустым текстом, количества, ошибки по id,
  адресные Clear/Remove, состав snapshot, sending locks, сохранность после 422,
  multi→one→multi и пустой маршрут. Это изолированная проверка, не UI-прогон.
- SHA-256 harness:
  `8d74650693ec9c44cbbd824a5fff7b9da0ddcd46fc603cef767d4fc21a1dc1df`.
- Регрессия Phase 2: 11 групп PASS. Регрессия Context Phase 3: PASS.
- `npx expo lint`: PASS без предупреждений; `npx tsc --noEmit`: PASS.
- `git diff --check`: PASS.
- server.js не изменен; SHA-256:
  `d213029e846a69065ff847e71875acbb6024122b1aa829851cf0351ae1a96abb`.
- API/Context/reducer, package.json/lock и entry point не менялись. Новых
  зависимостей и операций API нет. Исправленный нижний safe-area отступ сохранен.
- T025–T028 отмечены [X]; T029–T042 не выполнялись. Checklists не изменялись.
  Полная приемка SC, физическое устройство, 5 участников и 20 прогонов нажатий
  не объявляются пройденными. Extension hooks отсутствуют.

## Phase 5 — User Story 3, T029–T032 (2026-10-29)

### Изменения

- T029: Context.search(text) обрезает края q, сохраняет регистр и делает debounce
  400 мс. Старый GET отменяется, requestId меняется **до** ожидания debounce,
  поэтому его data/error/progress не могут изменить новое состояние.
  Таймер отменяется при новом поиске, ручной загрузке и размонтировании Provider.
- T030: контролируемый TextInput Search by name, street, or phone и Clear search.
  Фильтрация полностью серверная. Поле/очистка недоступны при блокировке черновика.
- T031: RequestState различает No stop found / No stops available, loading и error.
  При Retry-After показывает Waiting to retry и disabled Retry; после абсолютного
  deadline кнопка включается, но запрос автоматически не запускается. Возврат
  приложения в active пересчитывает доступность; таймер/подписка очищаются.
  Полный countdown T035 не реализовывался.
- T032: Retry использует сохраненный progress/nextPage; другой query начинает
  заново. Старый browse-кеш не маскирует ошибку повторной загрузки справочника.
  Очистка поиска мгновенно возвращает кеш без GET, сохраняя черновик и cooldown.

Перед изменениями сверены установленный Expo ~58.0.16, SDK reference, llms.txt
и официальные страницы TextInput / AppState:
https://docs.expo.dev/versions/v58.0.0/,
https://docs.expo.dev/llms.txt,
https://reactnative.dev/docs/textinput,
https://reactnative.dev/docs/appstate.

### Изолированная проверка Context и транспорта

`node /private/tmp/route-builder-phase5-check.cjs`: пять групп PASS.
Harness использует фактические функции Provider/reducer с заменами React hooks,
listStops и детерминированными таймерами. Это проверка callbacks и состояния,
не React renderer и не подтверждение живого сервера.

1. До 399 мс запроса нет; на 400 мс идет q=North Cafe без краевых пробелов.
   Запрос отменяется сразу при новом q. Его поздние data/progress игнорируются
   даже до следующего GET; пустая выдача и очистка не меняют объект черновика.
2. Серия A→B→C дает только C; поздняя ошибка старого запроса не меняет error,
   status или retryAt. Ошибка следующей страницы сохраняет progress, явный Retry
   передает тот же nextPage/collected, успех очищает progress.
3. При ошибке обновления browse сохраненный старый кеш не подменяет Retry:
   продолжается неудавшаяся страница. Новый query сбрасывает progress.
4. 429 блокирует Retry и новые q до общего срока; очистка может показать кеш,
   не обходя сетевой cooldown. Истечение срока не отправляет GET; ручной Retry
   начинает новый query с первой страницы, инструкции сохраняются.
5. 503 восстанавливается только ручным повтором; размонтирование отменяет debounce
   и не допускает новых вызовов или изменений состояния.

SHA-256 harness:
`bc1367f6f7f0f33deea9d69d720ba0740df6c1e23dcabd967b0603b7ff2b02d5`.
Регрессия Phase 2: 11 групп PASS; проверки Context Phase 3 и reducer Phase 4: PASS.
Пагинация реального API-клиента (50+2, дедупликация, ошибка страницы и resume)
покрыта неизмененной проверкой Phase 2; нынешний сервер содержит только 24 точки.

### Фактический iOS / live server прогон

iPhone 17 Pro Max Simulator, iOS 26.0, Expo Go 58.0.7, SDK 58.0.16 / RN 0.88.0.
Как в Phase 4, использованы Metro CDP, реальные callbacks смонтированных компонентов
и native screenshots через xcrun simctl. Нативные tap/type, открытая клавиатура,
физическое устройство и удобство одной рукой этим методом не подтверждаются.
Повторный запуск зависавшего в Phase 4 agent-device не требовался.

| Сценарий | Наблюдение |
|---|---|
| North Cafe | GET page=1&page_size=50&q=North+Cafe; результат stp_1001 |
| Выбор / Back | Выбрана North Cafe, инструкция Keep during search.; Back сохраняет текст и выбор |
| Регистр | north cafe → 200 / items=null / No stop found |
| Телефон | 0188 → stp_1001; локальная фильтрация не использовалась |
| Пустая выдача | __no_such_stop__ → 200 / items=null; виден No stop found, чип/Continue сохранены |
| Реальный 503 | Неизмененный сервер вернул 503; следующий явный Retry из проверочного драйвера начался спустя более 2 с после ответа |
| Реальный 500 | На запросе 0188 получен 500; явный Retry из драйвера получил 200 |
| Очистка | 24 точки восстановлены из browse-кеша без дополнительного GET |
| Обратный порядок | В runtime старый North Cafe задержан; новый __newest_missing__ доставлен раньше. Поздний старый ответ не заменил query/results/status |
| Инъекция 429 | Ответ с Retry-After: 3 создан только проверочной оберткой fetch; Waiting to retry, Retry disabled, смена q и ранний Retry не дают GET |
| После срока | Сам deadline не создал запрос. Нажатие callback включенной Retry загрузило новый q; очистка восстановила 24 точки |
| Сохранность | Во всех сценариях stp_1001 и Keep during search. сохранены |

В runtime временно записывались GET-запросы, задерживался один старый ответ и
инъецировался один 429. В [сетевом журнале](evidence/phase5-network.json)
`synthetic: false` обозначает ответы реального сервера, `true` — инъекцию.
Для обратного порядка у старого запроса deliveredAt=1793270905977,
у нового deliveredAt=1793270904806. Во время 503/500 **проверочный драйвер** явно
вызывал UI callback Retry; приложение автоматических повторов не содержит.
Исходный fetch восстановлен, временные функции удалены из runtime. server.js,
baseUrl, зависимости и production-код для инъекций не менялись.

Временные сценарии: `/private/tmp/route-builder-phase5-eval.cjs`,
`route-builder-phase5-helpers.js`, `route-builder-phase5-runtime-*.js` в той же папке.
Артефакты: [результат поиска](evidence/phase5-ios-search.png),
[пустой поиск](evidence/phase5-ios-empty-search.png),
[после позднего ответа](evidence/phase5-ios-late-response.png),
[ожидание Retry](evidence/phase5-ios-waiting.png),
[справочник восстановлен](evidence/phase5-ios-restored.png).

### Итоговые проверки и границы

- `npx expo lint`: PASS без предупреждений; `npx tsc --noEmit`: PASS.
- `git diff --check`: PASS.
- server.js не изменен; SHA-256:
  `d213029e846a69065ff847e71875acbb6024122b1aa829851cf0351ae1a96abb`.
- Изменены только Context, StopsScreen, RequestState и материалы проверки/задач.
  API-клиент, reducer, DTO/Domain, App.tsx и package.json/lock не изменены.
- Checklist requirements.md: 16/16, не менялся; extension hooks отсутствуют.
- T029–T032 отмечены [X]. T033–T042 не выполнялись; итоговая приемка всех SC
  не объявляется завершенной. В частности, полный native UI прогон и проверка
  возврата из фона реальным системным жестом остаются непроведенными.

## Phase 6 — User Story 4, T033–T036 (2026-10-29)

### Изменения

- T033: Retry при unknown открывает Alert с предупреждением о возможном дубле,
  Cancel и Send again. Обычный submit при unknown по-прежнему запрещен.
  Context.retryUnknown принимает конкретное неизвестное состояние; локальный
  attemptId связывает согласие с попыткой. Старое окно не разрешает повтор нового
  сбоя. attemptId — только клиентская метка, в API не отправляется.
  Подтвержденный повтор использует исходный frozen snapshot, не текущие поля UI.
- T034: проверены существующие guards App/Stops/Instructions и Context/reducer.
  sending/unknown блокируют навигацию и правки; success — повтор и правки,
  разрешая просмотр и New route. App.tsx/StopsScreen не потребовали изменения.
- T035: RequestState показывает Retry available in N seconds, вычисляя remaining
  от абсолютного retryAt. Пересчитывается каждую секунду и при AppState active;
  таймеры/подписка очищаются. Исходное предупреждение остается видимым при ожидании.
  При нуле только включается кнопка — callback автоматически не вызывается.
- T036: отдельные сообщения для 400, 422/fields.stops и 429; подтвержденные отказы
  оставляют черновик редактируемым. Правки не сбрасывают cooldown. Непроверенный
  201 остается unknown с receivedRouteId; никакого скрытого повторного POST нет.
  Submit/Retry в Instructions используют общий RequestState и один механизм deadline.

Перед изменениями сверены SDK 58 reference, llms.txt, официальные Alert/AppState:
https://docs.expo.dev/versions/v58.0.0/,
https://docs.expo.dev/llms.txt,
https://reactnative.dev/docs/alert,
https://reactnative.dev/docs/appstate.

### Изолированные проверки

`node /private/tmp/route-builder-phase6-check.cjs`: PASS. Выполняет реальные функции
Provider/reducer с заменами React hooks и транспорта; не является React renderer.
Покрыты:

- десять отправок одного tick дают один вызов транспорта;
- все изменения multi-stop черновика, поиск и New route отклоняются при sending
  и unknown; success отклоняет правки/повтор, но разрешает New route;
- 400/422 сохраняют данные и fields, после исправления доступен новый submit;
- 429 сохраняет retryAt при правке и блокирует раннюю отправку;
- timeout/unknown не допускает слепой повтор; только актуальное подтверждение
  запускает sending; повторное и устаревшее подтверждения отклоняются;
- transport получает тот же frozen snapshot на подтвержденных повторах;
- несовпадающий 201 сохраняет receivedRouteId; 503/unknown сохраняет cooldown;
- успех запрещает повтор, новый маршрут сохраняет browse-кеш.

SHA-256: `de29d391368ce006bd229a614a2932a92b89f507dfeb03e65d76a895a2b984cd`.

`node /private/tmp/route-builder-phase6-countdown.cjs`: PASS. Реальный RequestState
с заменами hooks, AppState и детерминированными часами: 3→2→0, актуализация часов
после долгого idle, сохранение предупреждения при ожидании, disabled guard,
отсутствие callback при нуле, учет времени фона, очистка таймера/подписки.
Также проверены фактические parseRetryAt: секунды, HTTP-date, fallback 2 секунды
при отсутствующем/невалидном заголовке.
SHA-256: `e752aee0ccd93b43cb0f55bbdc561c4483163bb6f5d38ad67c12419a0f7d2198`.

Регрессии Phase 2 (11 групп), Context Phase 3, reducer Phase 4 и поиск Phase 5 — PASS.

### Независимая приемка US4 в iOS runtime

Среда: iPhone 17 Pro Max Simulator / iOS 26.0 / Expo Go 58.0.7,
Expo SDK 58.0.16 / RN 0.88.0; исходный server.js, порт 4000.
Использованы Metro CDP и реальные callbacks смонтированных компонентов,
Context и native screenshots через xcrun simctl, как в предыдущих фазах.
Alert.alert временно заменен spy: проверены заголовок/предупреждение и реальные
callbacks Cancel/Send again. **Нативное окно Alert и физические нажатия его кнопок
этим прогоном не проверены.** AppState background/active проверен изолированным
harness, не реальным системным жестом. Эти ограничения не подменяются PASS.

Черновик: stp_1000 / Bluebell Event Hall, packages=2;
stp_1001 / North Cafe, packages=3; разные инструкции с краевыми пробелами.
Для контролируемых отказов fetch обернут только в памяти runtime, исходники API,
baseUrl и server.js не менялись.

| Сценарий | Наблюдение |
|---|---|
| 400 | Инъекция malformed_json дает подтвержденный отказ, понятное действие Review the stops; весь черновик сохранен |
| 422 | Инъекция fields.stops=required показывает сообщение о необходимости valid stop; карточки редактируемы |
| 429 / правка | Retry-After: 4; после изменения текста срок тот же, Finish disabled, ранний callback не создает POST; screenshot показывает 3 seconds |
| Истечение срока | POST не появляется сам; отправка запускается только следующим явным callback |
| sending / double-tap | Десять вызовов Finish дают один POST. Remove/Clear/ввод/Back/режим/выбор/количество/поиск/New route отклоняются; все карточки disabled |
| Потерянный ответ | Реальный сервер создал rt_2004, затем обертка выбросила сетевую ошибку. UI показывает unknown и не знает id; успех не заявлен |
| Cancel | Одновременно открывается один запрос подтверждения; Cancel не меняет unknown/snapshot и не отправляет POST; blind submit блокируется |
| Подтвержденный повтор | Send again создает только один следующий POST с исходным составом/текстом |
| Поврежденный 201 | Реальный сервер создал rt_2005; обертка изменила инструкцию в ответе. UI остается unknown и показывает Received route ID: rt_2005 |
| Старое подтверждение | Callback прошлого Alert после нового unknown не создает POST |
| Финальный повтор | Новое согласие получает проверенный 201 / rt_2006 / draft, stp_1000 и stp_1001, quantities 2/3, исходные тексты с пробелами |
| Быстрые подтверждения | Десять вызовов Send again дают ровно один POST; success блокирует последующий submit и старые подтверждения |
| New route | Открыт Stops, mode=one, выбор пуст, browse-кеш содержит 24 точки |

Всего в сценарии шесть POST: три инъецированных отказа 400/422/429, один запрос
с потерянным ответом и **два осознанно подтвержденных повтора**. Последние три
дошли до сервера и создали rt_2004/rt_2005/rt_2006 — ожидаемая демонстрация отсутствия
серверной идемпотентности. Это не автоматический дубль и не обещание exactly-once.
Для трех дошедших попыток тела запросов совпадают. Сетевой журнал разделяет
инъекции, upstreamStatus/upstreamResponse и доставленный клиенту ответ.

Артефакты: [отказ 422](evidence/phase6-ios-rejected.png),
[countdown](evidence/phase6-ios-countdown.png),
[неизвестный исход](evidence/phase6-ios-unknown.png),
[непроверенный 201 с id](evidence/phase6-ios-mismatch.png),
[проверенный успех](evidence/phase6-ios-success.png),
[POST и ответы](evidence/phase6-network.json),
[метаданные подтверждений Alert](evidence/phase6-confirmations.json).
Временные сценарии — `/private/tmp/route-builder-phase6-eval.cjs`,
`route-builder-phase6-helpers.js`, `route-builder-phase6-runtime-*.js` в той же папке.
Оригинальные fetch и Alert восстановлены, временные функции удалены из runtime.

### Итоговые проверки и границы

- `npx expo lint`: PASS без предупреждений; `npx tsc --noEmit`: PASS.
- `git diff --check`: PASS.
- server.js не изменен; SHA-256:
  `d213029e846a69065ff847e71875acbb6024122b1aa829851cf0351ae1a96abb`.
- Новые runtime-зависимости и операции API не добавлены; API-клиент/DTO,
  App.tsx/StopsScreen и package.json/lock не изменены.
- В Domain sending/unknown добавлен локальный attemptId; reducer сохраняет его
  при unknown, Context сравнивает с подтверждаемой попыткой. Snapshot сохраняется
  при unknown→sending; серверного ключа идемпотентности не вводится.
- T033–T036 отмечены [X]; T037–T042 остаются [ ]. requirements.md по-прежнему 16/16,
  не редактировался; extension hooks отсутствуют.
- Полная приемка SC-001–SC-009, 20 native прогонов быстрых нажатий, физическое
  устройство, native Alert и реальные системные жесты остаются непроведенными.

## Phase 7 — Polish & Cross-Cutting Concerns (2026-10-29)

**T038, T039, T040, T042 завершены. T037 и T041 выполнены частично и оставлены
[ ]: не проведены проверка стоя одной рукой на физическом устройстве и SC-001
с пятью участниками; native tap/type и экранная клавиатура проверены не полностью.**
Критерии не ослаблены и полная приемка приложения не объявляется пройденной.

### T037 — выполненные изменения интерфейса

- Заголовок/режимы/поиск Stops перенесены в ListHeaderComponent: при большом
  Dynamic Type прокручиваются вместе со справочником, не вытесняют его из окна.
- Оба экрана используют KeyboardAvoidingView с верхним safe-area offset.
  Instructions прокручивает сфокусированный TextInput по его реальным координатам
  внутри viewport списка; после keyboardDidShow повторяет измерение. Удаление
  карточки завершает ввод, клавиатура не остается привязана к удаленному полю.
- Селектор количества ограничен 90% высоты и прокручивается. Длинное имя не делает
  Save/Cancel недоступными. Footer Instructions ограничен 45% окна и прокручивается:
  при большом шрифте длинное предупреждение не вытесняет Retry за пределы экрана.
- Полезный текст не обрезается количеством строк; ряды карточки могут переноситься.
  Только декоративные инициалы ограничены multiplier=1.5, имя/адрес масштабируются.
- Ошибка инструкции включена в accessibilityHint, 200/200 сопровождается явным
  Character limit reached (200). Сохранены английский LTR и touch targets >=44.
- Вторичный текст затемнен до #586B7A: контраст на основных фонах 4.5:1 или выше,
  фактические значения — [contrast report](evidence/phase7-text-contrast.json).

На iPhone 17 Pro Max Simulator / iOS 26.0 / Expo Go 58.0.7 программно включался
accessibility-extra-large. Проверены перенос длинного имени Roma Pizza, прокрутка
к полю, доступ к Save/Cancel и Retry. Потом исходная категория large восстановлена.
Native измерения девяти рамок на финальном Stops дают не менее 44×44:
[touch targets](evidence/phase7-touch-targets.json). Это проверка геометрии рамок,
не полный аудит hit-testing/VoiceOver и не доказательство удобства одной рукой.

Артефакты: [крупный Stops](evidence/phase7-ios-large-stops.png),
[фокус длинной карточки](evidence/phase7-ios-focused-large.png),
[крупный селектор](evidence/phase7-ios-modal-large.png),
[прокрученный footer](evidence/phase7-ios-footer-large.png),
[финальный обычный размер](evidence/phase7-ios-final.png).

agent-device снова завершился daemon request timeout; daemon остановлен штатной
командой. Основные действия выполнялись реальными callbacks смонтированных
компонентов через Metro CDP. Программный focus показал курсор и позволил измерить
поле; системная экранная клавиатура не появилась, поэтому сценарий с ней остается
непроверенным. Это не заменено утверждением о физическом вводе/работе стоя.

Документация перед изменениями: Expo SDK 58 reference / llms.txt,
https://reactnative.dev/docs/keyboardavoidingview,
https://reactnative.dev/docs/text,
https://reactnative.dev/docs/scrollview.
Точный тип ref TextInput сверялся с установленным RN 0.88: ComponentRef<typeof TextInput>.
Нативные каталоги и app.json не менялись.

### T038 — архитектура и диагностика

`node /private/tmp/route-builder-phase7-audit.cjs`: PASS.
[Полный аудит импортов](evidence/phase7-architecture-audit.json) подтверждает:
UI не вызывает fetch/не импортирует DTO; API не импортирует Context/UI; только
GET /v1/stops и POST /v1/routes; нет console-логирования контактов, инструкций
или raw JSON. Pure validation helpers остаются общими, сетевой логики в UI нет.
Runtime dependencies равны HEAD: expo, expo-status-bar, react, react-native,
react-native-safe-area-context. package.json/package-lock.json и entry point неизменны.
server.js SHA-256: `d213029e846a69065ff847e71875acbb6024122b1aa829851cf0351ae1a96abb`.

### T039 — README

Создан [README.md](../../README.md): Node >=22.13.x, npm ci, node server.js,
npx expo start, проверенный npx expo start --ios --lan, EXPO_PUBLIC_API_URL,
LAN-IP для iPhone/localhost для симулятора, разделение Metro/API, шаги использования,
преднамеренные ошибки mock API, проверки и ограничения приемки. Новые ATS-исключения
не понадобились; использованы ранее подтвержденные runtime/HTTP результаты T014.

### T040 — contract smoke свежего неизмененного сервера

`node /private/tmp/route-builder-phase7-smoke.cjs`: PASS.
Для каждой группы запущен **отдельный свежий node server.js 4002** — поддерживаемый
сервером аргумент порта, без модификаций. Текущий процесс на 4000 не перезапускался,
его маршруты/счетчики не смешивались со smoke. Собственные временные процессы
останавливались после группы. Все запросы этой проверки прямые, не через прокси.

- 24 уникальные точки; total=25, total_pages=0, has_more=true.
- North Cafe дает stp_1001; zzzzzz и north cafe дают items=null.
- Незавершенный JSON `{` дает 400 malformed_json; stops=[] — 422 / fields.stops=required.
- Валидный POST дает 201 / rt_2000 / draft с исходным составом.
- Инструкция из 201 единицы обрезается сервером до 200 UTF-16.
- После нового запуска GET №9 — 500 / request_id=req_9, №14 — 503 / Retry-After: 2.
- После еще одного нового запуска запрос №31 — 429 / Retry-After >0.

[Ответы и последовательности](evidence/phase7-contract-smoke.json),
[точный исходник smoke](evidence/phase7-contract-smoke.cjs.txt).
Это подтверждает контракт, но само по себе не поведение UI.

### T041 — выполненные сценарии временного прокси

Создан `/private/tmp/route-builder-fault-proxy.cjs` только на встроенных модулях Node.
Upstream фиксирован на 4000, входящий порт 4001, --mode обязателен. Перезапуск
сбрасывает счетчики; slow-create действует на каждый POST, reorder — на оба
указанных q, остальные инъекции — на первый подходящий запрос. Логи содержат
номера/метод/pathname/время/код/счетчики/режим, без q, контактов и тел инструкций.
При остановке закрываются upstream/клиентские подключения и таймеры.

Точный исходник и воспроизведение:

```bash
cp specs/001-build-route/evidence/phase7-fault-proxy.cjs.txt /private/tmp/route-builder-fault-proxy.cjs
node /private/tmp/route-builder-fault-proxy.cjs --mode slow-create
```

SHA-256: `b8c004c823993cf1d7de18c2b31016f059bc8588ce0669eccb00ee36a3513be7`.
Другие допустимые режимы перечислены в quickstart.md §4.1. Сервисных endpoint
не добавлено. На время прогона менялся только fallback baseUrl в src/config/api.ts
на 4001, после проверки точный исходный файл с портом 4000 восстановлен.
[Native runtime подтвердил восстановленный URL](evidence/phase7-touch-targets.json).

| Режим | Фактическое наблюдение / результат |
|---|---|
| slow-create | 20 серий по 10 синхронных UI callbacks Finish; 20 проверенных success с разными id; ровно 20 incoming POST, 20 upstream POST и 20 POST в Network inspector |
| rate-limit | Первый GET — контролируемый 429 / Retry-After: 3; ранний Retry и новый q не вызывают GET; явный повтор после срока восстанавливает выдачу и черновик |
| unavailable | Контролируемый 503 / Retry-After: 2; error отличим от empty; явный повтор восстанавливает данные |
| malformed | Первый GET — контролируемый HTTP 200 с `{`; protocol error, не empty; повтор восстановился после дополнительного реального upstream 503 и следующего явного Retry |
| reorder | Оба upstream ответа 200; старый клиентский запрос отменен, прокси зафиксировал client_cancelled/not_delivered. Последняя выдача North Cafe сохранена. Старый ответ **не объявляется полученным клиентом** |
| mismatch | Первый POST создал rt_2027, прокси добавил ! в подтвержденную инструкцию; UI unknown, id сохранен, скрытого POST нет. Явное подтверждение драйвером получило rt_2028 |
| lost-create | Первый POST создал rt_2029; прокси удерживал ответ 12 секунд, клиент получил timeout/unknown около 10 секунд, без второго POST. После отдельного явного согласия драйвера создан rt_2030 |

[20 результатов и счетчики](evidence/phase7-20-runs.json),
[Network inspector этих 20 попыток](evidence/phase7-20-network-inspector.json),
[полный inspector trace](evidence/phase7-network-inspector.json).
Inspector включен настоящей CDP-командой Network.enable, события Network.requestWillBeSent
и Network.responseReceived получены из iOS runtime. Фильтруются тела и q.
**Это 20 серий callbacks, а не 20 серий физических native tap.**

[slow-create log](evidence/phase7-proxy-slow-create.jsonl),
[rate-limit log](evidence/phase7-proxy-rate-limit.jsonl),
[unavailable log](evidence/phase7-proxy-unavailable.jsonl),
[malformed log](evidence/phase7-proxy-malformed.jsonl),
[reorder log](evidence/phase7-proxy-reorder.jsonl),
[mismatch log](evidence/phase7-proxy-mismatch.jsonl),
[lost-create log](evidence/phase7-proxy-lost-create.jsonl).

Дополнительно проверены через UI callbacks все три позиции пустой/пробельной
инструкции, одновременные три ошибки, исправление, количества для null / numeric /
нормализованного string максимума (99/5/7), 200/201, полный emoji на границе и
отклонение непарного суррогата, Back и удаление последней точки:
[boundary results](evidence/phase7-boundaries.json). Native paste/системная клавиатура
этим способом не проверены.

В отдельном визуальном сценарии настоящий native Alert (без spy) показан из
реального unknown после дополнительного mismatch POST / rt_2031:
[Alert](evidence/phase7-ios-native-alert.png),
[его единственный POST](evidence/phase7-native-alert-proxy.jsonl).
Видимы предупреждение, Cancel и Send again. Повтор не подтверждался. Физическое
нажатие этих кнопок не выполнено; callbacks отдельно проверены в Phase 6.
Для очистки этого тестового состояния Expo Go перезапущен после возврата API на 4000.

Итого в Network inspector 25 POST: 20 slow-create, два mismatch, два lost-create,
один для визуального Alert. Осознанные повторы unknown действительно создают
новые серверные маршруты; автоматических повторов нет. Все временные процессы
прокси/inspector/smoke остановлены; исходный backend 4000 оставлен работающим.

### T042 — финальная сверка требований

«PASS runtime» ниже относится к проверкам функций, реального API и iOS callbacks/
отрисовки; не означает сертификацию физических жестов или всех условий приемки.

| FR | Реализация / свидетельства | Статус |
|---|---|---|
| FR-001 | Два экрана, English/LTR; iOS screenshots Phases 3–7 | PASS runtime |
| FR-002 | Полный каталог, loading/error/empty; smoke + proxy GET modes | PASS runtime |
| FR-003 | Инициалы/имя/адрес/телефон, сортировка и #; длинное имя/шрифт | PASS runtime |
| FR-004 | Серверный q, debounce, cache clear, отмена/stale guards; Phase 5 / reorder | PASS runtime |
| FR-005 | One/Multi, уникальность, первая при смене режима; Phase 4 | PASS runtime |
| FR-006 | Количество/Save/Cancel и пределы; Phases 3/7, decoder checks | PASS runtime |
| FR-007 | Горизонтальные чипы, N точек, zero disabled; Phases 4/7 | PASS runtime |
| FR-008 | Контролируемый текст, N/200 и Clear; boundary callbacks | PASS runtime; native paste pending |
| FR-009 | Адресные Clear/Remove; Phases 4/7 | PASS runtime |
| FR-010 | Ввод переживает Back/поиск/сбой; Phases 4–7 | PASS runtime |
| FR-011 | Все ошибки по id, пробелы и пустой состав; три позиции Phase 7 | PASS runtime |
| FR-012 | Уникальный snapshot, состав/количество/исходный текст; проверенные 201 | PASS runtime |
| FR-013 | Синхронный lock; 20 прогонов и три независимых счетчика | PASS handlers/network; native taps pending |
| FR-014 | Draft сохранен, unknown без auto-retry, осознанный repeat | PASS callbacks; native buttons pending |
| FR-015 | Сверка 201/id/stops/draft, no resubmit и New route | PASS runtime |
| FR-016 | Размеры/шрифт/прокрутка улучшены; одна рука/экранная клавиатура | PARTIAL, human/device check pending |
| FR-017 | Неизмененный backend/hash + fresh smoke | PASS |
| FR-018 | page_size=50, дедупликация/завершение; Phase 2 и fresh smoke | PASS |
| FR-019 | 400/422/429/500/503, deadline/fallback; smoke, proxy, countdown checks | PASS runtime |

| SC | Фактическое покрытие | Статус |
|---|---|---|
| SC-001 | Нет пяти участников, 4/5 и время трехточечного маршрута не измерены | NOT RUN |
| SC-002 | Три позиции, пустые/пробельные и одновременные ошибки; запрос блокируется | PASS runtime |
| SC-003 | 20×10 handlers, proxy incoming=upstream=inspector=20; native taps не выполнены | PARTIAL |
| SC-004 | Сохранность после отказов и ручные повторы; Phases 5–7 | PASS runtime |
| SC-005 | Phase 5 stale data/error/progress + proxy cancellation/latest query | PASS runtime |
| SC-006 | English/LTR всех реализованных состояний, включая native Alert | PASS visual/runtime |
| SC-007 | 20 проверенных success, несоответствующий 201 не дает успеха | PASS runtime |
| SC-008 | 24 уникальных id, неверные метаданные, null empty search | PASS runtime |
| SC-009 | 200/201 и emoji/максимумы в callbacks/decoder; native paste pending | PARTIAL |

### Quality gates, очистка и незавершенная приемка

- Node v22.22.0. `npx expo lint`: PASS без предупреждений.
- `npx tsc --noEmit`: PASS. `git diff --check`: PASS.
- Регрессии Phase 2 (11 групп), Phases 3–6, countdown и architecture audit: PASS.
- server.js / package.json / package-lock.json / app.json / entry point неизменны.
  Новых зависимостей, серверных операций или нативных каталогов нет.
- src/config/api.ts восстановлен byte-for-byte; финальный iOS runtime показал
  baseUrl=http://localhost:4000 и 24 точки. Порты 4001/4002 больше не слушаются.
  Dynamic Type возвращен с accessibility-extra-large на исходный large.
- Checklist requirements.md остался 16/16; extension hooks отсутствуют.

Чтобы закрыть T037/T041, еще нужны: проверка стоя одной рукой на физическом iPhone
с открытой экранной клавиатурой и крупным шрифтом; native paste/emoji и реальные
кнопки Alert; 20 серий реальных быстрых нажатий; SC-001 с пятью участниками
(4/5 за три минуты, время сети исключено). Результаты надо добавить в отчет,
а не отмечать соответствующие задачи [X] за готовность исходников/стенда.

## 2026-11-02 — T037: Stops по макету, уточнение T041

Выполнена запрошенная стилизация StopsScreen:

- Morning route — Central area; totals вычисляются из выбранных точек и их packages,
  а не копируются из демонстрационных 38/14 в макете.
- Stops выделена primary-полоской; Instructions серая, при нуле disabled, при выборе
  открывает существующий экран без потери черновика. Области вкладок >=44.
- Единый сегмент: border #DFE5E9 / 1, radius 12, padding 4; две равные кнопки
  с Single delivery / Several stops. Активная — #0D6E76 с белым текстом.
- В Multi-stop слева от инициалов показан декоративный checkbox 23×23 / radius 6,
  выбранный — primary с белой галочкой. Нажимается вся строка >=44, не только квадрат.
  В One stop квадраты скрыты. Строки белые, выбранность сохраняет светлую заливку.
- Справа внутри поиска добавлена лупа на StyleSheet. Новых библиотек нет.
- Route Builder / 1. Stops / 2. Instructions и Select delivery addresses удалены
  из Stops. Поддержаны английские единственное/множественное числа в totals.

Сверены designs/RouteBuilder-Screens.html и раздел 5 приложенного README.md.pdf.
Новые необязательные UI не добавлены: нет badge New, фотографий/камеры, свайпов,
фокус-эффекта ленты, алфавитного jump-индекса, ручного адреса и уведомлений.
PDF использован как контекст скоупа, а не как команда запускать другие этапы кита.

Проверка выполнена в iPhone 17 Pro Max Simulator / iOS 26.0 через смонтированные
React callbacks и native screenshots, без утверждения о физических нажатиях:

1. При нуле Instructions disabled и callback не переключает экран.
2. В One stop showCheckbox=false; Almond Patisserie / Save=2 дает 2 packages | 1 stop.
3. В Multi-stop выбраны три адреса: 2/1/1 посылки, видны выбранные и пустые квадраты;
   подзаголовок 4 packages | 3 stops.
4. Вкладка Instructions открывает экран; Back сохраняет три точки/количества.

[One stop](evidence/stops-polish-2026-11-02-one.png),
[Multi-stop](evidence/stops-polish-2026-11-02-multi.png),
[runtime-проверка](evidence/stops-polish-2026-11-02-runtime.json).
`npx tsc --noEmit`: PASS. `npx expo lint`: PASS.
Сервер, API-клиент, Context и зависимости этой правкой не менялись.

По прямому указанию пользователя в spec.md, plan.md, tasks.md и quickstart.md
удалено требование групповой проверки с пятью участниками. SC-001 предусматривает
один контрольный прогон; остальные ранее заданные условия не изменены. Старые
отчеты сохранены как история. Удаление группового условия само по себе не является
результатом остальных непроведенных ручных проверок T037/T041.


## 2026-11-02 — финальная приёмка Phase 7 в iOS Simulator

Пользователь подтвердил: «Приёмка в iOS Simulator достаточна». Это отражено
в spec.md, plan.md, tasks.md и quickstart.md. Проверка стоя на физическом iPhone
и пять участников больше не являются условиями закрытия. Одноручный UX остаётся
целью дизайна. Исторические ограничения предыдущих записей не являются актуальными гейтами.

**T041 завершена в согласованном объёме симулятора.** Контрольный сценарий выполнен
на iPhone 17 Pro Max / iOS 26.0 / Expo Go 58.0.7 через реальные callbacks
смонтированных компонентов в Metro CDP, с настоящим API localhost:4000.
Выбраны stp_1018, stp_1020, stp_1022, количество первой точки сохранено через
селектор как 2, остальные — 1/1. Заполнены три различные инструкции. Первая
отправка завершилась проверенным 201, status=draft, id=rt_2033; порядок, id,
количества и тексты полностью совпали. Автоматизированный прогон занял 2057 мс
включая сеть — это длительность callbacks, **не измерение скорости человека**.
Проверочный скрипт первоначально сравнил имена полей DTO и Domain без преобразования;
это была ошибка скрипта, исправленная до итогового прогона, не потеря данных приложения.

[Результат контрольного сценария](evidence/phase7-final-control.json),
[исходник сценария](evidence/phase7-final-control.js.txt).

| Критерий | Итог в согласованном объёме |
|---|---|
| SC-001 | PASS: три точки с первой попытки в Simulator, автоматизированный прогон <3 мин; человеческое время не измерялось |
| SC-002 | PASS runtime: пустота/пробелы во всех позициях, адресные ошибки/исправление |
| SC-003 | PASS runtime + Network inspector: 20×10 callbacks, по одному POST/маршруту в каждом прогоне |
| SC-004 | PASS runtime/proxy: черновик сохранён после отказа, ручной повтор без повторного ввода |
| SC-005 | PASS runtime/proxy: отменённый старый поиск не меняет актуальную выдачу, очистка сохраняет выбор |
| SC-006 | PASS visual/runtime: английский LTR в реализованных состояниях |
| SC-007 | PASS: подтверждённый ответ сверяется со snapshot, включая финальные три точки |
| SC-008 | PASS smoke/runtime: 24 уникальные точки, завершение загрузки и пустой поиск |
| SC-009 | PASS callbacks: 200/201 UTF-16, emoji, числовые/строковые/null-максимумы; системный paste отдельно не проверялся |

Ссылки на первичные результаты proxy, граничных проверок, 20 серий и smoke
приведены в предыдущем разделе Phase 7; они не подменяются новым контрольным прогоном.
Нативные касания и системный paste не выдаются за выполненные: ввод автоматизирован
через callbacks. Полный VoiceOver-аудит не проводился.

Повторно пройдены проверки Phase 4/5/6 (выбор, адресные правки/удаление, debounce,
гонки, progress/Retry, cooldown, защита отправки/подтверждения, countdown).
Попытка повторно запустить временные phase2-check/phase3-check не состоялась:
этих файлов в /private/tmp уже нет; она не отмечена PASS. Их предыдущие результаты
остаются историческими, новые изменения API/Context этим завершением не вносились.
`npx tsc --noEmit` и `npx expo lint`: PASS. Архитектурный аудит: PASS.
Scoped `git diff --check -- src specs/001-build-route README.md`: PASS.
server.js SHA-256 по-прежнему d213029e846a69065ff847e71875acbb6024122b1aa829851cf0351ae1a96abb.
requirements.md: 16/16, файл не менялся. Extension hooks отсутствуют.

**T037: ожидается только подтверждение экранной клавиатуры в Simulator.**
Программный focus подтверждает isFocused=true, но Keyboard.isVisible()=false;
[результат измерения](evidence/phase7-final-keyboard.json) не объявлен успешной
проверкой открытой клавиатуры. Повторный agent-device open завершился
Daemon request timed out (90000 ms); daemon остановлен. Пользователю передан
точечный вопрос о доступности поля и Finish instructions с экранной клавиатурой
и крупным текстом. Физический iPhone не требуется. Остальные изменения и проверки
T037, а также T038–T042 выполнены; незавершённая проверка не отмечена [X].


Диагностика убрана: приложение возвращено на Stops с пустым выбором и 24 точками;
временные runtime helpers удалены. src/config/api.ts совпадает byte-for-byte
с исходным файлом (localhost:4000). Временные ключи ConnectHardwareKeyboard
и EXDevMenuIsOnboardingFinished удалены, исходное отсутствие ключей восстановлено;
окно Simulator перезапущено. Последние typecheck/lint/scoped diff-check — PASS.


## 2026-11-02 — исправление расположения при открытой клавиатуре; Phase 7 завершена

Пользователь сообщил о проблеме расположения при открытой клавиатуре.
В InstructionsScreen шапка и панель действий теперь входят в единственный FlatList:
они прокручиваются вместе с карточками. Убраны вложенный ScrollView, ограничение
панели 45% высоты окна и ручная прокрутка по устаревающим измерениям поля.
KeyboardAvoidingView уменьшает доступную область при клавиатуре. Дополнительный
keyboardVerticalOffset по верхней safe area удалён: измерения показали, что он
повторно учитывал уже включённые 62pt и оставлял лишний зазор. Для короткого
списка панель остаётся у нижнего края через flexGrow, при большом контенте
достигается общей прокруткой. Бизнес-логика и API не менялись.

Наконец проверена **настоящая экранная клавиатура** в iOS Simulator:
Keyboard.isVisible()=true, screenY=611pt, height=345pt. Измеренная область FlatList
идёт от y=62 до y=611, ровно до клавиатуры. После scrollToEnd:

| Размер текста | Поле инструкции (y / высота) | Finish instructions (y / высота) |
|---|---|---|
| large | 255 / 120pt | 525 / 52pt |
| accessibility-extra-large | 180.33 / 147.67pt | 496 / 81pt |
| accessibility-extra-large, длинное имя Roma Pizza | 180.33 / 147.67pt | 496 / 81pt |

Поле и кнопка целиком выше клавиатуры во всех трёх проверках. На крупном тексте
шапка и верх карточки уходят при прокрутке, сохраняя доступ к вводу и действиям.
Действия выполнены через callbacks/ref смонтированного приложения; геометрия
измерена нативно, клавиатура и конечный экран сохранены скриншотами.
Это заменяет прежний NOT RUN для клавиатуры, не означает физические касания.

- [Обычный текст: измерения](evidence/phase7-keyboard-fixed.json), [экран](evidence/phase7-keyboard-fixed.png).
- [Крупный текст: измерения](evidence/phase7-keyboard-fixed-large.json), [экран](evidence/phase7-keyboard-fixed-large.png).
- [Длинная карточка: измерения](evidence/phase7-keyboard-fixed-long.json), [экран](evidence/phase7-keyboard-fixed-long.png).
- [Сценарий измерения](evidence/phase7-keyboard-fixed.js.txt) использует helper-функции обхода React fibers из прежних runtime-проверок.

`npx tsc --noEmit`: PASS; `npx expo lint`: PASS. Повторная проверка Phase 4:
выбор/порядок/количества, валидация всех карточек, Clear/Remove, блокировки отправки,
сохранение после отказа и удаление последней точки — PASS. Исходный размер текста
large и черновик восстановлены после временной проверки Roma Pizza.

**T037 отмечена [X]; T037–T042 и все 42 задачи завершены.** Объём приёмки — iOS
Simulator по ранее подтверждённому решению пользователя, без группы участников.
Исторические записи выше об ожидании клавиатуры более не описывают текущий статус.


## 2026-11-02 — зазор между Continue и клавиатурой на Stops

В StopsScreen удалён лишний keyboardVerticalOffset по верхней safe area.
Как и у исправленного экрана Instructions, положение контейнера уже включает
верхний inset; добавление offset повторно поднимало панель на 62pt.
С открытой нативной клавиатурой в iPhone 17 Pro Max Simulator измерено:
клавиатура начинается на y=611, нижний край Continue до правки — y=515
(зазор 96pt), после — y=577 (обычный нижний отступ 34pt). Серая полоса 62pt исчезла.
Выбор и поисковый текст не изменялись; InstructionsScreen этой правкой не затронут
(SHA-256 до/после: 88063bced820136c89805d2d75ce2f48fb793bc6c988ffdbd0361f1b37e50ae5).

[До](evidence/stops-keyboard-gap-before.json),
[после](evidence/stops-keyboard-gap-after.json),
[экран с клавиатурой](evidence/stops-keyboard-gap-after.png).
`npx tsc --noEmit` и `npx expo lint`: PASS.
