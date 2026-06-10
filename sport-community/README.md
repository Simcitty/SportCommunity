# SportCommunity

Eine einfache App zum Organisiern von Sporttrainings und zum Chatten mit anderen Sportlern.

## Features

- **Interaktive Karte**: Finde Sportplätze in deiner Nähe
- **Events erstellen**: Lade andere zu deinen Trainings ein
- **Live-Chat**: Chatten mit der Sport-Community
- **Echtzeit-Updates**: Siehe direkt, wenn jemand zusagt

---

## Schnellstart (Für externe Benutzer)

**Für die einfachste Installation schau dir die [INSTALLATION.md](./INSTALLATION.md) an!**

Du brauchst nur:
1. [Docker](https://www.docker.com/products/docker-desktop) installieren
2. Git installieren
3. Code herunterladen: `git clone ...`
4. `docker compose up` ausführen
5. Browser öffnen: `http://localhost:4200`

Das wars!

---

## Entwicklung (Für Programmierer)

### Lokale Entwicklung ohne Docker

```bash
npm install
npm start
```

Öffne dann http://localhost:4200

### Mit Docker für Entwicklung

```bash
docker compose up
```

Änderungen werden automatisch angewendet.

### Build für Produktion

```bash
npm run build
```

### Tests ausführen

```bash
npm test
```

---

## Technologie

- **Frontend**: Angular 21.2 + TypeScript
- **Backend**: Node.js + MongoDB (optional, für externe Features)
- **Container**: Docker + Docker Compose

---

## Erste Schritte

1. **Anmelden**: Erstelle einen Account oder melde dich an
2. **Profil**: Stelle dein Level ein (Anfänger/Fortgeschritten/Profi)
3. **Karte erkunden**: Klick auf Sportplätze um Events zu sehen
4. **Event erstellen**: Erstelle dein erstes Training
5. **Chatten**: Tritt einer Gruppe bei und chatten los!

---

## Hilfe

- Probleme? Siehe [INSTALLATION.md - Häufige Probleme](./INSTALLATION.md#häufige-probleme)
- Fragen? Öffne ein GitHub Issue
- Entwicklung? Siehe [Angular CLI Docs](https://angular.dev/tools/cli)

---

## Lizenz

MIT License - Nutze diese App frei!
