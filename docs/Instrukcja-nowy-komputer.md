# Instrukcja uruchomienia na nowym komputerze

## Start w 3 komendach

```powershell
git clone https://github.com/studioxy/faktury-mailer-cli.git
cd faktury-mailer-cli
npm install
```

## Co przygotować po klonowaniu

1. Skopiuj plik konfiguracyjny:

```powershell
Copy-Item .\config.example.json .\config.json
```

2. Skopiuj plik sekretów:

```powershell
Copy-Item .\.env.example .\.env
```

3. Uzupełnij `.env`:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
GOOGLE_REDIRECT_URI=https://developers.google.com/oauthplayground
```

4. Wrzuć do katalogu `.\data`:
- `kontrahenci.xlsx`
- faktury PDF albo ZIP z fakturami

## Bezpieczne uruchomienie

Najpierw sprawdź podgląd bez wysyłki:

```powershell
npm run dev -- --config .\config.json --dry-run
```

## Test jednej wysyłki

Wyślij jedną fakturę testowo do siebie:

```powershell
npm run dev -- --config .\config.json --override-email "twoj@gmail.com" --limit 1
```

Program poprosi wtedy o potwierdzenie w formie:

```text
SEND 1
```

## Pełna wysyłka

Jeśli test dojdzie poprawnie, uruchom pełną wysyłkę:

```powershell
npm run dev -- --config .\config.json
```

## Gdzie są wyniki

Raporty zapisują się w katalogu:

```text
.\reports
```

## Najkrótszy skrót pracy

1. `git clone`
2. `npm install`
3. uzupełnić `.env`
4. wrzucić pliki do `data`
5. zrobić `--dry-run`
6. zrobić test `--limit 1`
7. uruchomić pełną wysyłkę
