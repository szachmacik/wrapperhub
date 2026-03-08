# WrapperHub — TODO

## Faza 2: Baza danych
- [x] Tabela `wrappers` — definicje narzędzi AI (nazwa, opis, typ, config, aktywny)
- [x] Tabela `plans` — pakiety subskrypcyjne (Free, Pro, Business)
- [x] Tabela `user_plans` — przypisanie użytkownika do pakietu
- [x] Tabela `api_keys` — klucze API dostawców (OpenAI, itp.) zarządzane przez admina
- [x] Tabela `usage_logs` — logi użycia (user, wrapper, tokeny, koszt, marża)
- [x] Tabela `wrapper_plan_access` — które wrappery dostępne w jakim planie
- [x] Migracja bazy danych (db:push)

## Faza 3: Backend API
- [x] Router `wrappers` — CRUD wrapperów (admin), lista dostępnych (klient)
- [x] Router `plans` — CRUD pakietów, przypisanie do użytkownika
- [x] Router `usage` — logowanie użycia, statystyki admina
- [x] Router `apiKeys` — zarządzanie kluczami API przez admina
- [x] Middleware limitów użycia per plan
- [x] Endpoint proxy OpenAI Chat (z marżą w tle)
- [x] Endpoint proxy generowania obrazów (DALL-E)
- [x] Endpoint analizy dokumentów (upload + GPT-4 Vision)

## Faza 4: Panel klienta (Genspark-style)
- [x] Landing page — hero, features, pricing
- [x] Strona logowania / rejestracji
- [x] Dashboard klienta — lista dostępnych narzędzi AI
- [x] Widok AI Chat (wrapper OpenAI)
- [x] Widok generowania obrazów
- [x] Widok analizy dokumentów (upload PDF/img)
- [x] Widok historii użycia (bez kosztów — tylko liczba requestów)
- [x] Widok pakietów i upgrade

## Faza 5: Panel admina
- [x] Dashboard admina — statystyki użycia, przychód, marża
- [x] Zarządzanie wrapperami — dodaj/edytuj/włącz/wyłącz
- [x] Zarządzanie klientami — lista, plan, użycie, blokada
- [x] Zarządzanie pakietami — ceny, limity, dostęp do wrapperów
- [x] Zarządzanie kluczami API — dodaj/rotuj klucze dostawców
- [x] Widok logów użycia z kosztem i marżą
- [x] Ustawienia marży per wrapper lub globalnie

## Faza 6: Stripe
- [x] Integracja Stripe Checkout
- [x] Webhooks: payment_intent, subscription events
- [x] Automatyczne przypisanie planu po płatności

## Faza 7: Wersja lokalna Docker
- [x] Dockerfile dla aplikacji
- [x] docker-compose.yml (app + MySQL)
- [x] Skrypt install.sh — jedna komenda instalacji
- [x] README z instrukcją lokalnej instalacji

## Faza 8: Finalne szlify
- [x] Testy vitest — routery, logika marży, limity (6 testów, 2 pliki)
- [x] Google Fonts Inter + kolor primary fioletowy
- [x] TypeScript — brak błędów
- [x] Checkpoint i deploy

## Faza 9: Rozbudowa autonomiczna
- [x] Streaming chat (SSE endpoint + frontend streaming)
- [x] Markdown rendering w chat (Streamdown)
- [x] Onboarding wizard dla nowego użytkownika
- [x] Wykresy Recharts w panelu admina (przychód/użycie w czasie)
- [x] Eksport CSV logów użycia (admin)
- [x] Szybki wizard "Deploy Wrapper" w adminie
- [x] Strona profilu użytkownika
- [x] Powiadomienia admina (nowy użytkownik, nowa płatność)
- [x] Responsywność mobile (hamburger menu, mobile dashboard)
- [x] Strona 404 + error boundaries
- [x] Konwersacje: lista historii w sidebar chatu

