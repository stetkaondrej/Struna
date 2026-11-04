// Všechny texty aplikace na jednom místě (rozhodnutí D-004).
// Každý klíč musí existovat v obou jazycích. Hlídá to test tests/unit/i18n.test.js.
// {n}, {date} atd. jsou místa, kam se doplní hodnota.

export const LANGS = ['cs', 'en'];

export const TEXTS = {
  cs: {
    'lang.name': 'Čeština',
    'tab.dnes': 'Dnes',
    'tab.mapa': 'Mapa',
    'tab.cviceni': 'Cvičení',
    'tab.akordy': 'Akordy',
    'tab.ja': 'Já',
    'nav.settings': 'Nastavení',
    'nav.back': 'Zpět',

    'today.install': 'Tip: přidej si Strunu na plochu. V Safari klepni na Sdílet a pak na „Přidat na plochu“.',
    'today.backupReminder': 'Data ještě nemají zálohu. Zálohovat můžeš v Nastavení.',
    'today.backupOld': 'Poslední záloha je starší než 14 dní. Zálohovat můžeš v Nastavení.',
    'today.backupGo': 'Otevřít Nastavení',

    'greet.morning': 'Dobré ráno!',
    'greet.afternoon': 'Dobré odpoledne!',
    'greet.evening': 'Dobrý večer!',
    'today.progress': '{done} z {goal} min',
    'today.progressLabel': 'Dnešní cvičení',
    'today.goalDone': 'Dnešní cíl splněn!',
    'today.goalLeft': 'Do cíle zbývá {n} min.',
    'today.start': 'Začít cvičit',
    'today.continue': 'Pokračovat v cvičení · {time}',
    'streak.one': '🔥 {n} den v řadě',
    'streak.few': '🔥 {n} dny v řadě',
    'streak.other': '🔥 {n} dní v řadě',
    'streak.zero': 'Začni sérii ještě dnes!',
    'streak.rest': 'Volno tento týden: {n} ze {max}',
    'streak.rule': 'Den se počítá od 5 minut cvičení. 2 dny volna za týden sérii nepřeruší.',
    'week.days': 'Po,Út,St,Čt,Pá,So,Ne',
    'week.done': 'cvičeno',
    'week.rest': 'volno',
    'week.missed': 'vynecháno',
    'week.today': 'dnes',
    'week.future': 'ještě nebylo',
    'week.none': 'bez cvičení',
    'level.title': 'Úroveň {n}',
    'level.xp': '{xp} / {next} XP',
    'level.toNext': 'Do další úrovně zbývá {n} XP.',

    'practice.ready': 'Kytara v ruce? Klepni na Začít.',
    'practice.running': 'Cvičíš…',
    'practice.paused': 'Pozastaveno',
    'practice.today': 'Dnes celkem {done} z {goal} min',
    'practice.start': 'Začít',
    'practice.pause': 'Pauza',
    'practice.resume': 'Pokračovat',
    'practice.finish': 'Hotovo',
    'practice.tooShort': 'Cvičení kratší než minuta se neukládá.',
    'practice.check.title': 'Pořád cvičíš?',
    'practice.check.text': 'Časovač běží už {min} minut.',
    'practice.check.yes': 'Ano, cvičím dál',
    'practice.check.save': 'Uložit jen {min} min',
    'practice.done.title': 'Skvělá práce!',
    'practice.done.minutes': 'Zapsáno: {min} min cvičení.',
    'practice.done.xp': '+{xp} XP',
    'practice.done.goal': 'Dnešní cíl splněn! +20 XP',
    'practice.done.streak': 'Bonus za sérii! +50 XP',
    'practice.done.level': 'Nová úroveň {n}!',
    'practice.done.again': 'Cvičit znovu',
    'practice.done.home': 'Zpět na Dnes',
    'settings.goal': 'Denní cíl',
    'settings.goal.text': 'Kolik minut chceš cvičit každý den.',
    'settings.goal.option': '{n} min',

    'soon.title': 'Brzy tu bude…',
    'soon.step': 'Plánováno v kroku {n}',
    'soon.mapa': 'Mapa výprav se 7 světy: od Kytarového tábora až po Velké pódium.',
    'soon.akordy': 'Kniha akordů s prstoklady a hvězdičkami za zvládnutí.',
    'soon.ja': 'Tvoje minuty, samolepky, zvukový deník a zprávy pro učitele.',

    'settings.language': 'Jazyk',
    'settings.backup': 'Záloha dat',
    'settings.backup.text': 'Záloha je soubor s tvými daty. Ulož ho do Souborů nebo na Google Drive. Když smažeš Strunu z plochy nebo dostaneš nový telefon, obnovíš z něj všechno.',
    'settings.backup.last': 'Poslední záloha: {date}',
    'settings.backup.never': 'Poslední záloha: zatím žádná',
    'settings.backup.make': 'Zálohovat',
    'settings.backup.done': 'Záloha je hotová.',
    'settings.backup.cancelled': 'Zálohování bylo zrušeno.',
    'settings.restore.pick': 'Obnovit ze zálohy',
    'settings.restore.ask': 'Obnovit data ze zálohy z {date}? Současná data v telefonu se přepíšou.',
    'settings.restore.yes': 'Obnovit',
    'settings.restore.no': 'Zrušit',
    'settings.restore.done': 'Data jsou obnovená ze zálohy.',
    'settings.storage': 'Úložiště',
    'settings.storage.persisted': 'Data jsou chráněná před automatickým smazáním.',
    'settings.storage.notPersisted': 'Telefon může data při nedostatku místa smazat. Proto pravidelně zálohuj.',
    'settings.storage.unknown': 'Ochranu dat se nepodařilo zjistit. Pravidelně zálohuj.',
    'settings.storage.usage': 'Využito {used} z {quota}',
    'settings.about': 'O aplikaci',
    'settings.version': 'Verze {v}',

    'error.backup.invalid': 'Tento soubor není záloha aplikace Struna. Vyber soubor, který začíná „struna-“.',
    'error.backup.newer': 'Záloha je z novější verze Struny. Nejdřív aplikaci aktualizuj, pak zálohu obnov.',
    'error.backup.read': 'Soubor se nepodařilo přečíst. Zkus ho vybrat znovu.',
    'error.save': 'Uložení se nepovedlo. Zkus to znovu. Pokud to nepomůže, zavři a znovu otevři aplikaci.',
    'error.boot': 'Strunu se nepodařilo spustit. Data v telefonu jsou v bezpečí. Zavři aplikaci a otevři ji znovu.',
    'error.newerData': 'Data v telefonu jsou z novější verze Struny. Aktualizuj aplikaci.',

    'update.available': 'Je k dispozici nová verze Struny.',
    'update.button': 'Aktualizovat',
  },

  en: {
    'lang.name': 'English',
    'tab.dnes': 'Today',
    'tab.mapa': 'Map',
    'tab.cviceni': 'Practice',
    'tab.akordy': 'Chords',
    'tab.ja': 'Me',
    'nav.settings': 'Settings',
    'nav.back': 'Back',

    'today.install': 'Tip: add Struna to your Home Screen. In Safari tap Share, then “Add to Home Screen”.',
    'today.backupReminder': 'Your data has no backup yet. You can back up in Settings.',
    'today.backupOld': 'Your last backup is more than 14 days old. You can back up in Settings.',
    'today.backupGo': 'Open Settings',

    'greet.morning': 'Good morning!',
    'greet.afternoon': 'Good afternoon!',
    'greet.evening': 'Good evening!',
    'today.progress': '{done} of {goal} min',
    'today.progressLabel': 'Today’s practice',
    'today.goalDone': 'Today’s goal done!',
    'today.goalLeft': '{n} min left to your goal.',
    'today.start': 'Start practice',
    'today.continue': 'Continue practice · {time}',
    'streak.one': '🔥 {n} day in a row',
    'streak.few': '🔥 {n} days in a row',
    'streak.other': '🔥 {n} days in a row',
    'streak.zero': 'Start your streak today!',
    'streak.rest': 'Rest days this week: {n} of {max}',
    'streak.rule': 'A day counts from 5 minutes of practice. 2 rest days a week keep your streak.',
    'week.days': 'Mo,Tu,We,Th,Fr,Sa,Su',
    'week.done': 'practised',
    'week.rest': 'rest day',
    'week.missed': 'missed',
    'week.today': 'today',
    'week.future': 'not yet',
    'week.none': 'no practice',
    'level.title': 'Level {n}',
    'level.xp': '{xp} / {next} XP',
    'level.toNext': '{n} XP to the next level.',

    'practice.ready': 'Guitar ready? Tap Start.',
    'practice.running': 'Practising…',
    'practice.paused': 'Paused',
    'practice.today': 'Today {done} of {goal} min',
    'practice.start': 'Start',
    'practice.pause': 'Pause',
    'practice.resume': 'Resume',
    'practice.finish': 'Done',
    'practice.tooShort': 'Practice under one minute is not saved.',
    'practice.check.title': 'Still practising?',
    'practice.check.text': 'The timer has been running for {min} minutes.',
    'practice.check.yes': 'Yes, keep going',
    'practice.check.save': 'Save only {min} min',
    'practice.done.title': 'Great job!',
    'practice.done.minutes': 'Saved: {min} min of practice.',
    'practice.done.xp': '+{xp} XP',
    'practice.done.goal': 'Today’s goal done! +20 XP',
    'practice.done.streak': 'Streak bonus! +50 XP',
    'practice.done.level': 'New level {n}!',
    'practice.done.again': 'Practise again',
    'practice.done.home': 'Back to Today',
    'settings.goal': 'Daily goal',
    'settings.goal.text': 'How many minutes you want to practise each day.',
    'settings.goal.option': '{n} min',

    'soon.title': 'Coming soon…',
    'soon.step': 'Planned for step {n}',
    'soon.mapa': 'A quest map with 7 worlds, from Guitar Camp to the Big Stage.',
    'soon.akordy': 'A chord book with finger diagrams and stars you earn.',
    'soon.ja': 'Your minutes, stickers, sound diary and reports for your teacher.',

    'settings.language': 'Language',
    'settings.backup': 'Data backup',
    'settings.backup.text': 'A backup is a file with your data. Save it to Files or Google Drive. If you delete Struna from the Home Screen or get a new phone, you can restore everything from it.',
    'settings.backup.last': 'Last backup: {date}',
    'settings.backup.never': 'Last backup: none yet',
    'settings.backup.make': 'Back up',
    'settings.backup.done': 'Backup complete.',
    'settings.backup.cancelled': 'Backup cancelled.',
    'settings.restore.pick': 'Restore from backup',
    'settings.restore.ask': 'Restore data from the backup of {date}? The current data on this phone will be replaced.',
    'settings.restore.yes': 'Restore',
    'settings.restore.no': 'Cancel',
    'settings.restore.done': 'Data restored from backup.',
    'settings.storage': 'Storage',
    'settings.storage.persisted': 'Your data is protected from automatic deletion.',
    'settings.storage.notPersisted': 'The phone may delete data when it runs out of space. Back up regularly.',
    'settings.storage.unknown': 'Could not check data protection. Back up regularly.',
    'settings.storage.usage': '{used} of {quota} used',
    'settings.about': 'About',
    'settings.version': 'Version {v}',

    'error.backup.invalid': 'This file is not a Struna backup. Choose a file whose name starts with “struna-”.',
    'error.backup.newer': 'This backup is from a newer version of Struna. Update the app first, then restore.',
    'error.backup.read': 'The file could not be read. Try choosing it again.',
    'error.save': 'Saving failed. Try again. If that does not help, close and reopen the app.',
    'error.boot': 'Struna could not start. Your data on this phone is safe. Close the app and open it again.',
    'error.newerData': 'The data on this phone is from a newer version of Struna. Update the app.',

    'update.available': 'A new version of Struna is available.',
    'update.button': 'Update',
  },
};

