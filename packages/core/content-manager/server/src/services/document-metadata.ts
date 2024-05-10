import { groupBy, pick } from 'lodash/fp';

import { contentTypes } from '@strapi/utils';
import type { Core, UID, Modules } from '@strapi/types';

import type { DocumentMetadata } from '../../../shared/contracts/collection-types';

export interface DocumentVersion {
  id: number;
  documentId: Modules.Documents.ID;
  locale: string;
  updatedAt: string | null | Date;
  publishedAt: string | null | Date;
}

const AVAILABLE_STATUS_FIELDS = [
  'id',
  'locale',
  'updatedAt',
  'createdAt',
  'publishedAt',
  'createdBy',
  'updatedBy',
  'status',
];
const AVAILABLE_LOCALES_FIELDS = ['id', 'locale', 'updatedAt', 'createdAt', 'status'];

const CONTENT_MANAGER_STATUS = {
  PUBLISHED: 'published',
  DRAFT: 'draft',
  MODIFIED: 'modified',
};

/**
 * Controls the metadata properties to be returned
 *
 * If `availableLocales` is set to `true` (default), the returned metadata will include
 * the available locales of the document for its current status.
 *
 * If `availableStatus` is set to `true` (default), the returned metadata will include
 * the available status of the document for its current locale.
 */
export interface GetMetadataOptions {
  availableLocales?: boolean;
  availableStatus?: boolean;
}

/**
 * Checks if the provided document version has been modified after all other versions.
 */
