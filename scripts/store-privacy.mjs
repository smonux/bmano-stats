import { mkdir, writeFile } from 'node:fs/promises';

const texts = {
  'es-ES': [
    'Política de privacidad',
    'Responsable: [TITULAR LEGAL]. Contacto: [EMAIL DE PRIVACIDAD]. Fecha: [FECHA DE PUBLICACIÓN].',
    'Handball Stats permite guardar equipos, nombres y dorsales, partidos, jugadas, notas y transcripciones en el dispositivo. No exige una cuenta ni integra anuncios o analítica propia. Los nombres introducidos por el usuario no se traducen.',
    'El micrófono es opcional y se solicita al hablar o comprobarlo. Whistle procesa el audio localmente; la aplicación no guarda archivos de grabación. La transcripción puede conservarse junto a una jugada. Denegar el permiso permite seguir usando la entrada manual.',
    'Los modelos del paquete móvil están incluidos. No se configura un servidor del desarrollador para recibir audio o partidos. Al compartir PDF o ZIP, tú eliges otra aplicación o destino, que aplica sus propias condiciones. La aplicación crea archivos temporales en su caché privada para compartir; el sistema puede eliminarlos. No consideres la caché una copia de seguridad.',
    'Los datos permanecen hasta que los elimines o borres el almacenamiento de la aplicación. El borrado de registros puede ser lógico: para eliminar todo el almacenamiento local, usa los controles del sistema o desinstala. Las copias que exportaste o compartiste no se borran automáticamente. El sistema operativo puede gestionar sus propias copias según tus ajustes.',
    'Importar una copia sustituye los datos actuales tras confirmación. Para transferir desde la web, exporta ZIP e impórtalo en la app; no hay sincronización automática. No introduzcas datos de otras personas sin base legítima. Para consultas o ejercicio de derechos aplicables, contacta al responsable indicado arriba.',
  ],
  'en-US': [
    'Privacy policy',
    'Controller: [LEGAL OWNER]. Contact: [PRIVACY EMAIL]. Date: [PUBLICATION DATE].',
    'Handball Stats stores teams, player names and numbers, matches, plays, notes and transcripts on the device. No account is required and no advertising or first-party analytics is integrated. User-entered names are not translated.',
    'Microphone access is optional and requested when speaking or checking it. Whistle processes audio locally; the app does not save recording files. A transcript may be retained with a play. Denying access does not prevent manual entry.',
    'Voice weights are included in the mobile package. No developer server is configured to receive audio or matches. Sharing a PDF or ZIP lets you choose another app or destination, which has its own terms. Temporary export files are held in private cache and may be removed by the system. Cache is not a backup.',
    'Data remains until you remove it or clear app storage. Record deletion can be logical: to erase all local storage, use system controls or uninstall. Exported or shared copies are not deleted automatically. Operating-system backups may apply according to your settings.',
    'Restoring a backup replaces current data after confirmation. To move from the web, export ZIP and import it in the app; there is no automatic sync. Do not enter other people’s data without a lawful basis. Contact the controller above for questions or applicable rights requests.',
  ],
  'de-DE': [
    'Datenschutzhinweise',
    'Verantwortlicher: [RECHTLICHER INHABER]. Kontakt: [DATENSCHUTZ-EMAIL]. Datum: [VERÖFFENTLICHUNGSDATUM].',
    'Handball Stats speichert Teams, Namen und Rückennummern, Spiele, Aktionen, Notizen und Transkriptionen auf dem Gerät. Ein Konto ist nicht nötig; Werbung und eigene Analytik sind nicht integriert. Eingegebene Namen werden nicht übersetzt.',
    'Das Mikrofon ist optional und wird beim Sprechen oder Prüfen angefragt. Whistle verarbeitet Audio lokal; die App speichert keine Aufnahmedateien. Transkriptionen können bei Aktionen bleiben. Ohne Erlaubnis ist manuelle Eingabe möglich.',
    'Die Sprachgewichte sind im mobilen Paket enthalten. Es ist kein Entwicklerserver für Audio oder Spiele konfiguriert. Beim Teilen von PDF oder ZIP wählst du App und Ziel mit deren eigenen Bedingungen. Temporäre Exporte liegen im privaten Cache und können vom System gelöscht werden; sie sind keine Sicherung.',
    'Daten bleiben bis zur Entfernung oder Löschung des App-Speichers. Einzelne Löschungen können logisch sein; für vollständige lokale Löschung die Systemeinstellungen nutzen oder deinstallieren. Exportierte/geteilte Kopien werden nicht automatisch entfernt. Das Betriebssystem kann gemäß deinen Einstellungen eigene Sicherungen erstellen.',
    'Eine Wiederherstellung ersetzt nach Bestätigung die aktuellen Daten. Webdaten per ZIP übertragen, keine automatische Synchronisation. Personenbezogene Daten anderer nur mit rechtlicher Grundlage eingeben. Für Fragen und anwendbare Rechte den oben genannten Verantwortlichen kontaktieren.',
  ],
  'fr-FR': [
    'Politique de confidentialité',
    'Responsable : [TITULAIRE LÉGAL]. Contact : [EMAIL CONFIDENTIALITÉ]. Date : [DATE DE PUBLICATION].',
    'Handball Stats conserve équipes, noms et numéros, matchs, actions, notes et transcriptions sur l’appareil. Aucun compte requis, sans publicité ni analyse propre intégrée. Les noms saisis ne sont pas traduits.',
    'Le microphone est facultatif et demandé pour parler ou le vérifier. Whistle traite le son localement ; l’application ne conserve pas de fichiers d’enregistrement. La transcription peut rester avec l’action. Le refus permet toujours la saisie manuelle.',
    'Le modèle vocal est inclus dans le paquet mobile. Aucun serveur du développeur n’est configuré pour recevoir le son ou les matchs. En partageant PDF ou ZIP, vous choisissez une application ou destination soumise à ses conditions. Les fichiers temporaires sont en cache privé et peuvent être supprimés par le système ; ce n’est pas une sauvegarde.',
    'Les données restent jusqu’à leur suppression ou l’effacement du stockage. Une suppression peut être logique : pour tout effacer localement, utilisez les réglages système ou désinstallez. Les copies exportées/partagées ne sont pas supprimées automatiquement. Le système peut gérer des sauvegardes selon vos réglages.',
    'Restaurer remplace les données après confirmation. Transférez depuis le web par ZIP ; aucune synchronisation automatique. Ne saisissez pas de données d’autrui sans fondement légitime. Pour toute question ou droit applicable, contactez le responsable ci-dessus.',
  ],
  'it-IT': [
    'Informativa sulla privacy',
    'Titolare: [TITOLARE LEGALE]. Contatto: [EMAIL PRIVACY]. Data: [DATA DI PUBBLICAZIONE].',
    'Handball Stats conserva squadre, nomi e numeri, partite, eventi, note e trascrizioni sul dispositivo. Non richiede account e non integra pubblicità o analisi proprie. I nomi inseriti non vengono tradotti.',
    'Il microfono è facoltativo e richiesto quando parli o lo verifichi. Whistle elabora l’audio localmente; l’app non salva file di registrazione. La trascrizione può restare associata a un evento. Negare il permesso non blocca l’inserimento manuale.',
    'Il modello vocale è incluso nel pacchetto mobile. Non è configurato un server dello sviluppatore per ricevere audio o partite. Condividendo PDF o ZIP scegli un’app o destinazione con le proprie condizioni. Gli export temporanei sono nella cache privata e il sistema può eliminarli: non sono un backup.',
    'I dati restano finché li elimini o cancelli lo spazio dell’app. La cancellazione dei record può essere logica: per eliminare tutto localmente usa i controlli del sistema o disinstalla. Le copie esportate/condivise non si cancellano automaticamente. Il sistema può gestire backup secondo le tue impostazioni.',
    'Il ripristino sostituisce i dati dopo conferma. Trasferisci dal web tramite ZIP; non c’è sincronizzazione automatica. Non inserire dati altrui senza una base legittima. Per domande o diritti applicabili contatta il titolare sopra indicato.',
  ],
  'nl-NL': [
    'Privacybeleid',
    'Verantwoordelijke: [JURIDISCHE EIGENAAR]. Contact: [PRIVACY-EMAIL]. Datum: [PUBLICATIEDATUM].',
    'Handball Stats bewaart teams, namen en rugnummers, wedstrijden, acties, notities en transcripties op het apparaat. Geen account nodig; geen ingebouwde advertenties of eigen analytics. Ingevoerde namen worden niet vertaald.',
    'De microfoon is optioneel en wordt gevraagd bij spreken of controleren. Whistle verwerkt audio lokaal; de app bewaart geen opnamebestanden. Een transcriptie kan bij een actie blijven. Weigeren verhindert handmatige invoer niet.',
    'Het spraakmodel is in het mobiele pakket opgenomen. Er is geen ontwikkelaarserver ingesteld voor audio of wedstrijden. Bij PDF/ZIP delen kies je een app of bestemming met eigen voorwaarden. Tijdelijke exportbestanden staan in privécache en kunnen door het systeem worden verwijderd; dit is geen back-up.',
    'Gegevens blijven totdat je ze verwijdert of appopslag wist. Een verwijdering kan logisch zijn: gebruik systeeminstellingen of verwijder de app om alles lokaal te wissen. Gedeelde/geëxporteerde kopieën verdwijnen niet automatisch. Het besturingssysteem kan volgens je instellingen eigen back-ups maken.',
    'Herstellen vervangt gegevens na bevestiging. Zet webgegevens via ZIP over; er is geen automatische synchronisatie. Voer gegevens van anderen alleen met een geldige grondslag in. Neem voor vragen en toepasselijke rechten contact op met de verantwoordelijke hierboven.',
  ],
  'pl-PL': [
    'Polityka prywatności',
    'Administrator: [PRAWNY WŁAŚCICIEL]. Kontakt: [EMAIL PRYWATNOŚCI]. Data: [DATA PUBLIKACJI].',
    'Handball Stats przechowuje drużyny, imiona i numery, mecze, zdarzenia, notatki i transkrypcje na urządzeniu. Konto nie jest wymagane; brak zintegrowanych reklam i własnej analityki. Wpisane imiona nie są tłumaczone.',
    'Mikrofon jest opcjonalny i wymagany tylko przy mówieniu lub sprawdzaniu. Whistle przetwarza dźwięk lokalnie; aplikacja nie zapisuje plików nagrań. Transkrypcja może pozostać przy zdarzeniu. Odmowa nie blokuje ręcznego wpisywania.',
    'Model głosowy jest dołączony do pakietu mobilnego. Nie skonfigurowano serwera dewelopera do odbierania audio ani meczów. Udostępniając PDF lub ZIP wybierasz aplikację lub miejsce z własnymi warunkami. Eksporty tymczasowe są w prywatnej pamięci podręcznej i system może je usunąć; nie są kopią zapasową.',
    'Dane pozostają do usunięcia lub wyczyszczenia pamięci aplikacji. Usuwanie rekordów może być logiczne: aby usunąć wszystko lokalnie, użyj ustawień systemowych lub odinstaluj. Wyeksportowane i udostępnione kopie nie znikają automatycznie. System może tworzyć własne kopie zgodnie z ustawieniami.',
    'Przywrócenie zastępuje dane po potwierdzeniu. Przenoś dane z wersji web przez ZIP; brak automatycznej synchronizacji. Nie wpisuj danych innych osób bez podstawy prawnej. W sprawie pytań i właściwych praw kontaktuj się z administratorem powyżej.',
  ],
};
await mkdir('docs/stores/privacy', { recursive: true });
for (const [locale, [title, ...paragraphs]] of Object.entries(texts))
  await writeFile(
    `docs/stores/privacy/${locale}.md`,
    `# ${title}\n\n> DRAFT / BORRADOR — completar titular, contacto y fecha; revisión del responsable y validación del binario pendientes. No publicar con estos marcadores.\n\n${paragraphs.join('\n\n')}\n`,
  );
