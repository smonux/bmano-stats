import { getLanguage, supportedLanguage, type Language } from './index';
export function savedVoiceLanguage(): Language { try { return supportedLanguage(localStorage.getItem('handball-voice-language') ?? getLanguage()); } catch { return getLanguage(); } }
export const voiceKeywords: Record<Language,string[]> = {
 es:['gol','dorsal','nuestro','nosotros','ellos','rival','parada','pasos','dobles','pisando','exclusión','penalti','pasivo'],
 en:['goal','number','our','us','they','opponent','save','steps','double dribble','goal area','suspension','penalty','passive'],
 de:['Tor','Nummer','unser','wir','sie','Gegner','Parade','Schritte','Doppeldribbling','Kreis','Zeitstrafe','Siebenmeter','passiv'],
 fr:['but','numéro','notre','nous','eux','adversaire','arrêt','marcher','reprise de dribble','zone','exclusion','sept mètres','passif'],
 it:['gol','numero','nostro','noi','loro','avversario','parata','passi','doppio palleggio','area','esclusione','rigore','passivo'],
 nl:['doelpunt','rugnummer','ons','wij','zij','tegenstander','redding','loopfout','dubbele dribbel','cirkel','tijdstraf','strafworp','passief'],
 pl:['bramka','numer','nasz','my','oni','rywal','obrona','kroki','podwójne kozłowanie','pole bramkowe','wykluczenie','karny','pasywna'],
};
