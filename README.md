# Faktury Mailer CLI

Lokalne narzedzie CLI do dopasowywania faktur PDF do kontrahentow po NIP i wysylania ich mailem przez Gmail API.

## Co robi

1. Wczytuje `kontrahenci.xlsx`.
2. Skanuje folder z fakturami PDF albo ZIP z PDF-ami.
3. Wyciaga numer faktury i NIP nabywcy z kazdego PDF.
4. Normalizuje NIP do samych cyfr.
5. Dopasowuje kontrahenta po NIP.
6. Pokazuje czytelny preview w terminalu.
7. W trybie wysylki wysyla tylko pozycje ze statusem `ready`.
8. Zapisuje raport JSON w katalogu `reports`.

## Struktura katalogow

- kod projektu: katalog repozytorium
- dane wejsciowe: `./data`
- raporty: `./reports`

Repo nie zawiera zadnych prywatnych danych, PDF-ow, XLSX ani sekretow.

## Konfiguracja

1. Skopiuj `config.example.json` do `config.json`.
2. Skopiuj `.env.example` do `.env`.
3. Uzupelnij `.env`:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
GOOGLE_REDIRECT_URI=https://developers.google.com/oauthplayground
```

4. Wrzuc do `data/`:
- `kontrahenci.xlsx`
- faktury `PDF` albo ZIP z PDF-ami

Domyslny `config.json`:

```json
{
  "workspaceDir": "./data",
  "contractsFile": "./kontrahenci.xlsx",
  "invoicesPath": ".",
  "reportDir": "../reports"
}
```

## Uzycie

Instalacja:

```bash
npm install
```

Podglad bez wysylki:

```bash
npm run dev -- --config ./config.json --dry-run
```

Test jednej wysylki do siebie:

```bash
npm run dev -- --config ./config.json --override-email twoj@email.pl --limit 1
```

Pelna wysylka:

```bash
npm run dev -- --config ./config.json
```

## Przeniesienie na inny komputer

Najprostsza droga:

```bash
git clone <URL_REPO>
cd faktury-mailer-cli
npm install
```

Potem:

1. utworz `config.json` z `config.example.json`
2. utworz `.env` z `.env.example`
3. wrzuc swoje pliki do `data/`
4. uruchom `--dry-run`
5. zrob test `--override-email`
6. uruchom pelna wysylke

Szybkie kroki sa tez w pliku `URUCHOMIENIE.md`.
