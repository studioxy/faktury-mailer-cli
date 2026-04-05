# Uruchomienie

## Szybki start

1. Sklonuj repo:

```powershell
git clone <URL_REPO>
cd faktury-mailer-cli
```

2. Zainstaluj pakiety:

```powershell
npm install
```

3. Skopiuj config:

```powershell
Copy-Item .\config.example.json .\config.json
```

4. Skopiuj env:

```powershell
Copy-Item .\.env.example .\.env
```

5. Uzupelnij `.env`:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
GOOGLE_REDIRECT_URI=https://developers.google.com/oauthplayground
```

6. Wrzuc do `.\data`:
- `kontrahenci.xlsx`
- faktury `PDF` albo ZIP z PDF-ami

7. Zrob bezpieczny podglad:

```powershell
npm run dev -- --config .\config.json --dry-run
```

8. Zrob test jednej wysylki do siebie:

```powershell
npm run dev -- --config .\config.json --override-email "twoj@gmail.com" --limit 1
```

9. Jesli test dojdzie, uruchom pelna wysylke:

```powershell
npm run dev -- --config .\config.json
```

## Co przenosisz na inny komputer

Po GitHubie nie przenosisz juz calego folderu recznie. Wystarczy:

1. `git clone`
2. `npm install`
3. uzupelnic `.env`
4. wrzucic swoje pliki do `data`
5. odpalic `--dry-run`

## Gdzie sa wyniki

Raporty zapisuja sie w:

```text
.\reports
```

## Uwagi

- `--dry-run` nic nie wysyla
- `--override-email` kieruje testowo wysylke na jeden adres
- `--limit 1` ogranicza przetwarzanie do jednej faktury
