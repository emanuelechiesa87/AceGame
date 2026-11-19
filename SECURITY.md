# Sicurezza

AceGame è un gioco statico (nessun server, nessun account, nessun dato raccolto): i salvataggi restano nel browser del dispositivo. Informativa privacy: https://emanuelechiesa87.github.io/AceGame/privacy.html

## Segnalare un problema
Usa la funzione **Report a vulnerability** nella scheda *Security* del repository (segnalazione privata). Per problemi non sensibili va bene una normale *issue*.

## Misure attive
- Content Security Policy nella pagina pubblicata: si caricano solo file dal sito stesso, nessuno script esterno, nessun invio di dati.
- Pubblicazione automatica solo se i test passano e `npm audit` non trova falle gravi; installazione delle dipendenze senza script (`npm ci --ignore-scripts`) e da lockfile.
- Dependabot: aggiornamenti settimanali proposti come pull request, mai uniti in automatico.
- Permessi minimi nel workflow di pubblicazione.
