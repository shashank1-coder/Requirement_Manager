// ClientPage.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClientsPage from './ClientsPage';
import { clientService } from '../services/clientService';
import '@testing-library/jest-dom/extend-expect';
import { isRejectedWithValue } from '@reduxjs/toolkit';

// Mock clientService methods directly
jest.mock('../services/clientService', () => ({
  clientService: {
    getClients: jest.fn(),
    createClient: jest.fn(),
    updateClient: jest.fn(),
    deleteClient: jest.fn(),
    reactivateClient: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test('renders Client Management title', async () => {
  (clientService.getClients as jest.Mock).mockResolvedValueOnce([
    {
      id: 1,
      name: 'Test Client',
      industry: 'IT',
      contact_person: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      is_active: true,
    },
  ]);

  render(<ClientsPage />);
  await waitFor(() => expect(screen.getByText('Client Management')).toBeInTheDocument());
});

test('opens and closes Add New Client dialog', async () => {
  (clientService.getClients as jest.Mock).mockResolvedValueOnce([
    {
      id: 1,
      name: 'Test Client',
      industry: 'IT',
      contact_person: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      is_active: true,
    },
  ]);

  render(<ClientsPage />);

  const addButton = await waitFor(() => screen.getByRole('button', { name: /add new client/i }));
  fireEvent.click(addButton);
  expect(screen.getByRole('dialog')).toBeInTheDocument();

  const cancelButton = screen.getByText(/cancel/i);
  fireEvent.click(cancelButton);
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});

test('creates a new client successfully', async () => {
  (clientService.getClients as jest.Mock).mockResolvedValueOnce([]); // Initial empty clients
  (clientService.createClient as jest.Mock).mockResolvedValueOnce({
    id: 2,
    name: 'New Client',
    industry: 'Finance',
    contact_person: 'Jane Smith',
    email: 'jane@example.com',
    phone: '9876543210',
    is_active: true,
  });
  (clientService.getClients as jest.Mock).mockResolvedValueOnce([ // Return updated clients after creation
    {
      id: 2,
      name: 'New Client',
      industry: 'Finance',
      contact_person: 'Jane Smith',
      email: 'jane@example.com',
      phone: '9876543210',
      is_active: true,
    },
  ]);

  render(<ClientsPage />);

  const addButton = await waitFor(() => screen.getByRole('button', { name: /add new client/i }));
  fireEvent.click(addButton);

  fireEvent.change(screen.getByLabelText(/client name/i), { target: { value: 'New Client' } });
  fireEvent.change(screen.getByLabelText(/industry/i), { target: { value: 'Finance' } });
  fireEvent.change(screen.getByLabelText(/contact person/i), { target: { value: 'Jane Smith' } });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jane@example.com' } });
  fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '9876543210' } });

  fireEvent.click(screen.getByText('Add'));

  await waitFor(() => {
    expect(clientService.createClient).toHaveBeenCalledWith({
      name: 'New Client',
      industry: 'Finance',
      contact_person: 'Jane Smith',
      email: 'jane@example.com',
      phone: '9876543210',
      is_active: true,
    });
  });

  // Ensure the clients list is updated after creation
  await waitFor(() => {
    expect(screen.getByText('New Client')).toBeInTheDocument();
  });
});

test('displays error message when input fields are empty during client creation', async () => {
  (clientService.getClients as jest.Mock).mockResolvedValueOnce([]); // Initial empty clients

  render(<ClientsPage />);

  const addButton = await waitFor(() => screen.getByRole('button', { name: /add new client/i }));
  fireEvent.click(addButton); // Open the add client dialog

  // Attempt to submit the form without filling in the fields
  fireEvent.click(screen.getByText('Add')); // Click the Add button

  // Check that the error message is displayed
  await waitFor(() => {
    expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument();
  });
});

test('displays error message when creating a new client fails', async () => {
  (clientService.getClients as jest.Mock).mockResolvedValueOnce([]);
  (clientService.createClient as jest.Mock).mockRejectedValueOnce(new Error('Failed to create client'));

  render(<ClientsPage />);

  const addButton = await waitFor(() => screen.getByRole('button', { name: /add new client/i }));
  fireEvent.click(addButton);

  fireEvent.change(screen.getByLabelText(/client name/i), { target: { value: 'New Client' } });
  fireEvent.change(screen.getByLabelText(/industry/i), { target: { value: 'Finance' } });
  fireEvent.change(screen.getByLabelText(/contact person/i), { target: { value: 'Jane Smith' } });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jane@example.com' } });
  fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '9876543210' } });

  fireEvent.click(screen.getByText('Add'));

  await waitFor(() => {
    expect(screen.getByText('Failed to save client')).toBeInTheDocument();
  });
});

