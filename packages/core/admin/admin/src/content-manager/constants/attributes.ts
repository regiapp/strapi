const CREATED_BY_ATTRIBUTE_NAME = 'created_by';
const UPDATED_BY_ATTRIBUTE_NAME = 'updated_by';

const CREATOR_FIELDS = [CREATED_BY_ATTRIBUTE_NAME, UPDATED_BY_ATTRIBUTE_NAME];

const PUBLISHED_BY_ATTRIBUTE_NAME = 'published_by';
const CREATED_AT_ATTRIBUTE_NAME = 'created_at';
const UPDATED_AT_ATTRIBUTE_NAME = 'updated_at';
const PUBLISHED_AT_ATTRIBUTE_NAME = 'published_at';

const DOCUMENT_META_FIELDS = [
  ...CREATOR_FIELDS,
  PUBLISHED_BY_ATTRIBUTE_NAME,
  CREATED_AT_ATTRIBUTE_NAME,
  UPDATED_AT_ATTRIBUTE_NAME,
  PUBLISHED_AT_ATTRIBUTE_NAME,
];

export {
  CREATED_AT_ATTRIBUTE_NAME,
  UPDATED_AT_ATTRIBUTE_NAME,
  PUBLISHED_AT_ATTRIBUTE_NAME,
  CREATED_BY_ATTRIBUTE_NAME,
  UPDATED_BY_ATTRIBUTE_NAME,
  PUBLISHED_BY_ATTRIBUTE_NAME,
  CREATOR_FIELDS,
  DOCUMENT_META_FIELDS,
};
