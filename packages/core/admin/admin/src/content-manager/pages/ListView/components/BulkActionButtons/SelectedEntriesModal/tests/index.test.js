import React from 'react';

import { lightTheme, ThemeProvider } from '@strapi/design-system';
import { Table } from '@strapi/helper-plugin';
import {
  render as renderRTL,
  screen,
  waitForElementToBeRemoved,
  fireEvent,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { combineReducers, createStore } from 'redux';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

import SelectedEntriesModal from '..';
import reducers from '../../../../../../../reducers';

jest.mock('@strapi/helper-plugin', () => ({
  ...jest.requireActual('@strapi/helper-plugin'),
  useQueryParams: jest.fn(() => [
    {
      query: {
        sort: 'name:DESC',
      },
    },
  ]),
}));

const handlers = [
  rest.get('*/content-manager/collection-types/:apiId', (req, res, ctx) => {
    return res(
      ctx.json({
        results: [
          {
            id: 1,
            name: 'Entry 1',
          },
          {
            id: 2,
            name: 'Entry 2',
          },
          {
            id: 3,
            name: 'Entry 3',
          },
        ],
      })
    );
  }),
];

const server = setupServer(...handlers);

const user = userEvent.setup();

const rootReducer = combineReducers(reducers);
const store = createStore(rootReducer, {
  'content-manager_listView': {
    contentType: {
      uid: 'api::test.test',
      settings: {
        mainField: 'name',
      },
      attributes: {
        id: { type: 'integer' },
        name: { type: 'string', required: true },
      },
    },
    components: [],
  },
});

const render = (ui) => ({
  ...renderRTL(ui, {
    wrapper: ({ children }) => {
      const client = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      return (
        <ThemeProvider theme={lightTheme}>
          <IntlProvider locale="en" messages={{}} defaultLocale="en">
            <Provider store={store}>
              <QueryClientProvider client={client}>
                <MemoryRouter>{children}</MemoryRouter>
              </QueryClientProvider>
            </Provider>
          </IntlProvider>
        </ThemeProvider>
      );
    },
  }),
});

describe('Bulk publish selected entries modal', () => {
  beforeAll(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  it('renders the selected items in the modal', async () => {
    const onConfirm = jest.fn();

    const { queryByText } = render(
      <Table.Root defaultSelectedEntries={[1, 2, 3]} colCount={4}>
        <SelectedEntriesModal onConfirm={onConfirm} onToggle={jest.fn()} />
      </Table.Root>
    );

    await waitForElementToBeRemoved(() => queryByText('Loading content'));

    expect(screen.getByText(/publish entries/i)).toBeInTheDocument();

    // Nested table should render the selected items from the parent table
    expect(screen.getByText('Entry 1')).toBeInTheDocument();
    expect(screen.queryByText('Entry 4')).not.toBeInTheDocument();
  });

  it('reacts to selection updates', async () => {
    const { queryByText } = render(
      <Table.Root defaultSelectedEntries={[1, 2, 3]} colCount={4}>
        <SelectedEntriesModal onConfirm={jest.fn()} onToggle={jest.fn()} />
      </Table.Root>
    );

    await waitForElementToBeRemoved(() => queryByText('Loading content'));

    // User can toggle selected entries in the modal
    const checkboxEntry1 = screen.getByRole('checkbox', { name: 'Select 1' });
    const checkboxEntry2 = screen.getByRole('checkbox', { name: 'Select 2' });
    const checkboxEntry3 = screen.getByRole('checkbox', { name: 'Select 3' });

    // All table items should be selected by default
    expect(checkboxEntry1).toBeChecked();
    expect(checkboxEntry2).toBeChecked();
    expect(checkboxEntry3).toBeChecked();

    // User can unselect items
    fireEvent.click(checkboxEntry1);
    expect(checkboxEntry1).not.toBeChecked();
    fireEvent.click(checkboxEntry2);
    expect(checkboxEntry2).not.toBeChecked();
    fireEvent.click(checkboxEntry3);
    expect(checkboxEntry3).not.toBeChecked();

    // Publish button should be disabled if no items are selected
    const count = screen.getByText('entries ready to publish', { exact: false });
    expect(count).toHaveTextContent('0 entries ready to publish');
    const publishButton = screen.getByRole('button', { name: /publish/i });
    expect(publishButton).toBeDisabled();

    // If at least one item is selected, the publish button should work
    fireEvent.click(checkboxEntry1);
    expect(count).toHaveTextContent('1 entry ready to publish');
    expect(publishButton).not.toBeDisabled();
  });

  it('triggers validation dialog for selected items', async () => {
    const onConfirm = jest.fn();

    const { queryByText } = render(
      <Table.Root defaultSelectedEntries={[1, 2, 3]} colCount={4}>
        <SelectedEntriesModal onConfirm={onConfirm} onToggle={jest.fn()} />
      </Table.Root>
    );

    await waitForElementToBeRemoved(() => queryByText('Loading content'));

    const publishButton = screen.getByRole('button', { name: /publish/i });
    await user.click(publishButton);
    expect(onConfirm).toHaveBeenCalledWith([1, 2, 3]);
  });

  it('should show validation errors if there is an error', async () => {
    server.use(
      rest.get('*/content-manager/collection-types/:apiId', (req, res, ctx) => {
        return res(
          ctx.json({
            results: [
              {
                id: 1,
                name: 'Entry 1',
              },
              {
                id: 2,
                name: 'Entry 2',
              },
              {
                id: 3,
                name: '',
              },
            ],
          })
        );
      })
    );

    const { queryByText } = render(
      <Table.Root defaultSelectedEntries={[1, 2, 3]} colCount={4}>
        <SelectedEntriesModal onConfirm={jest.fn()} onToggle={jest.fn()} />
      </Table.Root>
    );

    await waitForElementToBeRemoved(() => queryByText('Loading content'));

    // Is showing the error message
    expect(
      screen.getAllByText('components.Input.error.validation.required')[0]
    ).toBeInTheDocument();

    // Publish button is enabled if at least one selected entry is valid
    const publishButton = screen.getByRole('button', { name: /publish/i });
    expect(publishButton).not.toBeDisabled();

    // Publish button is disabled if all selected entries have errors
    const checkboxEntry1 = screen.getByRole('checkbox', { name: 'Select 1' });
    fireEvent.click(checkboxEntry1);
    const checkboxEntry2 = screen.getByRole('checkbox', { name: 'Select 2' });
    fireEvent.click(checkboxEntry2);
    expect(publishButton).toBeDisabled();
  });
});