test('updates an existing client successfully', async () => {
  (clientService.getClients as jest.Mock).mockResolvedValueOnce([
    {
      id: 1,
      name: 'Test Client',
      industry: 'IT',
      contact_person: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      is_active: true,
    },
  ]);
  (clientService.updateClient as jest.Mock).mockResolvedValueOnce({
    id: 1,
    name: 'Updated Client',
    industry: 'IT',
    contact_person: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    is_active: true,
  });

  render(<ClientsPage />);

  // Find all edit buttons
  const editButtons = await screen.findAllByLabelText('Edit Client');

  // Click the first edit button (for Test Client)
  fireEvent.click(editButtons[0]);

  fireEvent.change(screen.getByLabelText(/client name/i), { target: { value: 'Updated Client' } });
  fireEvent.click(screen.getByText(/Update/i));

  await waitFor(() => {
    expect(clientService.updateClient).toHaveBeenCalledWith(1,{
      name: 'Updated Client',
      industry: 'IT',
      contact_person: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      is_active: true,
    });
  });
});

test('deletes a client successfully', async () => {
  (clientService.getClients as jest.Mock).mockResolvedValueOnce([
    {
      id: 1,
      name: 'Test Client',
      industry: 'IT',
      contact_person: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      is_active: true,
    },
  ]);
  (clientService.deleteClient as jest.Mock).mockResolvedValueOnce({});

  render(<ClientsPage />);

  // Wait for the client to be rendered
  expect(await screen.findByText('Test Client')).toBeInTheDocument();

  // Find the delete button for Test Client
  const deleteButtons = await screen.findAllByLabelText('Delete Client');
  fireEvent.click(deleteButtons[0]); // Click the delete button for Test Client

  // Log the action
  console.log('Clicked delete button for Test Client');

  // Mock the getClients to return the updated list after deletion
  (clientService.getClients as jest.Mock).mockResolvedValueOnce([
    {
      id: 1,
      name: 'Test Client',
      industry: 'IT',
      contact_person: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      is_active: false, // Mark Test Client as inactive
    },
  ]);

  // Wait for the clients to refresh
  await waitFor(() => {
    // Check that Test Client is still present
    expect(screen.getByText('Test Client')).toBeInTheDocument(); // Ensure Test Client is still present

    // Check that Test Client's status is now "Inactive"
    const row = screen.getByText('Test Client').closest('tr');
    expect(row).not.toBeNull(); // Ensure the row is not null
    const statusCell = row?.querySelector('td:nth-child(6)'); // Adjust the index based on your table structure
    expect(statusCell).toHaveTextContent('Inactive'); // Check if it shows as Inactive
  });
});

test('displays error message when deleting a client fails', async () => {
  (clientService.getClients as jest.Mock).mockResolvedValueOnce([
    {
      id: 1,
      name: 'Test Client',
      industry: 'IT',
      contact_person: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      is_active: true,
    },
  ]);
  (clientService.deleteClient as jest.Mock).mockRejectedValueOnce(new Error('Failed to deactivate client'));

  render(<ClientsPage />);

  const deleteButton = await waitFor(() => screen.getByRole('button', { name: /delete/i }));
  fireEvent.click(deleteButton);

  await waitFor(() => {
    expect(screen.getByText('Failed to deactivate client')).toBeInTheDocument();
});
});

