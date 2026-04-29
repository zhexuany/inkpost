import type { InkPostTheme } from '../types';
import { defaultTheme } from '../default-theme';
import { literaryTheme } from './literary';
import { techTheme } from './tech';
import { minimalTheme } from './minimal';
import { darkTheme } from './dark';
import { businessTheme } from './business';

export const presetThemes: InkPostTheme[] = [
  defaultTheme,
  literaryTheme,
  techTheme,
  minimalTheme,
  darkTheme,
  businessTheme,
];
