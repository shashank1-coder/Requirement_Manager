// // App.test.tsx

// import React from 'react';
// import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// import ClientsPage from './pages/ClientsPage';
// import { clientService } from './services/clientService';
// import '@testing-library/jest-dom/extend-expect';

// //Mock clientService methods
// jest.mock('./services/clientService', () => ({
//   clientService: {
//     getClients: jest.fn(),
//     getClient: jest.fn(),
//     createClient: jest.fn(),
//     updateClient: jest.fn(),
//     deleteClient: jest.fn(),
//     reactivateClient: jest.fn(),
//   },
// }));


// test('displays error alert on failed client fetch', async () => {
//   // Mock the getClients function to reject with an error
//   (clientService.getClients as jest.Mock).mockRejectedValueOnce(new Error('Fetch error'));
  
//   // Render the ClientsPage component
//   render(<ClientsPage />);

//   // Wait for the error message to appear
//   await waitFor(() => expect(screen.getByText('Failed to fetch clients')).toBeInTheDocument());
// });


// test('displays fetched clients in table', async () => {
//   const mockClients = [
//     { id: 1, name: 'Client A', industry: 'Tech', contact_person: 'Alice', email: 'alice@example.com', phone: '1234567890', is_active: true },
//     { id: 2, name: 'Client B', industry: 'Finance', contact_person: 'Bob', email: 'bob@example.com', phone: '0987654321', is_active: false },
//   ];
//   (clientService.getClients as jest.Mock).mockResolvedValueOnce(mockClients);

//   render(<ClientsPage />);
//   await waitFor(() => expect(screen.getByText('Client A')).toBeInTheDocument());
//   expect(screen.getByText('Client B')).toBeInTheDocument();
// });





// import React from 'react';
// import { render, screen, waitFor, fireEvent } from '@testing-library/react';
// import ClientsPage from './pages/ClientsPage';
// import { clientService } from './services/clientService';
// import '@testing-library/jest-dom/extend-expect';

// // Mock the clientService and its methods
// jest.mock('./services/clientService', () => ({
//   clientService: {
//     getClients: jest.fn(),
//     createClient: jest.fn(),
//     updateClient: jest.fn(),
//     deleteClient: jest.fn(),
//   },
// }));

// describe('ClientsPage', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

  
//   test('creates a new client and updates the list', async () => {
//     const newClient = { id: 3, name: 'Client C', industry: 'Health' };
//     (clientService.createClient as jest.Mock).mockResolvedValueOnce(newClient);
//     (clientService.getClients as jest.Mock).mockResolvedValueOnce([newClient]);

//     render(<ClientsPage />);

//     fireEvent.click(screen.getByText('Add New Client')); // Assume this triggers the form submission

//     await waitFor(() => expect(screen.getByText('Client C')).toBeInTheDocument());
//   });

//   test('displays error message when creating a client fails', async () => {
//     (clientService.createClient as jest.Mock).mockRejectedValueOnce(new Error('Creation failed'));

//     render(<ClientsPage />);

//     fireEvent.click(screen.getByText('Add New Client')); // Assume this triggers the form submission

//     await waitFor(() => expect(screen.getByText('Failed to create client')).toBeInTheDocument());
//   });

//   test('updates client details successfully', async () => {
//     const updatedClient = { id: 1, name: 'Updated Client A', industry: 'Tech' };
//     (clientService.updateClient as jest.Mock).mockResolvedValueOnce(updatedClient);
//     (clientService.getClients as jest.Mock).mockResolvedValueOnce([updatedClient]);

//     render(<ClientsPage />);

//     fireEvent.click(screen.getByText('Edit Client A')); // Assume this triggers an edit action

//     await waitFor(() => expect(screen.getByText('Updated Client A')).toBeInTheDocument());
//   });

//   test('displays error message when updating client fails', async () => {
//     (clientService.updateClient as jest.Mock).mockRejectedValueOnce(new Error('Update failed'));

//     render(<ClientsPage />);

//     fireEvent.click(screen.getByText('Edit Client A')); // Assume this triggers an edit action

//     await waitFor(() => expect(screen.getByText('Failed to update client')).toBeInTheDocument());
//   });

