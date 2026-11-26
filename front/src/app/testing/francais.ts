import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

registerLocaleData(localeFr);

export const enFrancais = { provide: LOCALE_ID, useValue: 'fr-FR' };
