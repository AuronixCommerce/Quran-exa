import GuestChat from "@/components/guest-chat";

const popularSurahs = [
  { n: 1, en: "Al-Fatihah", ar: "الفاتحة", ayahs: 7 },
  { n: 2, en: "Al-Baqarah", ar: "البقرة", ayahs: 286 },
  { n: 18, en: "Al-Kahf", ar: "الكهف", ayahs: 110 },
  { n: 36, en: "Ya-Sin", ar: "يس", ayahs: 83 },
  { n: 55, en: "Ar-Rahman", ar: "الرحمن", ayahs: 78 },
  { n: 67, en: "Al-Mulk", ar: "الملك", ayahs: 30 },
];

const knowledge = [
  {
    title: "Quran",
    body: "The complete Quran with Arabic text and English and Urdu translations.",
    meta: "114 Surahs · Arabic, English & Urdu",
  },
  {
    title: "Hadith",
    body: "Explore the words and teachings of the Prophet ﷺ with clear source references.",
    meta: "Authentic collections",
  },
  {
    title: "Duas",
    body: "Quranic supplications and everyday duas, presented with their source context.",
    meta: "Quranic duas · Hisnul Muslim",
  },
  {
    title: "Six Kalmas",
    body: "Read and learn the Six Kalmas with Arabic text and translations.",
    meta: "Arabic · Urdu · English",
  },
];

export default function HomePage() {
  return (
    <main>
      <header className="siteHeader">
        <a className="brand" href="#top" aria-label="Quranexa AI home">
          <span className="brandMark">✧</span>
          <span>Quranexa AI</span>
        </a>
        <nav className="nav" aria-label="Primary navigation">
          <a href="#quran">Quran</a>
          <a href="#knowledge">Hadith</a>
          <a href="#knowledge">Duas</a>
          <a href="#ask">Ask Quranexa</a>
        </nav>
        <a className="accountButton" href="#ask">Account</a>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow">✧ ASK. READ. UNDERSTAND.</div>
        <h1>
          A deeper connection.
          <br />
          <em>One ayah at a time.</em>
        </h1>
        <p className="heroText">
          Read the Quran. Explore authentic sources. Find understanding with an Islamic AI companion built to keep the source at the center.
        </p>
        <div className="heroActions">
          <a className="primaryButton" href="#ask">Ask Quranexa</a>
          <a className="secondaryButton" href="#quran">Read Quran</a>
        </div>

        <div className="ayahCard" aria-label="Ayah to reflect on">
          <span className="tinyLabel">AN AYAH TO REFLECT ON</span>
          <p className="arabic" dir="rtl">فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا</p>
          <p className="translation">For indeed, with hardship will be ease.</p>
          <span className="reference">Ash-Sharh 94:5</span>
        </div>
      </section>

      <section className="section" id="knowledge">
        <div className="sectionHeading">
          <span className="tinyLabel">EXPLORE YOUR FAITH</span>
          <h2>Timeless knowledge, thoughtfully brought together.</h2>
        </div>
        <div className="knowledgeGrid">
          {knowledge.map((item) => (
            <article className="knowledgeCard" key={item.title}>
              <span className="cardGlyph">✧</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <span className="cardMeta">{item.meta}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section readingSection" id="quran">
        <div className="readingIntro">
          <span className="tinyLabel">BEGIN YOUR READING JOURNEY</span>
          <h2>Al-Fatihah</h2>
          <p>Start with the opening chapter and continue your reading journey with clarity and focus.</p>
          <a className="primaryButton" href="#surahs">Read now</a>
        </div>
        <div className="surahPanel" id="surahs">
          <div className="panelHeader">
            <h3>Popular Surahs</h3>
            <span>114 Surahs</span>
          </div>
          <div className="surahList">
            {popularSurahs.map((surah) => (
              <div className="surahRow" key={surah.n}>
                <span className="surahNumber">{surah.n}</span>
                <div>
                  <strong>{surah.en}</strong>
                  <span className="surahMeta">{surah.ayahs} Ayahs</span>
                </div>
                <span className="surahArabic arabic" dir="rtl">{surah.ar}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section askSection" id="ask">
        <div className="sectionHeading centered">
          <span className="tinyLabel">ASK QURANEXA</span>
          <h2>Grounded in sources. Guided by understanding.</h2>
          <p>Ask about Quranic themes, meanings, references, duas, hadith context, and Islamic learning.</p>
        </div>
        <GuestChat />
      </section>

      <section className="section ceoSection">
        <div className="ceoCard">
          <span className="tinyLabel">A MESSAGE FROM OUR CEO</span>
          <h2>Muhammad Mohsin Adnan</h2>
          <span className="ceoRole">Chief Executive Officer · Quranexa AI</span>
          <p>
            We want Quranexa to make meaningful study easier: a calm space to read the Quran, ask thoughtful questions, and return to the sources. Technology should support understanding with humility and care.
          </p>
          <p>
            Our commitment is to keep the original text at the center, make references clear, and acknowledge what we cannot verify.
          </p>
          <p className="ceoClose"><em>Ask with curiosity. Read with care. Seek understanding.</em></p>
        </div>
      </section>

      <footer className="footer">
        <div>
          <strong>Quranexa AI</strong>
          <span>Ask. Read. Understand.</span>
        </div>
        <div className="footerLinks">
          <a href="#knowledge">Six Kalmas</a>
          <a href="#knowledge">Our sources</a>
          <a href="#top">Privacy & cookies</a>
        </div>
        <span>© 2026 Quranexa AI</span>
      </footer>
    </main>
  );
}