test('restores a client successfully', async () => {
  // Mock the initial state with a deactivated client
  (clientService.getClients as jest.Mock).mockResolvedValueOnce([
    {
      id: 1,
      name: 'Test Client',
      industry: 'IT',
      contact_person: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      is_active: false, // Initially inactive
    },
  ]);

  // Mock the reactivation of the client
  (clientService.reactivateClient as jest.Mock).mockResolvedValueOnce({
    id: 1,
    name: 'Test Client',
    industry: 'IT',
    contact_person: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    is_active: true, // Marked as active after reactivation
  });

  render(<ClientsPage />);

  // Wait for the client to be rendered
  expect(await screen.findByText('Test Client')).toBeInTheDocument();

  // Find the reactivate button for Test Client (assuming it has a label "Reactivate Client")
  const reactivateButtons = await screen.findAllByLabelText('Restore Client');
  fireEvent.click(reactivateButtons[0]); // Click the reactivate button for Test Client

  // Mock the getClients to return the updated list after reactivation
  (clientService.getClients as jest.Mock).mockResolvedValueOnce([
    {
      id: 1,
      name: 'Test Client',
      industry: 'IT',
      contact_person: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      is_active: true, // Now marked as active
    },
  ]);

  // Wait for the clients to refresh
  await waitFor(() => {
    // Check that Test Client is still present
    expect(screen.getByText('Test Client')).toBeInTheDocument(); // Ensure Test Client is still present

    // Check that Test Client's status is now "Active"
    const row = screen.getByText('Test Client').closest('tr');
    expect(row).not.toBeNull(); // Ensure the row is not null
    const statusCell = row?.querySelector('td:nth-child(6)'); // Adjust the index based on your table structure
    expect(statusCell).toHaveTextContent('Active'); // Check if it shows as Active
  });
});

test('displays error message when restoring a client fails', async () => {
  // Mock the initial state with a deactivated client
  (clientService.getClients as jest.Mock).mockResolvedValueOnce([
    {
      id: 1,
      name: 'Test Client',
      industry: 'IT',
      contact_person: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      is_active: false, // Initially inactive
    },
  ]);

  // Mock the reactivation of the client to fail
  (clientService.reactivateClient as jest.Mock).mockRejectedValueOnce(new Error('Failed to reactivate client'));

  render(<ClientsPage />);

  // Wait for the client to be rendered
  expect(await screen.findByText('Test Client')).toBeInTheDocument();

  // Find the reactivate button for Test Client
  const reactivateButtons = await screen.findAllByLabelText('Restore Client');
  fireEvent.click(reactivateButtons[0]); // Click the reactivate button for Test Client

  // Wait for the error message to be displayed
  await waitFor(() => {
    // Check that the error message is displayed
    expect(screen.getByText(/failed to reactivate client/i)).toBeInTheDocument(); // Adjust the message to match the actual error message displayed in your UI
  });
});

  test('Check to not show inactive clients initially', async () => {
    const initialClients = [
        { id: 1, name: 'Active Client', is_active: true },   // Active client
        { id: 2, name: 'Inactive Client', is_active: false }, // Inactive client
    ];

    // Mock the fetch to return both active and inactive clients
    (clientService.getClients as jest.Mock).mockResolvedValueOnce(initialClients);

        render(<ClientsPage />);
    
    // Attempt to find the toggle switch (using checkbox role)
    const toggleSwitch = await screen.findByRole('checkbox', { hidden: true });

    // Ensure the toggle switch is found
    expect(toggleSwitch).toBeInTheDocument();

    // Check that the toggle switch is not checked initially
    expect(toggleSwitch).not.toBeChecked();
    });
  
    test('checks that the toggle works to show inactive clients', async () => {
    const activeClient = {
      id: 1,
      name: 'Client A',
      industry: 'IT',
      contact_person: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      is_active: true,
    };  // Active client
    
    const inactiveClient = {
      id: 2,
      name: 'Client B',
      industry: 'ITS',
      contact_person: 'John Doey',
      email: 'john1@example.com',
      phone: '1234967890',
      is_active: false,
    }; // Inactive client

    // Mock the initial fetch to return only active clients
    (clientService.getClients as jest.Mock).mockResolvedValueOnce([activeClient, inactiveClient]);

    render(<ClientsPage />);

    // Attempt to find the toggle switch (using checkbox role)
    const toggleSwitch = await screen.findByRole('checkbox', { hidden: true });

    // Ensure the toggle switch is found
    expect(toggleSwitch).toBeInTheDocument();
    expect(toggleSwitch).not.toBeChecked(); // Initially, it should not be checked

    // Wait for the active clients to render
    await waitFor(() => {
        expect(screen.getByText('Client A')).toBeInTheDocument();
        expect(screen.queryByText('Client B')).toBeInTheDocument(); // Inactive client should not be shown
    });

    // Toggle the switch to show inactive clients
    fireEvent.click(toggleSwitch);

    // Verify that the toggle switch is now checked
    expect(toggleSwitch).toBeChecked(); // After clicking, it should be checked
});

