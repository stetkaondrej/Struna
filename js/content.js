// Načtení obsahu (akordy, úkoly) ze složky content/. Soubory ukládá service worker, takže fungují offline.
let cache = null;

export async function loadContent() {
  if (cache) return cache;
  const get = async (name) => {
    const res = await fetch(`./content/${name}.json`);
    if (!res.ok) throw new Error(`CONTENT_${name}`);
    return res.json();
  };
  const [chords, quests, worlds] = await Promise.all([get('chords'), get('quests'), get('worlds')]);
  cache = { chords: chords.chords, quests: quests.quests, worlds: worlds.worlds };
  return cache;
}
