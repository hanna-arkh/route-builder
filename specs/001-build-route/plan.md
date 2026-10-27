# Implementation Plan: Route Builder — обязательное ядро

**Branch**: `001-build-route` | **Date**: 2026-10-27 | **Spec**: [spec.md](spec.md)

**Input**: specs/001-build-route/spec.md и уточнение пользователя от 2026-10-27.

## Summary

Два экрана iPhone-приложения: Stops для выбора остановок/количества и Instructions
для обязательных инструкций и создания маршрута. Английский LTR, работа одной рукой.
Архитектура: native fetch → декодирование DTO/Domain → Context/useReducer → screens
→ UI-компоненты на StyleSheet. App.tsx переключает два экрана через состояние.
Успех — проверенный HTTP 201 с идентификатором и совпадающим составом маршрута.

План ограничен текущим ядром [spec.md](spec.md); обновленная спецификация заменяет
прежние условия завершения. Обоснование сокращения скоупа — [research.md](research.md).
В этом этапе создаются документы, не исходники или задачи реализации.

## Technical Context

**Language/Version**: TypeScript ~6.0.3, strict=true; React 19.3.0.

**Primary Dependencies**: Expo ~58.0.16, React Native 0.88.0, expo-status-bar ~58.0.3
из package.json; native fetch, Context/useReducer, стандартный StyleSheet.
При реализации добавить только react-native-safe-area-context через expo install
(совместимая рекомендация SDK58: ~5.10.1). Без новой библиотеки навигации/состояния.

**Storage**: Память Provider: кеш справочника, выбор, инструкции, результат отправки.
Нет дисковой персистентности или изменения серверной схемы.

**Testing**: expo lint + tsc --noEmit; curl smoke реального локального сервера,
ручные сценарии iOS и счет отправленных POST через development Network inspector.
Новая инфраструктура автоматических тестов не входит в обязательный результат.
ESLint/config отсутствуют: настроить в первой фазе реализации до final quality gate.

**Target Platform**: iOS, iPhone portrait; Expo Go совместимой с SDK58 версии,
реальная версия iOS и устройство фиксируются в отчете приемки. Симулятор допустим
для проверки при отсутствии устройства и явно отмечается в отчете.
Node для Expo — >=22.13.x; Node18+ из серверного README недостаточно для всей toolchain.

**Project Type**: Mobile application, клиент существующего локального API.

**Performance Goals**: Один GET для текущего полного справочника (24 точки);
поиск после 400 мс без ввода, без показа устаревших ответов; состояние sending
видно при первом обновлении UI, интеракции не ждут синхронной сетевой работы.
Один запрос ограничен 10 секундами; cooldown соблюдает серверный Retry-After.
Оценка сценария: SC-001 — 4/5 участников укладываются в 3 минуты без ожидания сети.

**Constraints**: Только GET /v1/stops и POST /v1/routes. 30 запросов/минутное окно/IP.
Инструкции <=200 UTF-16, целые посылки >=1 с учетом packages_max, без дублей id.
POST автоматически не повторяется; double-tap блокируется синхронно.
Проверка одной ОС не является обещанием протестированной второй платформы.

**Scale/Scope**: 2 экрана, 24 точки исходного mock-набора, один активный черновик,
19 требований FR-001–FR-019 и 9 критериев SC-001–SC-009.

## Constitution Check

*GATE: Выполняется перед исследованием и повторяется после проектирования.*

| Правило | До Phase 0 | После Phase 1 design | Доказательство |
|---|---|---|---|
| I. Только клиент, сервер неизменен | PASS | PASS | Два существующих endpoint, нет серверных задач |
| II. Сервер первичен | PASS | PASS | 200 UTF-16, null, неверные метаданные, регистр и Retry-After описаны в contracts/api.md |
| III. Разделение слоев | PASS | PASS | config/types/api/context/screens/components, UI без fetch |
| IV. Одноручный UX и надежность | PASS | PASS | 44×44, empty/error/loading, обязательные инструкции, lock и snapshot |
| Навигация без обязательной миграции | PASS | PASS | Явная инструкция пользователя + действующая конституция разрешают состояние App.tsx |
| Проверки качества | PASS (как план) | PASS (как план) | Lint setup в Phase 1; фактическое прохождение не подменяется планом |

Противоречие старой записи AGENTS.md об обязательном Expo Router разрешено
прямым указанием пользователя и действующей конституцией. Файл AGENTS.md
в рамках планирования не изменяется. Неоправданных нарушений конституции нет.

## Project Structure

### Documentation (this feature)

```text
specs/001-build-route/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── api.md
│   └── ui-state.md
└── checklists/
    └── requirements.md
```

Будущий tasks.md создается отдельным этапом $speckit-tasks, не этим планом.

### Source Code (repository root)