## Faza 10: Rozbudowa autonomiczna (bez zewnętrznych kluczy)
- [x] Rate limiting per plan (middleware + 429 response)
- [x] Marketplace narzędzi - publiczny katalog z wyszukiwarką i filtrami
- [x] System ocen wrapperów (ratings 1-5 + recenzje)
- [x] Dark mode toggle
- [x] Analytics dashboard - wykresy retencji, top narzędzia, revenue breakdown
- [x] Strona statusu systemu (/status)
- [x] Changelog (/changelog)
- [x] FAQ (/faq)
- [x] SEO meta tagi + Open Graph + sitemap.xml
- [x] Skeleton loadery dla wszystkich widoków
- [x] Empty states z ilustracjami
- [x] Eksport danych użytkownika (JSON/CSV)
- [x] Strona ustawień konta (/settings)
- [x] System tagów dla wrapperów
- [x] Wyszukiwarka globalna
- [x] Ulepszony onboarding (progress bar, tips)
- [ ] Toast notifications dla akcji
- [x] Keyboard shortcuts (Cmd+K search)

## Faza 11: Rozbudowa autonomiczna (iteracja 5)
- [x] Historia konwersacji per narzędzie (ConversationHistory.tsx)
- [x] Publiczna strona wrappera /tools/:slug (ToolDetail.tsx)
- [x] Filtry tagów w Marketplace z sortowaniem po ratingu
- [x] Globalna wyszukiwarka cmd+k (CommandPalette.tsx)
- [x] Strona porównania planów z kalkulatorem ROI (PricingComparison.tsx)
- [x] Widget aktywności użytkownika (RecentActivity.tsx)
- [x] Widget statystyk użytkownika (UserStatsWidget)
- [x] Powiadomienia in-app (NotificationBell.tsx)
- [x] Ulepszony LogsTab: filtry, paginacja, eksport CSV, summary cards
- [x] Rate limiting per plan (middleware 429)
- [x] Strona publiczna /tools z katalogiem
- [x] Ulepszony onboarding (progress bar, tips)
- [x] Bulk actions w UsersTab (wyszukiwanie, filtry, eksport CSV)
- [x] Strona /dashboard/conversations (historia konwersacji)

## Faza 12: Rozbudowa autonomiczna (iteracja 6)
- [x] Strona ToolDetail /tools/:slug z opisem i ocenami
- [x] Ulepszony CommandPalette - narzędzia + nawigacja + admin shortcuts
- [x] Strona historii konwersacji /dashboard/conversations
- [x] Strona porównania planów /pricing
- [x] Widget "Trending Tools" na landing page
- [x] Micro-animacje framer-motion w Dashboard
- [x] Strona "Ulubione narzędzia" /dashboard/favorites
- [x] Wskaźnik użycia planu (progress bar) w Dashboard
- [x] Ulepszony AdminPanel - bulk delete wrapperów
- [x] Strona /dashboard/usage z wykresami użycia per narzędzie

## Faza 13: Rozbudowa autonomiczna (iteracja 7)
- [x] Trending Tools sekcja na landing page
- [x] Social proof (liczniki użytkowników, requestów) na landing page
- [x] Bulk delete wrapperów w AdminPanel
- [x] Edycja wrappera inline w AdminPanel + podgląd marży real-time
- [x] Micro-animacje framer-motion w Dashboard i Marketplace
- [x] Strona /dashboard/tool/:slug/history (ToolHistory.tsx)
- [x] Copy button w chat + Info link do ToolDetail
- [x] Strona /about + /contact z formularzem
- [x] Footer z linkami na wszystkich stronach publicznych
- [x] Ulepszony formularz wrappera — podgląd marży w czasie rzeczywistym

## Faza 14: 3 nowe funkcje (iteracja 8)
- [x] Webhook notyfikacje in-app dla klientów przy nowym wrapperze
- [x] Strona BYOK /dashboard/api-keys — własny klucz OpenAI użytkownika
- [x] Embed widget — snippet <script> osadzający wrapper na zewnętrznej stronie
- [x] Strona /embed/:wrapperId — publiczny iframe endpoint
- [x] Generator kodu embed w AdminPanel
- [x] Testy 6/6, TypeScript 0 błędów, checkpoint
