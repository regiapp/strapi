import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { stringify } from 'qs';
import { useLocation } from 'react-router-dom';
import { useQueryParams } from '@strapi/helper-plugin';
import { HeaderLayout } from '@strapi/design-system/Layout';
import { Button } from '@strapi/design-system/Button';
import { Stack } from '@strapi/design-system/Stack';
import { Link } from '@strapi/design-system/Link';
import ArrowLeft from '@strapi/icons/ArrowLeft';
import Plus from '@strapi/icons/Plus';

import { Breadcrumbs } from '../../../components/Breadcrumbs';
import { getTrad } from '../../../utils';
import { BreadcrumbsDefinition, FolderDefinition } from '../../../constants';

export const Header = ({
  canCreate,
  onToggleEditFolderDialog,
  onToggleUploadAssetDialog,
  folder,
  breadcrumbs,
}) => {
  const { formatMessage } = useIntl();
  const { pathname } = useLocation();
  const [{ query }] = useQueryParams();
  const backQuery = {
    ...query,
    folder: folder?.parent?.id ?? undefined,
  };
  const name = folder?.name?.length > 30 ? `${folder.name.slice(0, 30)}...` : folder?.name;

  return (
    <HeaderLayout
      title={`${formatMessage({
        id: getTrad('plugin.name'),
        defaultMessage: `Media Library`,
      })}${name ? ` - ${name}` : ''}`}
      subtitle={breadcrumbs && <Breadcrumbs label="Folders navigation" breadcrumbs={breadcrumbs} />}
      navigationAction={
        folder && (
          <Link
            startIcon={<ArrowLeft />}
            to={`${pathname}?${stringify(backQuery, { encode: false })}`}
          >
            {formatMessage({
              id: getTrad('header.actions.folder-level-up'),
              defaultMessage: 'Back',
            })}
          </Link>
        )
      }
      primaryAction={
        canCreate && (
          <Stack horizontal spacing={2}>
            <Button startIcon={<Plus />} variant="secondary" onClick={onToggleEditFolderDialog}>
              {formatMessage({
                id: getTrad('header.actions.add-folder'),
                defaultMessage: 'Add new folder',
              })}
            </Button>

            <Button startIcon={<Plus />} onClick={onToggleUploadAssetDialog}>
              {formatMessage({
                id: getTrad('header.actions.add-assets'),
                defaultMessage: 'Add new assets',
              })}
            </Button>
          </Stack>
        )
      }
    />
  );
};

Header.defaultProps = {
  breadcrumbs: false,
  folder: null,
};

Header.propTypes = {
  breadcrumbs: PropTypes.oneOfType([BreadcrumbsDefinition, PropTypes.bool]),
  canCreate: PropTypes.bool.isRequired,
  folder: FolderDefinition,
  onToggleEditFolderDialog: PropTypes.func.isRequired,
  onToggleUploadAssetDialog: PropTypes.func.isRequired,
};
