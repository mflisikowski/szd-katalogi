import { catalogsTranslations } from '@/collections/catalogs/translations'
import { categoriesTranslations } from '@/collections/categories/translations'
import { mediaTranslations } from '@/collections/media/translations'
import { tenantsTranslations } from '@/collections/tenants/translations'
import { usersTranslations } from '@/collections/users/translations'

export const pl = {
  custom: {
    catalogs: catalogsTranslations,
    categories: categoriesTranslations,
    media: mediaTranslations,
    tenants: tenantsTranslations,
    users: usersTranslations,
  },
} as const