test('closes the dialog when cancel button is clicked', async () => {
  (clientService.getClients as jest.Mock).mockResolvedValueOnce([]); // Initial empty clients

  render(<ClientsPage />);

  const addButton = await waitFor(() => screen.getByRole('button', { name: /add new client/i }));
  fireEvent.click(addButton); // Open the add client dialog

  // Ensure the dialog is open
  expect(screen.getByRole('dialog')).toBeInTheDocument();

  // Click the cancel button
  const cancelButton = screen.getByText(/cancel/i);
  fireEvent.click(cancelButton); // Close the dialog

  // Verify that the dialog is closed
  await waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); // Ensure the dialog is closed
  });
});

test('displays error message when input fields contain invalid email while creation', async () => {
  (clientService.getClients as jest.Mock).mockResolvedValueOnce([]); // Initial empty clients

  render(<ClientsPage />);

  const addButton = await waitFor(() => screen.getByRole('button', { name: /add new client/i }));
  fireEvent.click(addButton); // Open the add client dialog

  // Fill in the form with invalid data
  fireEvent.change(screen.getByLabelText(/client name/i), { target: { value: 'New Client' } });
  fireEvent.change(screen.getByLabelText(/industry/i), { target: { value: 'Finance' } });
  fireEvent.change(screen.getByLabelText(/contact person/i), { target: { value: 'Jane Smith' } });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'invalid-email' } }); // Invalid email
  fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '123' } }); // Invalid phone number

  // Mock the createClient to reject with an error
  (clientService.createClient as jest.Mock).mockRejectedValueOnce(new Error('Failed to save client'));

  // Attempt to submit the form with invalid data
  fireEvent.click(screen.getByText('Add')); // Click the Add button

  // Click the cancel button
  const cancelButton = screen.getByText(/cancel/i);
  fireEvent.click(cancelButton); // Close the dialog

  // Verify that the dialog is closed
  await waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); // Ensure the dialog is closed
  });

  // Check for the error message indicating failure to save client
  await waitFor(() => {
    expect(screen.getByText('Failed to save client')).toBeInTheDocument();
  });

});

test('displays error message when updating a client with invalid data', async () => {
  // Mock the initial state with a valid client
  const initialClient = {
    id: 1,
    name: 'Test Client',
    industry: 'IT',
    contact_person: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    is_active: true,
  };

  (clientService.getClients as jest.Mock).mockResolvedValueOnce([initialClient]);
  (clientService.updateClient as jest.Mock).mockRejectedValueOnce(new Error('Failed to save client'));

  render(<ClientsPage />);

  // Wait for the client to be rendered
  const editButtons = await screen.findAllByLabelText('Edit Client');
  fireEvent.click(editButtons[0]); // Click the edit button for Test Client

  // Fill in the form with invalid data
  fireEvent.change(screen.getByLabelText(/client name/i), { target: { value: 'Test Client' } }); // Invalid: empty name
  fireEvent.change(screen.getByLabelText(/industry/i), { target: { value: 'Finance' } });
  fireEvent.change(screen.getByLabelText(/contact person/i), { target: { value: 'Jane Smith' } });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'invalid-email' } }); // Invalid email
  fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '123' } }); // Invalid phone number

  // Attempt to submit the form with invalid data
  fireEvent.click(screen.getByText(/update/i)); // Click the Update button

    // Click the cancel button
    const cancelButton = screen.getByText(/cancel/i);
    fireEvent.click(cancelButton); // Close the dialog
  
    // Verify that the dialog is closed
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); // Ensure the dialog is closed
    });
  
    // Check for the error message indicating failure to save client
    await waitFor(() => {
      expect(screen.getByText('Failed to save client')).toBeInTheDocument();
    });
  
});

