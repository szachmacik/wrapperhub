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
