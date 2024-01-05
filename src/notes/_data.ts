import type { Page } from 'lume/core.ts';
import { idOf } from '../../_config.ts';

// Helpers

export const notePermalinkOf = (date: Date) => `/mind/${idOf(date)}/`;

// Public, for template use

export const url = (page: Page) => notePermalinkOf(page.data.date);
