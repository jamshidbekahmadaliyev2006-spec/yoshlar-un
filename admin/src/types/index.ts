export type UserRole = 'Yoshlar' | 'Talaba' | 'Sportchi' | 'Volontyor' | 'Ish qidiruvchi' | 'ADMIN' | 'USER' | 'COACH';

export type UserStatus = 0 | 1 | 2; // 0: Faol, 1: Nofaol, 2: Bloklangan

export interface UserItem {
  id: number;
  n: string;
  p: string;
  r: string;
  d: string;
  s: UserStatus;
  mahalla?: string;
  allowEvents?: boolean;
  smsNotifications?: boolean;
}

export interface PlaceItem {
  id: number;
  n: string;
  x: number;
  y: number;
  category?: string;
  address?: string;
}

export interface EventItem {
  id: number;
  t: number; // type index 0..5
  title: string;
  loc: number; // location index in LOCS
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  ages: string;
  going: number;
  came?: number;
  desc: string;
  img?: string;
}

export interface MahallaStat {
  n: string;
  k: number; // events count
  r: number; // registered youth count
  avg?: number; // average registered per event
  c?: number;
  p?: number;
  i?: number;
}

export interface SettingsConfig {
  tuman: string;
  sys: string;
  email: string;
  tel: string;
  login: string;
  n: number[]; // notifications [1, 1, 1]
}

export interface StatsOverview {
  totalUsers: number;
  totalEvents: number;
  activeParticipants: number;
  todayEvents: number;
}

