import * as React from 'react';

import {
  ConfirmDialog,
  useNotification,
  useQueryParams,
  useRBAC,
} from '@strapi/admin/strapi-admin';
import { BaseHeaderLayout, Button, Typography, Flex } from '@strapi/design-system';
import { Link } from '@strapi/design-system/v2';
import { ArrowLeft, ExclamationMarkCircle } from '@strapi/icons';
import { UID } from '@strapi/types';
import { stringify } from 'qs';
import { useIntl } from 'react-intl';
import { NavLink, useNavigate, useParams, type To } from 'react-router-dom';

import { COLLECTION_TYPES } from '../../constants/collections';
import { PERMISSIONS } from '../../constants/plugin';
import { useHistoryContext } from '../pages/History';
import { useRestoreVersionMutation } from '../services/historyVersion';

interface VersionHeaderProps {
  headerId: string;
}

export const VersionHeader = ({ headerId }: VersionHeaderProps) => {
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false);
  const navigate = useNavigate();
  const { formatMessage, formatDate } = useIntl();
  const { toggleNotification } = useNotification();

  const version = useHistoryContext('VersionHeader', (state) => state.selectedVersion);
  const mainField = useHistoryContext('VersionHeader', (state) => state.mainField);
  const schema = useHistoryContext('VersionHeader', (state) => state.schema);
  const isCurrentVersion = useHistoryContext(
    'VersionHeader',
    (state) => state.page === 1 && state.versions.data[0].id === state.selectedVersion.id
  );

  const [{ query }] = useQueryParams<{
    plugins?: Record<string, unknown>;
  }>();
  const { collectionType, slug } = useParams<{ collectionType: string; slug: UID.ContentType }>();
  const [restoreVersion, { isLoading }] = useRestoreVersionMutation();

  const { allowedActions } = useRBAC(PERMISSIONS.map((action) => ({ action, subject: slug })));

  const mainFieldValue = version.data[mainField];

  const getBackLink = (): To => {
    const pluginsQueryParams = stringify({ plugins: query.plugins }, { encode: false });

    if (collectionType === COLLECTION_TYPES) {
      return {
        pathname: `../${collectionType}/${version.contentType}/${version.relatedDocumentId}`,
        search: pluginsQueryParams,
      };
    }

    return {
      pathname: `../${collectionType}/${version.contentType}`,
      search: pluginsQueryParams,
    };
  };

  const handleRestore = async () => {
    try {
      const response = await restoreVersion({
        params: { versionId: version.id },
        body: { contentType: version.contentType },
      });

      if ('data' in response) {
        navigate(`/content-manager/${collectionType}/${slug}/${response.data.data?.documentId}`);

        toggleNotification({
          type: 'success',
          title: formatMessage({
            id: 'content-manager.restore.success.title',
            defaultMessage: 'Version restored.',
          }),
          message: formatMessage({
            id: 'content-manager.restore.success.message',
            defaultMessage: 'The content of the restored version is not published yet.',
          }),
        });

        return;
      }

      if ('error' in response) {
        toggleNotification({
          type: 'danger',
          message: formatMessage({
            id: 'content-manager.history.restore.error.message',
            defaultMessage: 'Could not restore version.',
          }),
        });
      }
    } catch (error) {
      toggleNotification({
        type: 'danger',
        message: formatMessage({ id: 'notification.error', defaultMessage: 'An error occurred' }),
      });
    }
  };

  return (
    <>
      <BaseHeaderLayout
        id={headerId}
        title={formatDate(new Date(version.createdAt), {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        })}
        subtitle={
          <Typography variant="epsilon">
            {formatMessage(
              {
                id: 'content-manager.history.version.subtitle',
                defaultMessage:
                  '{hasLocale, select, true {{subtitle}, in {locale}} other {{subtitle}}}',
              },
              {
                hasLocale: Boolean(version.locale),
                subtitle: `${mainFieldValue || ''} (${schema.info.singularName})`.trim(),
                locale: version.locale?.name,
              }
            )}
          </Typography>
        }
        navigationAction={
          <Link
            startIcon={<ArrowLeft />}
            as={NavLink}
            // @ts-expect-error - types are not inferred correctly through the as prop.
            to={getBackLink()}
          >
            {formatMessage({
              id: 'global.back',
              defaultMessage: 'Back',
            })}
          </Link>
        }
        sticky={false}
        primaryAction={
          <Button
            disabled={!allowedActions.canUpdate || isCurrentVersion}
            onClick={() => {
              setIsConfirmDialogOpen(true);
            }}
          >
            {formatMessage({
              id: 'content-manager.history.restore.confirm.button',
              defaultMessage: 'Restore',
            })}
          </Button>
        }
      />
      <ConfirmDialog
        zIndex={99999}
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleRestore}
        icon={<ExclamationMarkCircle />}
        endAction={
          <Button variant="secondary" onClick={handleRestore} loading={isLoading}>
            {formatMessage({
              id: 'content-manager.history.restore.confirm.button',
              defaultMessage: 'Restore',
            })}
          </Button>
        }
      >
        <Flex
          direction="column"
          alignItems="center"
          justifyContent="center"
          gap={2}
          textAlign="center"
        >
          <Typography>
            {formatMessage({
              id: 'content-manager.history.restore.confirm.title',
              defaultMessage: 'Are you sure you want to restore this version?',
            })}
          </Typography>
          <Typography>
            {formatMessage(
              {
                id: 'content-manager.history.restore.confirm.message',
                defaultMessage:
                  "{isDraft, select, true {The restored content will override your draft.} other {The restored content won't be published, it will override the draft and be saved as pending changes. You'll be able to publish the changes at anytime.}}",
              },
              {
                isDraft: version.status === 'draft',
              }
            )}
          </Typography>
        </Flex>
      </ConfirmDialog>
    </>
  );
};
