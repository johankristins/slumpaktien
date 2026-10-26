# Slumpaktien

En dashboard som slumpar fram en aktie från världens börser och analyserar den: teknisk analys på livekurser, fundamental analys, värdering, risker och möjligheter.

Publicerad som Claude-artefakt: https://claude.ai/artifact/Nkj7nc73n3r9sUsAH71vXX

## Så fungerar den

- **Urval:** cirka 230 bolag på 25 börser (USA, Norden, Europa, Asien, Australien, Kanada, Latinamerika m.fl.), listade med Yahoo Finance-symboler i `UNIVERSE` i `slumpaktien.html`.
- **Kursdata:** hämtas från Yahoo Finance (`/v8/finance/chart/<symbol>?range=2y&interval=1d`) via Claude-appens inbyggda webbläsare (`host:claude_browser`-capabilityn). Fungerar bara när sidan öppnas i Claude desktop-appen.
- **Teknisk analys:** räknas ut i sidan på kursdatan: SMA 20/50/200, RSI 14, MACD (12, 26, 9), ATR 14, volatilitet, största nedgång, stöd och motstånd, golden/death cross, samt ett tekniskt betyg från signalerna.
- **Fundamenta, värdering, risker och möjligheter:** skrivs av Claude via `sample`-capabilityn och returneras som JSON. Siffrorna bygger på Claudes kunskap och är ungefärliga.

## Filer

- `slumpaktien.html`: hela sidan (HTML, CSS och JS i en fil, inga beroenden utöver Google Fonts).
- `server.mjs`: liten Node-server för staging. Serverar sidan och hämtar/cachelagrar Yahoo-kurser för de symboler som finns i appen.
- `Dockerfile`: kör servern på port 3000 utan betaltjänster.

## Runhaven staging

Den publika versionen visar livekurser och teknisk analys. Claudes Artifact-capabilities finns inte på en vanlig webbserver, så fundamental och AI-skriven analys visas endast i Claude-versionen. Ingen AI-nyckel eller ny betaltjänst används.

För lokal kontroll: `node server.mjs`, öppna sedan `http://localhost:3000/` och kontrollera `http://localhost:3000/health`. I Coolify används Dockerfile-build, port `3000` och HTTP-hälsokontroll på `/health`.

Yahoo Finance är en extern, inofficiell kurskälla. Om den begränsar anrop visar appen ett fel i stället för påhittade kurser.

## Publicera en ny version

Sidan publiceras med Claudes Artifact-verktyg med de här capabilities:

```json
{
  "sample": {},
  "mcp": { "servers": [{ "server": "host:claude_browser", "tools": ["navigate", "get_page_text"] }] }
}
```

Inte investeringsrådgivning.
