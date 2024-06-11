import { adminApi } from '@strapi/admin/strapi-admin';

const contentManagerApi = adminApi.enhanceEndpoints({
  addTagTypes: [
    'ComponentConfiguration',
    'ContentTypesConfiguration',
    'ContentTypeSettings',
    'Document',
    'InitialData',
    'HistoryVersion',
    'Relations',
    'Release',
    'ReleaseAction',
  ],
});

export { contentManagerApi };
