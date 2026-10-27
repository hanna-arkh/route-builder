# Data Model: Route Builder — обязательное ядро

Дата: 2026-10-27. Реализация типов планируется в src/types/; это проектирование,
а не готовый исходный код. Сетевые DTO отделены от моделей состояния/UI.

## DTO: данные сервера

| Тип / поле | Тип TypeScript | Правило |
|---|---|---|
| StopDto.id | string | Непустой стабильный ключ |
| StopDto.name, address, phone | string | Не преобразовывать телефон в число |
| StopDto.zone | string | Передается сервером, в UI не используется |
| StopDto.packages_max | number или string или null | Строка должна представлять положительное целое |
| StopDto.last_delivery_at | string или number | ISO с/без Z либо Unix-секунды; не нужен Domain |
| StopDto.notes | необязательный string или null | Текущий сервер дает null/отсутствие |
| StopsPageDto.items | StopDto[] или null | null нормализуется в [] |
| StopsPageDto.page, page_size, total, total_pages | number | Метаданные не определяют полноту |
| StopsPageDto.has_more | boolean | Не использовать как условие продолжения |
| RouteStopDto.stop_id | string | id из выбранной остановки |
| RouteStopDto.packages | number | JSON number, целое, положительное |
| RouteStopDto.instructions | string | Передается без изменения текста |
| CreateRouteRequestDto.stops | RouteStopDto[] | Непустой уникальный набор |
| CreateRouteResponseDto.id | string | Непустой идентификатор созданного маршрута |
| CreateRouteResponseDto.stops | RouteStopDto[] | Сверяется с snapshot запроса |
| CreateRouteResponseDto.status | литерал draft | Иной статус — protocol error |
| ApiErrorDto.error | string | Код сервера |
| ApiErrorDto.fields | необязательный Record<string,string> | Ошибки полей |
| ApiErrorDto.request_id, detail | необязательные string | Только диагностика |

JSON сначала имеет тип unknown. Проверяются необходимые поля/массивы/типы,
а не выполняется слепое приведение к DTO. Неправильные обязательные данные дают
ProtocolError; неизвестные дополнительные поля игнорируются. Пустое имя может
отображаться как Unknown stop, пустой телефон — как No phone; отсутствие id
или неверный тип обязательного поля не исправляются выдуманным значением.

## Domain: данные клиента

### Stop

id: string; name: string; address: string; phone: string;
packagesMax: number | null. zone/notes/last_delivery_at не переносятся в Domain.
Числовой/строковый максимум нормализуется в положительное безопасное целое;
null сохраняется как отсутствие ограничения. Невалидный максимум — ProtocolError.
Инициалы, display-name и секция вычисляются при отображении; исходные данные сохранены.

### SelectedStop

stop: Stop; packages: number; instructions: string.
Список SelectedStop[] хранит порядок выбора и уникальность stop.id.
SelectedStop не зависит от текущих результатов поиска: исчезновение из выдачи
не удаляет выбор. Одна запись на остановку; количество не создает дополнительные записи.

### Draft / SelectionMode

mode: one | multi; selected: SelectedStop[]. Начальные значения: one, [],
packages=1 при добавлении, instructions="". При one новая точка заменяет предыдущую;
при multi повторный выбор снимает точку. Переход multi → one сохраняет первую.
Удаление стирает данные только этой точки; повторное добавление начинает ее с 1/пусто.
Clear all меняет только instructions своей точки. Черновик живет в памяти провайдера.

### CatalogueState

browse: Stop[] — кеш полного справочника; results: Stop[] — последняя выдача;
query: string; status: idle | loading | ready | error;
activeRequestId: number; error: ApiFailure | null;
progress: {query: string; nextPage: number; collected: Stop[]} | null.
Progress относится к точному query и текущему requestId, обновляется только после
успешной страницы. При ошибке Retry продолжает nextPage; новый query сбрасывает
progress и начинает page=1. Успешное завершение очищает progress.
Browse не заменяется выдачей поиска. Устаревший requestId не обновляет ни results,
ни status, ни error. Пустой массив при ready — empty, при error — ошибка.

### ApiFailure

kind: network | timeout | http | protocol | cooldown;
httpStatus: number | null; code: string | null; fields: Record<string,string>;
requestId: string | null; retryAt: number | null; outcome: rejected | unknown.
Диагностика не хранит инструкции/телефоны/полные тела запросов. Подробности сервера
не выводятся raw JSON пользователю. error.message для UI — английское сопоставление.
Общий retryAt API-клиента применяется к новым запросам; новый запрос/поиск не обходят 429.

### SubmissionState (discriminated union)

| status | Данные | Разрешенные действия |
|---|---|---|
| idle | errorsByStopId | Редактирование, переходы, Submit |
| sending | immutable snapshot, startedAt | Ожидание; изменения/Submit/Back/New route запрещены |
| error | snapshot, ApiFailure, errorsByStopId | Исправить/Retry после cooldown; данные не теряются |
| unknown | snapshot, ApiFailure, возможный receivedRouteId | Только явные действия с предупреждением |
| success | routeId, подтвержденные stops, status=draft | New route; повтор Submit запрещен |

UI-навигация screen: stops | instructions хранится в App.tsx отдельно от Draft.
Состояние отправки принадлежит провайдеру, не исчезает при смене экрана.

## Инварианты и валидация

1. selected.length >= 1 для Continue и отправки; one допускает максимум одну точку.
2. id уникальны; packages — безопасное целое >=1 и <=packagesMax, если он не null.
3. instructions.trim().length > 0; instructions.length <=200 в единицах UTF-16.
   В запросе сохраняются исходные пробелы. Emoji не разрезаются на границе лимита.
4. Save коммитит временное число селектора; Cancel/закрытие не меняет Draft.
5. Submit проверяет все карточки, сохраняет ошибки по id и показывает первую ошибку.
6. inFlight ref устанавливается синхронно до await; повторный вызов сразу выходит.
   После ошибки ref снимается в finally, но success отдельно запрещает повтор.
7. Snapshot составляется один раз. Ответ сверяется по порядку/id/количеству/тексту;
   несовпадение не объявляется успехом и не запускает автоматическое создание.

## Переходы состояния

- idle/error → sending: валидация успешна, cooldown истек, нет активной отправки.
- sending → success: получен и проверен 201; серверный draft — успешное создание.
- sending → error: подтвержденные 400/422/429; текст и состав сохранены.
- sending → unknown: таймаут/потеря связи/5xx/непроверяемый ответ.
- unknown → sending: только после предупреждения и явного подтверждения Retry;
  повтор может создать дубликат, гарантии exactly-once нет.
- error → idle: исправление данных; cooldown при этом не сбрасывается.
- success → idle + Stops: New route очищает selected/ошибки/результат;
  кеш справочника сохраняется, режим сбрасывается в one.
- Последняя точка удалена → Stops, Continue недоступна.

## Хранение и ограничения

Нет БД, серверных изменений, дисковой записи черновика или фоновой очереди.
Перезапуск приложения сбрасывает сеанс; перезапуск mock-сервера сбрасывает его маршруты.
Добавление третьего экрана не меняет DTO и API-клиент: экран использует те же Domain/context.
