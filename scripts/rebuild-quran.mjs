import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const dataDir = join(root, "data");
const metadataPath = join(dataDir, "metadata", "HafsLists.txt");

function extractNumberList(source, name) {
  const match = source.match(
    new RegExp(`export const ${name}[^=]*=\\s*\\[([\\s\\S]*?)\\]\\s*as const`),
  );
  if (!match) throw new Error(`Could not find ${name} in HafsLists.txt`);
  return [...match[1].matchAll(/\d+/g)].map((m) => Number(m[0]));
}

function position(starts, ayahId) {
  let low = 0;
  let high = starts.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (starts[mid] <= ayahId) low = mid + 1;
    else high = mid;
  }
  return Math.max(1, low);
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const metadataSource = await readFile(metadataPath, "utf8");
const juzStarts = extractNumberList(metadataSource, "JuzList").filter((n) => n > 0);
const pageStarts = extractNumberList(metadataSource, "PageList").filter((n) => n > 0);
const hizbQuarterStarts = extractNumberList(metadataSource, "HizbQuarterList").filter(
  (n) => n > 0,
);
const sajdaIds = new Set(extractNumberList(metadataSource, "SajdaList"));

const surahs = [];
let globalAyahId = 0;

for (let surahId = 1; surahId <= 114; surahId += 1) {
  const [english, urdu] = await Promise.all([
    readFile(join(dataDir, "quran", "en", `${surahId}.json`), "utf8").then(JSON.parse),
    readFile(join(dataDir, "quran", "ur", `${surahId}.json`), "utf8").then(JSON.parse),
  ]);

  if (english.id !== surahId || urdu.id !== surahId) {
    throw new Error(`Unexpected Surah id while rebuilding Surah ${surahId}`);
  }
  if (english.verses.length !== urdu.verses.length) {
    throw new Error(`English/Urdu verse count mismatch in Surah ${surahId}`);
  }

  const verses = english.verses.map((verse, index) => {
    const urduVerse = urdu.verses[index];
    if (!urduVerse || urduVerse.id !== verse.id || urduVerse.text !== verse.text) {
      throw new Error(`English/Urdu alignment mismatch at ${surahId}:${verse.id}`);
    }

    globalAyahId += 1;
    const quarter = position(hizbQuarterStarts, globalAyahId);

    return {
      id: verse.id,
      text: verse.text,
      translation: verse.translation,
      transliteration: verse.transliteration,
      urdu: urduVerse.translation,
      juz: position(juzStarts, globalAyahId),
      page: position(pageStarts, globalAyahId),
      hizb: Math.ceil(quarter / 4),
      sajdah: sajdaIds.has(globalAyahId),
    };
  });

  surahs.push({
    id: english.id,
    name: english.name,
    transliteration: english.transliteration,
    translation: english.translation,
    type: english.type,
    total_verses: english.total_verses,
    verses,
    slug: slugify(english.transliteration),
  });
}

if (surahs.length !== 114 || globalAyahId !== 6236) {
  throw new Error(
    `Quran rebuild validation failed: ${surahs.length} Surahs / ${globalAyahId} ayahs`,
  );
}

const outputPath = join(dataDir, "quran.json");
await writeFile(outputPath, JSON.stringify(surahs), "utf8");
console.log(`Rebuilt data/quran.json: 114 Surahs / ${globalAyahId} ayahs`);