test('displays error message when input fields contain invalid phone while creation', async () => {
  (clientService.getClients as jest.Mock).mockResolvedValueOnce([]); // Initial empty clients

  render(<ClientsPage />);

  const addButton = await waitFor(() => screen.getByRole('button', { name: /add new client/i }));
  fireEvent.click(addButton); // Open the add client dialog

  // Fill in the form with valid data but invalid phone number
  fireEvent.change(screen.getByLabelText(/client name/i), { target: { value: 'New Client' } });
  fireEvent.change(screen.getByLabelText(/industry/i), { target: { value: 'Finance' } });
  fireEvent.change(screen.getByLabelText(/contact person/i), { target: { value: 'Jane Smith' } });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jane@example.com' } });
  fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: 'invalid-phone' } }); // Invalid phone number

  // Mock the createClient to reject with an error
  (clientService.createClient as jest.Mock).mockRejectedValueOnce(new Error('Failed to save client'));

  // Attempt to submit the form with invalid phone number
  fireEvent.click(screen.getByText('Add')); // Click the Add button

  // Check for the error message indicating failure to save client
  await waitFor(() => {
    expect(screen.getByText('Failed to save client')).toBeInTheDocument();
  });
});

test('displays error message when trying to create a client that is exactly the same as an existing client', async () => {
  // Mock the initial state with an existing client
  const existingClient = {
    id: 1,
    name: 'Unique Client',
    industry: 'Finance',
    contact_person: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    is_active: true,
  };

  (clientService.getClients as jest.Mock).mockResolvedValueOnce([existingClient]); // Initial clients

  render(<ClientsPage />);

  const addButton = await waitFor(() => screen.getByRole('button', { name: /add new client/i }));
  fireEvent.click(addButton); // Open the add client dialog

  // Fill in the form with the same details as the existing client
  fireEvent.change(screen.getByLabelText(/client name/i), { target: { value: existingClient.name } });
  fireEvent.change(screen.getByLabelText(/industry/i), { target: { value: existingClient.industry } });
  fireEvent.change(screen.getByLabelText(/contact person/i), { target: { value: existingClient.contact_person } });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: existingClient.email } });
  fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: existingClient.phone } });

  // Mock the createClient to reject with an error indicating duplicate client
  (clientService.createClient as jest.Mock).mockRejectedValueOnce(new Error('Failed to save client'));

  // Attempt to submit the form with duplicate client data
  fireEvent.click(screen.getByText('Add')); // Click the Add button

  // Check for the error message indicating that the client already exists
  await waitFor(() => {
    expect(screen.getByText('Failed to save client')).toBeInTheDocument();
  });
});

test('restores an inactive client to active when trying to create a client that is exactly the same', async () => {
  // Mock the initial state with an inactive client
  const inactiveClient = {
    name: 'Inactive Client',
    industry: 'Finance',
    contact_person: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    is_active: false,
  };

  (clientService.getClients as jest.Mock).mockResolvedValueOnce([inactiveClient]); // Initial clients

  render(<ClientsPage />);

  const addButton = await waitFor(() => screen.getByRole('button', { name: /add new client/i }));
  fireEvent.click(addButton); // Open the add client dialog

  // Fill in the form with the same details as the inactive client
  fireEvent.change(screen.getByLabelText(/client name/i), { target: { value: inactiveClient.name } });
  fireEvent.change(screen.getByLabelText(/industry/i), { target: { value: inactiveClient.industry } });
  fireEvent.change(screen.getByLabelText(/contact person/i), { target: { value: inactiveClient.contact_person } });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: inactiveClient.email } });
  fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: inactiveClient.phone } });

  // Mock the createClient to restore the inactive client to active
  (clientService.createClient as jest.Mock).mockResolvedValueOnce({
    ...inactiveClient,
    is_active: true, // Mark as active
  });

  // Attempt to submit the form with duplicate client data
  fireEvent.click(screen.getByText('Add')); // Click the Add button

  // Check that the client is restored to active
  await waitFor(() => {
    expect(clientService.createClient).toHaveBeenCalledTimes(1);
    expect(clientService.createClient).toHaveBeenCalledWith({
      ...inactiveClient,
      is_active: true, // Expect is_active to be true
    });
  });
});