//   test('deletes a client and removes it from the list', async () => {
//     const mockClients = [{ id: 1, name: 'Client A', industry: 'Tech' }];
//     (clientService.deleteClient as jest.Mock).mockResolvedValueOnce();
//     (clientService.getClients as jest.Mock).mockResolvedValueOnce(mockClients);

//     render(<ClientsPage />);

//     fireEvent.click(screen.getByText('Delete Client A')); // Assume this triggers the delete action

//     await waitFor(() => expect(screen.queryByText('Client A')).not.toBeInTheDocument());
//   });

//   test('displays error message when deleting client fails', async () => {
//     (clientService.deleteClient as jest.Mock).mockRejectedValueOnce(new Error('Deletion failed'));

//     render(<ClientsPage />);

//     fireEvent.click(screen.getByText('Delete Client A')); // Assume this triggers the delete action

//     await waitFor(() => expect(screen.getByText('Failed to delete client')).toBeInTheDocument());
//   });
// });


import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import ClientsPage from './pages/ClientsPage';
import { clientService } from './services/clientService';
import '@testing-library/jest-dom/extend-expect';

// Mock the clientService and its methods
jest.mock('./services/clientService', () => ({
  clientService: {
    getClients: jest.fn(),
    createClient: jest.fn(),
    updateClient: jest.fn(),
    deleteClient: jest.fn(),
  },
}));

describe('ClientsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

 test('creates a new client and updates the list', async () => {
  const newClient = { id: 3, name: 'Client C', industry: 'Health' };
  (clientService.createClient as jest.Mock).mockResolvedValueOnce(newClient);
  (clientService.getClients as jest.Mock).mockResolvedValueOnce([newClient]);

  render(<ClientsPage />);

  // Wait for the loading spinner to disappear or for an element that appears after loading
  await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

  fireEvent.click(screen.getByText('Add New Client')); // Assume this triggers the form submission

  await waitFor(() => expect(screen.getByText('Client C')).toBeInTheDocument());
});

test('displays error message when creating a client fails', async () => {
  // Mock getClients to return an initial list to avoid loading spinner issues
  (clientService.getClients as jest.Mock).mockResolvedValueOnce([
    { id: 1, name: 'Client A', industry: 'Tech' },
    { id: 2, name: 'Client B', industry: 'Finance' },
  ]);

  // Render the ClientsPage component
  render(<ClientsPage />);

  // Wait until the initial load is complete, removing any loading indicators
  await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

  // Now, find and click the "Add New Client" button
  fireEvent.click(screen.getByText('Add New Client'));

  // Fill in the form fields with valid data
  fireEvent.change(screen.getByLabelText(/Client Name/i), { target: { value: 'New Client' } });
  fireEvent.change(screen.getByLabelText(/Industry/i), { target: { value: 'Tech' } });
  fireEvent.change(screen.getByLabelText(/Contact Person/i), { target: { value: 'John Doe' } });
  fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'johndoe@example.com' } });
  fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: '123-456-7890' } });

  // Mock createClient to fail
  (clientService.createClient as jest.Mock).mockRejectedValueOnce(new Error('Create client error'));

  // Click the "Add" button to submit the form
  fireEvent.click(screen.getByText('Add'));

  // Wait for the error message to be rendered
  await waitFor(() => screen.getByText('Failed to save client'));

  // Check that the error message is rendered
  expect(screen.getByText('Failed to save client')).toBeInTheDocument();
});

test('displays error message when deactivating a client fails', async () => {
  // Mock getClients to return an initial list of clients
  (clientService.getClients as jest.Mock).mockResolvedValueOnce([
    { id: 1, name: 'Client A', industry: 'Tech', is_active: true },
    { id: 2, name: 'Client B', industry: 'Finance', is_active: true },
  ]);

  // Render the ClientsPage component
  render(<ClientsPage />);

  // Wait for the initial load to complete (removes loading spinner)
  await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

  // Mock the deleteClient function to fail when deactivating a client
  (clientService.deleteClient as jest.Mock).mockRejectedValueOnce(new Error('Failed to deactivate client'));

  // Find the Delete Icon button for the first client
  const deleteButton = screen.getAllByRole('button').find((button) =>
    button.querySelector('svg')?.getAttribute('data-testid') === 'DeleteIcon'
  )!; // Non-null assertion
  
  fireEvent.click(deleteButton);

  // Wait for the error message to appear
  await waitFor(() => screen.getByText('Failed to deactivate client'));

  // Assert that the error message is displayed
  expect(screen.getByText('Failed to deactivate client')).toBeInTheDocument();
});