const getIsVersionLatestModification = (
  version?: DocumentVersion,
  otherVersion?: DocumentVersion
): boolean => {
  if (!version || !version.updatedAt) {
    return false;
  }

  const versionUpdatedAt = version?.updatedAt ? new Date(version.updatedAt).getTime() : 0;

  const otherUpdatedAt = otherVersion?.updatedAt ? new Date(otherVersion.updatedAt).getTime() : 0;

  return versionUpdatedAt > otherUpdatedAt;
};

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Returns available locales of a document for the current status
   */
  getAvailableLocales(
    uid: UID.ContentType,
    version: DocumentVersion,
    allVersions: DocumentVersion[]
  ) {
    // Group all versions by locale
    const versionsByLocale = groupBy('locale', allVersions);

    // Delete the current locale
    delete versionsByLocale[version.locale];

    // For each locale, get the ones with the same status
    return (
      Object.values(versionsByLocale)
        .map((localeVersions: DocumentVersion[]) => {
          // There will not be a draft and a version counterpart if the content type does not have draft and publish
          if (!contentTypes.hasDraftAndPublish(strapi.getModel(uid))) {
            return pick(AVAILABLE_LOCALES_FIELDS, localeVersions[0]);
          }

          const draftVersion = localeVersions.find((v) => v.publishedAt === null);
          const otherVersions = localeVersions.filter((v) => v.id !== draftVersion?.id);

          if (!draftVersion) return;

          return {
            ...pick(AVAILABLE_LOCALES_FIELDS, draftVersion),
            status: this.getStatus(draftVersion, otherVersions as any),
          };
        })
        // Filter just in case there is a document with no drafts
        .filter(Boolean)
    );
  },

  /**
   * Returns available status of a document for the current locale
   */
  getAvailableStatus(version: DocumentVersion, allVersions: DocumentVersion[]) {
    // Find the other status of the document
    const status =
      version.publishedAt !== null
        ? CONTENT_MANAGER_STATUS.DRAFT
        : CONTENT_MANAGER_STATUS.PUBLISHED;

    // Get version that match the current locale and not match the current status
    const availableStatus = allVersions.find((v) => {
      const matchLocale = v.locale === version.locale;
      const matchStatus = status === 'published' ? v.publishedAt !== null : v.publishedAt === null;
      return matchLocale && matchStatus;
    });

    if (!availableStatus) return availableStatus;

    // Pick status fields (at fields, status, by fields), use lodash fp
    return pick(AVAILABLE_STATUS_FIELDS, availableStatus);
  },
  /**
   * Get the available status of many documents, useful for batch operations
   * @param uid
   * @param documents
   * @returns
   */
  async getManyAvailableStatus(uid: UID.ContentType, documents: DocumentVersion[]) {
    if (!documents.length) return [];

    // The status and locale of all documents should be the same
    const status = documents[0].publishedAt !== null ? 'published' : 'draft';
    const locale = documents[0]?.locale;
    const otherStatus = status === 'published' ? 'draft' : 'published';

    return strapi.documents(uid).findMany({
      filters: {
        documentId: { $in: documents.map((d) => d.documentId).filter(Boolean) },
      },
      status: otherStatus,
      locale,
      fields: ['documentId', 'locale', 'updatedAt', 'createdAt', 'publishedAt'],
    }) as unknown as DocumentMetadata['availableStatus'];
  },

  getStatus(version: DocumentVersion, otherDocumentStatuses?: DocumentMetadata['availableStatus']) {
    let draftVersion: DocumentVersion | undefined;
    let publishedVersion: DocumentVersion | undefined;

    if (version.publishedAt) {
      publishedVersion = version;
    } else {
      draftVersion = version;
    }

    const otherVersion = otherDocumentStatuses?.at(0);
    if (otherVersion?.publishedAt) {
      publishedVersion = otherVersion;
    } else if (otherVersion) {
      draftVersion = otherVersion;
    }

    if (!draftVersion) return CONTENT_MANAGER_STATUS.PUBLISHED;
    if (!publishedVersion) return CONTENT_MANAGER_STATUS.DRAFT;

    /*
     * The document is modified if the draft version has been updated more
     * recently than the published version.
     */
    const isDraftModified = getIsVersionLatestModification(draftVersion, publishedVersion);
    return isDraftModified ? CONTENT_MANAGER_STATUS.MODIFIED : CONTENT_MANAGER_STATUS.PUBLISHED;
  },

  async getMetadata(
    uid: UID.ContentType,
    version: DocumentVersion,
    { availableLocales = true, availableStatus = true }: GetMetadataOptions = {}
  ) {
    // TODO: Ignore publishedAt if availableStatus=false, and ignore locale if i18n is disabled
    // TODO: Sanitize createdBy
    const versions = await strapi.db.query(uid).findMany({
      where: { documentId: version.documentId },
      select: ['createdAt', 'updatedAt', 'locale', 'publishedAt', 'documentId'],
      populate: {
        createdBy: {
          select: ['id', 'firstname', 'lastname', 'email'],
        },
        updatedBy: {
          select: ['id', 'firstname', 'lastname', 'email'],
        },
      },
    });

    const availableLocalesResult = availableLocales
      ? this.getAvailableLocales(uid, version, versions)
      : [];

    const availableStatusResult = availableStatus
      ? this.getAvailableStatus(version, versions)
      : null;

    return {
      availableLocales: availableLocalesResult,
      availableStatus: availableStatusResult ? [availableStatusResult] : [],
    };
  },

  /**
   * Returns associated metadata of a document:
   * - Available locales of the document for the current status
   * - Available status of the document for the current locale
   */
  async formatDocumentWithMetadata(
    uid: UID.ContentType,
    document: DocumentVersion,
    opts: GetMetadataOptions = {}
  ) {
    if (!document) return document;

    const hasDraftAndPublish = contentTypes.hasDraftAndPublish(strapi.getModel(uid));

    // Ignore available status if the content type does not have draft and publish
    if (!hasDraftAndPublish) {
      opts.availableStatus = false;
    }

    const meta = await this.getMetadata(uid, document, opts);

    // TODO: Sanitize output of metadata
    return {
      data: {
        ...document,
        // Add status to the document only if draft and publish is enabled
        status: hasDraftAndPublish
          ? this.getStatus(document, meta.availableStatus as any)
          : undefined,
      },
      meta,
    };
  },
});