test('creates a new client and refreshes the client list to show the new client', async () => {
  // Step 1: Mock the createClient function to simulate successful creation of a client
  (clientService.createClient as jest.Mock).mockImplementation(async (client) => {
      return { id: 2, name: client.name, industry: client.industry, contact_person: client.contact_person, email: client.email, phone: client.phone, is_active: true }; // Return the new client based on the input
  });

  // Step 2: Mock the initial fetch to return an empty client list
  (clientService.getClients as jest.Mock).mockResolvedValueOnce([]); // Start with no clients

  // Step 3: Render the ClientsPage component
  render(<ClientsPage />);

  // Step 4: Find and click the "Add New Client" button
  const addButton = await screen.findByRole('button', { name: /add new client/i });
  fireEvent.click(addButton);

  // Step 5: Fill in the form fields with new client data
  fireEvent.change(screen.getByLabelText(/client name/i), { target: { value: 'New Client' } });
  fireEvent.change(screen.getByLabelText(/industry/i), { target: { value: 'Finance' } });
  fireEvent.change(screen.getByLabelText(/contact person/i), { target: { value: 'Jane Doe' } });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jane@example.com' } });
  fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '9876543210' } });

  // Step 6: Click the "Add" button to submit the form
  fireEvent.click(screen.getByText('Add'));

  // Step 7: Check if createClient was called with the correct parameters
  expect(clientService.createClient).toHaveBeenCalledWith({
      name: 'New Client',
      industry: 'Finance',
      contact_person: 'Jane Doe',
      email: 'jane@example.com',
      phone: '9876543210',
      is_active: true,
  });

  // Step 8: Mock the getClients to return the updated list after the new client is added
  (clientService.getClients as jest.Mock).mockResolvedValueOnce([
      {
          id: 2,
          name: 'New Client',
          industry: 'Finance',
          contact_person: 'Jane Doe',
          email: 'jane@example.com',
          phone: '9876543210',
          is_active: true,
      },
  ]);

  // Step 9: Wait for the new client to be displayed in the document
  const newClientRow = await screen.findByText('New Client');

  // Step 10: Check if the newly created client is displayed correctly
  expect(newClientRow).toBeInTheDocument();
  const row = newClientRow.closest('tr');
  expect(row).not.toBeNull(); // Ensure the row is not null
  const statusCell = row?.querySelector('td:nth-child(6)'); // Adjust the index based on your table structure
  expect(statusCell).toHaveTextContent('Active'); // Check if it shows as Active
});

test('updates an existing client and refreshes the client list to show the updated client', async () => {
  // Step 1: Mock the initial state with an existing client
  const initialClient = {
      id: 1,
      name: 'Old Client',
      industry: 'IT',
      contact_person: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      is_active: true,
  };

  // Mock the getClients to return the initial client
  (clientService.getClients as jest.Mock).mockResolvedValueOnce([initialClient]);

  // Step 2: Render the ClientsPage component
  render(<ClientsPage />);

  // Step 3: Wait for the client to be rendered
  const editButtons = await screen.findAllByLabelText('Edit Client');
  expect(editButtons).toHaveLength(1); // Ensure there is one edit button for the existing client

  // Step 4: Click the edit button for the existing client
  fireEvent.click(editButtons[0]);

  // Step 5: Fill in the form fields with updated client data
  fireEvent.change(screen.getByLabelText(/client name/i), { target: { value: 'Updated Client' } });
  fireEvent.change(screen.getByLabelText(/industry/i), { target: { value: 'Finance' } });
  fireEvent.change(screen.getByLabelText(/contact person/i), { target: { value: 'Jane Smith' } });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jane.smith@example.com' } });
  fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '9876543210' } });

  // Step 6: Mock the updateClient function to simulate successful update
  (clientService.updateClient as jest.Mock).mockResolvedValueOnce({
      id: 1,
      name: 'Updated Client',
      industry: 'Finance',
      contact_person: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '9876543210',
      is_active: true,
  });

  // Step 7: Click the "Update" button to submit the form
  fireEvent.click(screen.getByText(/update/i));

  // Step 8: Check if updateClient was called with the correct parameters
  expect(clientService.updateClient).toHaveBeenCalledWith(1, {
      name: 'Updated Client',
      industry: 'Finance',
      contact_person: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '9876543210',
      is_active: true,
  });

  // Step 9: Mock the getClients to return the updated list after the client is edited
  (clientService.getClients as jest.Mock).mockResolvedValueOnce([
      {
          id: 1,
          name: 'Updated Client',
          industry: 'Finance',
          contact_person: 'Jane Smith',
          email: 'jane.smith@example.com',
          phone: '9876543210',
          is_active: true,
      },
  ]);

  // Step 10: Wait for the updated client to be displayed in the document
  const updatedClientRow = await screen.findByText('Updated Client');

  // Step 11: Check if the updated client is displayed correctly
  expect(updatedClientRow).toBeInTheDocument();
  const row = updatedClientRow.closest('tr');
  expect(row).not.toBeNull(); // Ensure the row is not null
  const statusCell = row?.querySelector('td:nth-child(6)'); // Adjust the index based on your table structure
  expect(statusCell).toHaveTextContent('Active'); // Check if it shows as Active
});