test('updates client details when editing a client', async () => {
  // Mock the initial client data and the update service
  const initialClient = { id: 1, name: 'Client A', industry: 'Tech', contact_person: 'Alice', email: 'alice@example.com', phone: '1234567890', is_active: true };
  const updatedClient = { ...initialClient, name: 'Updated Client A', industry: 'Updated Tech' };

  // Mock the service calls
  (clientService.getClients as jest.Mock).mockResolvedValueOnce([initialClient]);
  (clientService.updateClient as jest.Mock).mockResolvedValueOnce(updatedClient);

  // Render the ClientsPage component
  render(<ClientsPage />);

  // Wait for the initial clients to load (wait for loading indicator to disappear)
  await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

  // Ensure clients are loaded and rendered
  const clientRow = screen.getByText(initialClient.name).closest('tr');
  expect(clientRow).toBeInTheDocument();

  // Find the Edit Icon button for the first client
  const editButton = screen.getAllByRole('button').find((button) =>
    button.querySelector('svg')?.getAttribute('data-testid') === 'EditIcon'
  );
  if (!editButton) throw new Error("Edit button not found");

  // Click the edit icon to open the edit form
  fireEvent.click(editButton);

  // Wait for the dialog form to appear
  const nameInput = await screen.findByLabelText(/name/i);
  const industryInput = screen.getByLabelText(/industry/i);

  // Update form values
  fireEvent.change(nameInput, { target: { value: updatedClient.name } });
  fireEvent.change(industryInput, { target: { value: updatedClient.industry } });

  // Click the update button to submit the form (button labeled 'Update')
  const updateButton = screen.getByRole('button', { name: /update/i });
  fireEvent.click(updateButton);

  // Wait for the update to finish and check if the updated client is displayed
  await waitFor(() => {
    // Mock the API to return the updated client and ensure re-render
    (clientService.getClients as jest.Mock).mockResolvedValueOnce([updatedClient]);

    // Re-render the component with updated clients
    const updatedClientRow = screen.getByText(updatedClient.name).closest('tr');
    expect(updatedClientRow).toBeInTheDocument();

    // Verify updated details within the row
    expect(within(updatedClientRow!).getByText(updatedClient.industry)).toBeInTheDocument();
  });
});










});


// test('displays error when updating client with empty fields', async () => {
//   // Mock the initial client data and the update service
//   const initialClient = { id: 1, name: 'Client A', industry: 'Tech', contact_person: 'Alice', email: 'alice@example.com', phone: '1234567890', is_active: true };
  
//   (clientService.getClients as jest.Mock).mockResolvedValueOnce([initialClient]);
//   (clientService.updateClient as jest.Mock).mockResolvedValueOnce(initialClient);

//   // Render the ClientsPage component
//   render(<ClientsPage />);

//   // Wait for initial clients to load
//   await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

//   // Find the Edit button and click it to open the edit form
//   const editButton = screen.getByRole('button', { name: /edit/i });
//   fireEvent.click(editButton);

//   // Wait for the form inputs to appear
//   const nameInput = screen.getByLabelText(/name/i);
//   const industryInput = screen.getByLabelText(/industry/i);

//   // Update fields and leave them empty
//   fireEvent.change(nameInput, { target: { value: '' } });
//   fireEvent.change(industryInput, { target: { value: '' } });

//   // Click the Update button to submit the form
//   const updateButton = screen.getByRole('button', { name: /update/i });
//   fireEvent.click(updateButton);

//   // Wait for the error message to appear
//   await waitFor(() => {
//     const errorMessage = screen.getByRole('alert');
//     expect(errorMessage).toHaveTextContent('Name and Industry are required.');
//   });w
// });