let current = 'cs';

export function setLang(lang) {
  current = LANGS.includes(lang) ? lang : 'cs';
  if (typeof document !== 'undefined') document.documentElement.lang = current;
}

export const getLang = () => current;

export function t(key, params = {}) {
  const text = TEXTS[current][key] ?? TEXTS.cs[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => (name in params ? String(params[name]) : `{${name}}`));
}

// Text s číslem ve správném tvaru: 1 den, 2 dny, 5 dní (anglicky 1 day, 2 days).
// Potřebuje klíče base.one, base.few a base.other.
export function tn(base, n, params = {}) {
  const category = new Intl.PluralRules(current === 'en' ? 'en' : 'cs').select(n);
  const key = `${base}.${category}` in TEXTS[current] ? `${base}.${category}` : `${base}.other`;
  return t(key, { n, ...params });
}

export function formatDate(date) {
  return new Intl.DateTimeFormat(current === 'en' ? 'en-GB' : 'cs-CZ', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(date);
}

export function formatBytes(bytes) {
  if (bytes == null) return '?';
  const mb = bytes / (1024 * 1024);
  const n = mb >= 1024 ? mb / 1024 : mb;
  const unit = mb >= 1024 ? 'GB' : 'MB';
  return `${n.toLocaleString(current === 'en' ? 'en-GB' : 'cs-CZ', { maximumFractionDigits: 1 })} ${unit}`;
}