test('creates a new client with is_active set to false when switched to inactive', async () => {
  // Step 1: Mock the createClient function to simulate successful creation of a client
  (clientService.createClient as jest.Mock).mockImplementation(async (client) => {
      return { id: 2, name: client.name, industry: client.industry, contact_person: client.contact_person, email: client.email, phone: client.phone, is_active: client.is_active }; // Return the new client based on the input
  });

  // Step 2: Mock the initial fetch to return an empty client list
  (clientService.getClients as jest.Mock).mockResolvedValueOnce([]); // Start with no clients

  // Step 3: Render the ClientsPage component
  render(<ClientsPage />);

  // Step 4: Find and click the "Add New Client" button
  const addButton = await screen.findByRole('button', { name: /add new client/i });
  fireEvent.click(addButton);

  // Step 5: Fill in the form fields with new client data
  fireEvent.change(screen.getByLabelText(/client name/i), { target: { value: 'Inactive Client' } });
  fireEvent.change(screen.getByLabelText(/industry/i), { target: { value: 'Finance' } });
  fireEvent.change(screen.getByLabelText(/contact person/i), { target: { value: 'Jane Doe' } });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jane.doe@example.com' } });
  fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '1234567890' } });

  // Step 6: Find the toggle switch (checkbox) and switch it to inactive
  const toggleSwitch = screen.getByRole('checkbox'); // Get the checkbox directly
  fireEvent.click(toggleSwitch); // Click to switch to inactive (unchecked)

  // Step 7: Click the "Add" button to submit the form
  fireEvent.click(screen.getByText('Add'));

  // Step 8: Check if createClient was called with the correct parameters
  expect(clientService.createClient).toHaveBeenCalledWith({
      name: 'Inactive Client',
      industry: 'Finance',
      contact_person: 'Jane Doe',
      email: 'jane.doe@example.com',
      phone: '1234567890',
      is_active: false, // Expect is_active to be false
  });

  // Step 9: Mock the getClients to return the updated list after the new client is added
  (clientService.getClients as jest.Mock).mockResolvedValueOnce([
      {
          id: 2,
          name: 'Inactive Client',
          industry: 'Finance',
          contact_person: 'Jane Doe',
          email: 'jane.doe@example.com',
          phone: '1234567890',
          is_active: false, // Mark as inactive
      },
  ]);

  // Step 10: Wait for the new client to be displayed in the document
  const newClientRow = await screen.findByText('Inactive Client');

  // Step 11: Check if the newly created client is displayed correctly
  expect(newClientRow).toBeInTheDocument();
  const row = newClientRow.closest('tr');
  expect(row).not.toBeNull(); // Ensure the row is not null
  const statusCell = row?.querySelector('td:nth-child(6)'); // Adjust the index based on your table structure
  expect(statusCell).toHaveTextContent('Inactive'); // Check if it shows as Inactive
});

test("Display error if it fails to fetch Clients", async () => {
  (clientService.getClients as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch clients'));

  render(<ClientsPage/>)

    await waitFor(() => {
    expect(screen.getByText('Failed to fetch clients')).toBeInTheDocument();
  });
}); 

