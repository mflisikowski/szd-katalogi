import { WatchTenantCollection as WatchTenantCollection_1d0591e3cf4f332c83a86da13a0de59a } from '@payloadcms/plugin-multi-tenant/client'
import { TenantField as TenantField_1d0591e3cf4f332c83a86da13a0de59a } from '@payloadcms/plugin-multi-tenant/client'
import { CatalogBulkUpload as CatalogBulkUpload_fbdc09281884436baee7ab5554a51692 } from './/collections/catalogs/catalog-bulk-upload'
import { AssignTenantFieldTrigger as AssignTenantFieldTrigger_1d0591e3cf4f332c83a86da13a0de59a } from '@payloadcms/plugin-multi-tenant/client'
import { DuplicateMediaGuard as DuplicateMediaGuard_295259ae796316dc964fc9cdf8295f5b } from './/collections/media/duplicate-media-guard'
import { TenantSelector as TenantSelector_d6d5f193a167989e2ee7d14202901e62 } from '@payloadcms/plugin-multi-tenant/rsc'
import { TenantSelectionProvider as TenantSelectionProvider_d6d5f193a167989e2ee7d14202901e62 } from '@payloadcms/plugin-multi-tenant/rsc'
import { AzureClientUploadHandler as AzureClientUploadHandler_635fb302eaf52f6baca4f9f8ad9ce104 } from '@payloadcms/storage-azure/client'
import { CollectionCards as CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1 } from '@payloadcms/next/rsc'

/** @type import('payload').ImportMap */
export const importMap = {
  "@payloadcms/plugin-multi-tenant/client#WatchTenantCollection": WatchTenantCollection_1d0591e3cf4f332c83a86da13a0de59a,
  "@payloadcms/plugin-multi-tenant/client#TenantField": TenantField_1d0591e3cf4f332c83a86da13a0de59a,
  "/collections/catalogs/catalog-bulk-upload#CatalogBulkUpload": CatalogBulkUpload_fbdc09281884436baee7ab5554a51692,
  "@payloadcms/plugin-multi-tenant/client#AssignTenantFieldTrigger": AssignTenantFieldTrigger_1d0591e3cf4f332c83a86da13a0de59a,
  "/collections/media/duplicate-media-guard#DuplicateMediaGuard": DuplicateMediaGuard_295259ae796316dc964fc9cdf8295f5b,
  "@payloadcms/plugin-multi-tenant/rsc#TenantSelector": TenantSelector_d6d5f193a167989e2ee7d14202901e62,
  "@payloadcms/plugin-multi-tenant/rsc#TenantSelectionProvider": TenantSelectionProvider_d6d5f193a167989e2ee7d14202901e62,
  "@payloadcms/storage-azure/client#AzureClientUploadHandler": AzureClientUploadHandler_635fb302eaf52f6baca4f9f8ad9ce104,
  "@payloadcms/next/rsc#CollectionCards": CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1
}
