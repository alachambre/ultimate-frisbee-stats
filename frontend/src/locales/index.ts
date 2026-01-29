import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import English translations
import commonEN from './en/common.json';
import navigationEN from './en/navigation.json';
import teamsEN from './en/teams.json';
import playersEN from './en/players.json';
import competitionsEN from './en/competitions.json';
import gamesEN from './en/games.json';
import pointsEN from './en/points.json';
import linesEN from './en/lines.json';
import strategiesEN from './en/strategies.json';
import statisticsEN from './en/statistics.json';

// Import French translations
import commonFR from './fr/common.json';
import navigationFR from './fr/navigation.json';
import teamsFR from './fr/teams.json';
import playersFR from './fr/players.json';
import competitionsFR from './fr/competitions.json';
import gamesFR from './fr/games.json';
import pointsFR from './fr/points.json';
import linesFR from './fr/lines.json';
import strategiesFR from './fr/strategies.json';
import statisticsFR from './fr/statistics.json';

const resources = {
  en: {
    common: commonEN,
    navigation: navigationEN,
    teams: teamsEN,
    players: playersEN,
    competitions: competitionsEN,
    games: gamesEN,
    points: pointsEN,
    lines: linesEN,
    strategies: strategiesEN,
    statistics: statisticsEN,
  },
  fr: {
    common: commonFR,
    navigation: navigationFR,
    teams: teamsFR,
    players: playersFR,
    competitions: competitionsFR,
    games: gamesFR,
    points: pointsFR,
    lines: linesFR,
    strategies: strategiesFR,
    statistics: statisticsFR,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false, // React already escapes
    },
    react: {
      useSuspense: false, // Disable suspense for test compatibility
    },
  });

export default i18n;
