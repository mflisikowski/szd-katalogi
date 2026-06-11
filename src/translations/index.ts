import type { NestedKeysStripped, TFunction } from '@payloadcms/translations'
import type { Config } from 'payload'

import { pl } from './pl'

export const translations: NonNullable<Config['i18n']>['translations'] = { pl }

export type TranslationDictionary = typeof pl
export type TranslationKeys = NestedKeysStripped<TranslationDictionary>

// Payload's LabelFunction passes TFunction<DefaultTranslationKeys>, but our label callbacks
// call t() with custom translation keys not in DefaultTranslationKeys.
// The runtime translation system resolves all keys correctly — this is purely a type-level mismatch.
// biome-ignore lint/suspicious/noExplicitAny: see above
export type TLabel = { t: TFunction<any> }
