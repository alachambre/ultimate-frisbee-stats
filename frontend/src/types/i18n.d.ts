import 'react-i18next';
import commonEN from '../locales/en/common.json';
import navigationEN from '../locales/en/navigation.json';
import teamsEN from '../locales/en/teams.json';
import playersEN from '../locales/en/players.json';
import competitionsEN from '../locales/en/competitions.json';
import gamesEN from '../locales/en/games.json';
import pointsEN from '../locales/en/points.json';
import linesEN from '../locales/en/lines.json';
import strategiesEN from '../locales/en/strategies.json';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof commonEN;
      navigation: typeof navigationEN;
      teams: typeof teamsEN;
      players: typeof playersEN;
      competitions: typeof competitionsEN;
      games: typeof gamesEN;
      points: typeof pointsEN;
      lines: typeof linesEN;
      strategies: typeof strategiesEN;
    };
  }
}
