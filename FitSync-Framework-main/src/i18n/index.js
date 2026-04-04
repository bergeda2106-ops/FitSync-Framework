import { tr } from './tr.js';
import { en } from './en.js';

const translations = { tr, en };

class I18n {
  constructor() {
    this.currentLang = localStorage.getItem('fitsync_lang') || 'tr';
  }

  t(key) {
    const lang = translations[this.currentLang];
    if (lang && lang[key] !== undefined) return lang[key];
    // Fallback to Turkish
    if (translations.tr[key] !== undefined) return translations.tr[key];
    return key;
  }

  setLang(lang) {
    if (translations[lang]) {
      this.currentLang = lang;
      localStorage.setItem('fitsync_lang', lang);
      // Dispatch event for UI update
      window.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
    }
  }

  getLang() {
    return this.currentLang;
  }

  toggleLang() {
    this.setLang(this.currentLang === 'tr' ? 'en' : 'tr');
  }
}

export const i18n = new I18n();
export const t = (key) => i18n.t(key);