```text
App.tsx                         # Provider + состояние текущего экрана
index.ts                        # Существующий entry point
src/
├── config/
│   └── api.ts                   # Единственный baseUrl, timeout, pageSize, debounce
├── types/
│   ├── dto.ts                   # Серверные структуры
│   └── domain.ts                # Stop, Draft, Submission, ApiFailure
├── api/
│   ├── client.ts                # fetch, JSON, timeout, HTTP, cooldown
│   ├── decoders.ts              # unknown → проверенные DTO
│   ├── stops.ts                 # Страницы, дедупликация, поиск, Domain
│   └── routes.ts                # Snapshot → POST → сверка подтверждения
├── context/
│   ├── RouteBuilderContext.tsx  # Асинхронные действия и синхронный submit lock
│   ├── routeBuilderReducer.ts  # Иммутабельные изменения черновика/состояний
│   └── validation.ts           # Количества, длина, заполненность всех карточек
├── screens/
│   ├── StopsScreen.tsx
│   └── InstructionsScreen.tsx
└── components/
    ├── StopRow.tsx
    ├── SelectionTray.tsx
    ├── PackageQuantityModal.tsx
    ├── InstructionCard.tsx
    ├── RequestState.tsx
    └── theme.ts                 # Цвета, интервалы; StyleSheet в компонентах
```

**Structure Decision**: Один Expo-проект с сохраненным App.tsx. Context использует
api, api использует config/types; обратные импорты запрещены. Экраны используют
Domain и callbacks, UI не знает форм JSON. Выбор не хранится в виртуализированных
строках. Третий экран добавляется без изменения API-слоя.
Структура выше — целевое проектирование: каталоги исходников пока не созданы.

## Complexity Tracking

Нарушений конституции нет; отдельные state manager, HTTP wrapper dependency,
навигационный framework и постоянное хранилище не вводятся.

## Phase 0 — Research (завершено)

Проверены package.json, версия Expo, конституция, server.js, API.md и контекст PDF.
Все архитектурные решения и рассмотренные альтернативы записаны в
[research.md](research.md). Целевая ОС уточнена: iOS. Неизвестных решений,
блокирующих проектирование, нет; runtime-проверки перечислены в quickstart.

## Phase 1 — Design outputs (завершено)

- [data-model.md](data-model.md): DTO/Domain, состояния, инварианты и переходы.
- [contracts/api.md](contracts/api.md): только список остановок и создание маршрута.
- [contracts/ui-state.md](contracts/ui-state.md): действия и два экрана.
- [quickstart.md](quickstart.md): запуск, контрактный smoke и приемка iOS.

## Implementation Phases (вход для будущего tasks.md)

### Phase 1: Базовый слой

Конфигурация API, DTO/Domain, декодеры и native fetch с таймаутом, ручным Retry,
cooldown 429/503 и классификацией ошибок. Создать Provider/reducer/validation,
синхронный inFlight lock и App.tsx state navigation. Настроить safe area и ESLint.
**Exit:** typecheck/lint проходят; JSON/null/числовые строки нормализуются;
контрактные пробы совпадают с сервером, API не импортирует UI.
**Требования:** FR-010, FR-013–014, FR-017–019.

### Phase 2: Пикер

StopsScreen, SectionList, инициалы/имя/адрес/телефон, алфавитные секции;
загрузка и кеш полного списка, q с debounce/отменой/requestId; отдельные empty,
loading/error. One/Multi-stop, модальное количество, чипы и Continue.
**Exit:** доступны все 24 точки без дублей; смена поиска сохраняет выбор;
количество соблюдает предел, Save/Cancel различаются, N=0 блокирует Continue.
**Требования:** FR-001–007, FR-016, FR-018–019.

### Phase 3: Лента инструкций

InstructionsScreen и карточки с N×, N/200, Clear all и кнопкой удаления.
Контролируемый ввод, проверка пробелов/длины для всех точек, прокрутка к ошибке,
сохранение при Back; клавиатура и нижняя кнопка не перекрываются.
**Exit:** удаление последней точки возвращает Stops; исправление снимает ошибки;
пограничные 200/201 и emoji не повреждают текст.
**Требования:** FR-008–011, FR-016.

### Phase 4: Отправка

Связать Submit с валидным неизменяемым snapshot и одним POST; sending/lock,
сверка 201, success + New route, ошибки и предупреждение при неизвестном результате.
Провести целиком quickstart на iOS и обязательные quality gates.
**Exit:** 20 прогонов double-tap дают один POST каждый; сетевой сбой не теряет
черновик; завершенный маршрут повторно не отправляется; все SC-001–SC-009 проверены
или явно отмечены как еще не подтвержденные в отчете, а не объявлены пройденными.
**Требования:** FR-012–015, FR-017, FR-019.

## Risks and validation boundaries

- На этапе планирования не подтверждается работоспособность будущего приложения.
- Нужен совместимый Expo Go на выбранном iPhone; совместимость runtime и доступ
  к локальному HTTP проверяются до реализации экранов.
- Физический iPhone обращается к LAN-IP компьютера, а не к localhost.
  Исключения debug-транспорта при необходимости задаются через Expo config,
  без ручного создания нативных каталогов.
- UI-снимки макета не заменяют справочник сервера и его количественные ограничения.
- Размер 50 покрывает текущий набор; расширение набора требует повторной проверки
  бага границ пагинации. POST после неизвестного результата может дать дубль:
  клиент честно предупреждает, не обещая отсутствующей серверной гарантии.
- Отсутствующая конфигурация ESLint — текущий долг foundation-фазы, не выполненная проверка.
