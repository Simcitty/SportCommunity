# SportCommunity - Installationsanleitung

## Was ist SportCommunity?

SportCommunity ist eine App zum Organisiern von Sporttrainings und Events. Du kannst:
- Sportplätze auf einer interaktiven Karte finden
- Trainingsevents erstellen und andere einladen
- Mit anderen Sportlern in einer Community chatten
- Events annehmen und verwalten

---

## Schritt 1: Voraussetzungen installieren

Bevor du mit der Installation startest, brauchst du diese Programme:

### 1.1 Git
Git ist für den Download des Quellcodes nötig.
- **Windows/Mac/Linux**: Lade Git herunter von https://git-scm.com/

### 1.2 Docker
Docker startet die App in einem Container, ohne dass du Programmierkenntnisse brauchst.
- **Windows/Mac**: Lade Docker Desktop herunter von https://www.docker.com/products/docker-desktop
- **Linux**: Nutze dein Paket-Manager-Tool:
  ```bash
  sudo apt install docker.io docker-compose
  ```

---

## Schritt 2: Code herunterladen

Öffne dein Terminal (oder CMD auf Windows) und gib ein:

```bash
git clone https://github.com/Simcitty/SportCommunity.git
cd sport-community
```

---

## Schritt 3: App starten

Gehe in das Hauptprojekt-Verzeichnis:

```bash
cd ../
```

Starte die App mit Docker:

```bash
docker compose up
```

Das wird ein paar Minuten dauern beim ersten Mal. Es wird folgendes herunterladen und starten:
- Frontend (die Webseite)
- Backend (der Server)
- MongoDB (die Datenbank)

---

## Schritt 4: App im Browser öffnen

Sobald alle Container laufen, öffne deinen Browser und gib die Adresse ein:

```
http://localhost:4200
```

Fertig! SportCommunity lädt jetzt!

---

## Wie nutze ich die App?

### 1. Anmelden oder Registrieren

Beim Start wirst du zur Login-Seite geleitet:
- Gib deine E-Mail und ein Passwort ein
- Klicke "Anmelden"

Wenn du noch kein Konto hast, klick "Jetzt registrieren" und fülle das Formular aus.

### 2. Dashboard - Die Übersicht

Nach dem Login siehst du:
- **Karte**: Alle Sportplätze in deiner Nähe
- **Events**: Bevorstehende Trainings
- **Chat**: Chatten mit anderen Sportlern

### 3. Ein Event erstellen

1. Klick auf einen Sportplatz auf der Karte
2. Klick auf "Event erstellen"
3. Füll das Formular aus:
   - Datum und Uhrzeit
   - Maximale Anzahl Spieler
   - Beschreibung (optional)
4. Klick "Event erstellen"

### 4. Einem Event beitreten

1. Sieh dir Events auf der Karte an
2. Klick auf "Zusagen"
3. Gib deinen Namen und Level ein (Anfänger/Fortgeschritten/Profi)
4. Fertig! Du bist dabei

### 5. Im Chat chatten

1. Klick auf "Chat" im Menü
2. Wähle oder erstelle eine Gruppe
3. Schreib deine Nachricht
4. Verschick sie

---

## Häufige Probleme

### Problem: "Port is already allocated"
**Lösung**: Der Port 4200 ist bereits in Verwendung.
```bash
docker compose down
docker compose up
```

### Problem: Container starten nicht
**Lösung**: Stelle sicher, dass Docker läuft und starten die App neu:
```bash
docker compose restart
```

### Problem: Ich sehe die App nicht
**Lösung**: Warte 30-60 Sekunden beim ersten Start. Aktualisiere dann die Seite im Browser (F5).

---

## App beenden

Zum Beenden öffne das Terminal und drücke: `Strg+C`

Um auch alle Daten zu löschen:
```bash
docker compose down
```

Um nur die App zu pausieren und später weiterzumachen:
```bash
docker compose pause
docker compose unpause
```

---

## Hilfe und Support

Falls etwas nicht funktioniert:
1. Schau ob Docker läuft
2. Aktualisiere die Seite im Browser
3. Versuche `docker compose restart`
4. Falls immer noch nicht: Poste eine Frage auf GitHub oder schreib dem Support

---

**Viel Spaß mit SportCommunity!**
