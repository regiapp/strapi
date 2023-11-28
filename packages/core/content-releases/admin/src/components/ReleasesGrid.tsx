import { EmptyStateLayout, Flex, Grid, GridItem, Typography } from '@strapi/design-system';
import { Link } from '@strapi/design-system/v2';
import { EmptyDocuments } from '@strapi/icons';
import { useIntl } from 'react-intl';
import styled from 'styled-components';

import { GetReleases } from '../../../shared/contracts/releases';

interface ReleasesGridProps {
  sectionTitle: 'pending' | 'done';
  releases?: GetReleases.Response['data'];
}

const LinkCard = styled(Link)`
  display: block;
`;

const ReleasesGrid = ({ sectionTitle, releases = [] }: ReleasesGridProps) => {
  const { formatMessage } = useIntl();

  if (releases?.length === 0) {
    return (
      <EmptyStateLayout
        content={formatMessage(
          {
            id: 'content-releases.page.Releases.tab.emptyEntries',
            defaultMessage: 'No releases',
          },
          {
            target: sectionTitle,
          }
        )}
        icon={<EmptyDocuments width="10rem" />}
      />
    );
  }

  return (
    <Grid gap={4}>
      {releases.map(({ id, name }) => (
        <GridItem col={3} s={6} xs={12} key={id}>
          <LinkCard href={`content-releases/${id}`} isExternal={false}>
            <Flex
              direction="column"
              justifyContent="space-between"
              padding={4}
              hasRadius
              background="neutral0"
              shadow="tableShadow"
              height="100%"
              width="100%"
              alignItems="start"
            >
              <Typography as="h3" variant="delta" fontWeight="bold">
                {name}
              </Typography>
            </Flex>
          </LinkCard>
        </GridItem>
      ))}
    </Grid>
  );
};

export { ReleasesGrid };
