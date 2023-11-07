import {
  Button,
  ModalBody,
  ModalFooter,
  ModalLayout,
  ModalHeader,
  TextInput,
  Typography,
} from '@strapi/design-system';
import { Formik, Form } from 'formik';
import { useIntl } from 'react-intl';
import * as yup from 'yup';

const releaseSchema = yup.object({
  name: yup.string().required(),
});

const INITIAL_VALUES = {
  name: '',
};

interface AddReleaseDialogProps {
  handleClose: () => void;
  handleSubmit: () => void;
}

export const AddReleaseDialog = ({ handleClose, handleSubmit }: AddReleaseDialogProps) => {
  const { formatMessage } = useIntl();

  return (
    <ModalLayout onClose={handleClose} labelledBy="title">
      <ModalHeader>
        <Typography id="title" fontWeight="bold" textColor="neutral800">
          {formatMessage({
            id: 'content-releases.modal.add-release-title',
            defaultMessage: 'New release',
          })}
        </Typography>
      </ModalHeader>
      <Formik
        validateOnChange={false}
        onSubmit={handleSubmit}
        initialValues={INITIAL_VALUES}
        validationSchema={releaseSchema}
      >
        {({ values, errors, handleChange }) => (
          <Form>
            <ModalBody>
              <TextInput
                label={formatMessage({
                  id: 'content-releases.modal.form.input.label.release-name',
                  defaultMessage: 'Name',
                })}
                name="name"
                value={values.name}
                error={errors.name}
                onChange={handleChange}
                required
              />
            </ModalBody>
            <ModalFooter
              startActions={
                <Button onClick={handleClose} variant="tertiary" name="cancel">
                  {formatMessage({ id: 'cancel', defaultMessage: 'Cancel' })}
                </Button>
              }
              endActions={
                <Button name="submit" disabled={!values.name} type="submit">
                  {formatMessage({
                    id: 'content-releases.modal.form.button.submit',
                    defaultMessage: 'Continue',
                  })}
                </Button>
              }
            />
          </Form>
        )}
      </Formik>
    </ModalLayout>
  );
};
