import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { pxToRem } from '@strapi/helper-plugin';
import { Portal } from '@strapi/design-system/Portal';
import { FocusTrap } from '@strapi/design-system/FocusTrap';
import { Flex } from '@strapi/design-system/Flex';
import { Box } from '@strapi/design-system/Box';
import { Stack } from '@strapi/design-system/Stack';
import { IconButton } from '@strapi/design-system/IconButton';
import { Button } from '@strapi/design-system/Button';
import Cross from '@strapi/icons/Cross';

const ModalWrapper = styled(Flex)`
  position: fixed;
  z-index: 4;
  inset: 0;
  /* this is theme.colors.neutral800 with opacity */
  background: rgb(50, 50, 77, 0.2);
`;

const Modal = ({ onClose, children }) => {
  const { formatMessage } = useIntl();

  return (
    <Portal>
      <ModalWrapper onClick={onClose} padding={8} justifyContent="center">
        <FocusTrap onEscape={onClose}>
          <Stack
            background="neutral0"
            width={pxToRem(660)}
            shadow="popupShadow"
            hasRadius
            padding={4}
            size={8}
            role="dialog"
            aria-modal
            onClick={e => e.stopPropagation()}
          >
            <Flex justifyContent="flex-end">
              <IconButton
                onClick={onClose}
                aria-label={formatMessage({ id: 'app.utils.close-label', defaultMessage: 'Close' })}
                icon={<Cross />}
              />
            </Flex>
            <Box paddingLeft={7} paddingRight={7}>
              {children}
            </Box>
            <Flex justifyContent="flex-end">
              <Button variant="tertiary">
                {formatMessage({
                  id: 'app.components.GuidedTour.modal.skip',
                  defaultMessage: 'Skip',
                })}
              </Button>
            </Flex>
          </Stack>
        </FocusTrap>
      </ModalWrapper>
    </Portal>
  );
};

Modal.propTypes = {
  children: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Modal;
