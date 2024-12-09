// StatusManagementPage.test.tsx

import React from 'react';
import { act } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatusManagementPage from './StatusManagementPage'; // Adjust the path as necessary
import { statusService } from '../services/statusService'; // Adjust the import path as necessary

// Mock the statusService methods
jest.mock('../services/statusService', () => ({
  statusService: {
    getStatuses: jest.fn(),
    createStatus: jest.fn(),
    updateStatus: jest.fn(),
    deleteStatus: jest.fn(),
  },
}));

describe('StatusManagementPage', () => {
  const mockStatuses = [
    { id: 1, name: 'Status A', description: 'Description A', is_active: true },
    { id: 2, name: 'Status B', description: 'Description B', is_active: false },
  ];

  beforeEach(() => {
    jest.clearAllMocks(); // Clear previous mocks before each test
  });

  test('fetches and displays statuses', async () => {
    (statusService.getStatuses as jest.Mock).mockResolvedValue(mockStatuses);

    await act(async () => {
      render(<StatusManagementPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Status A')).toBeInTheDocument();
      expect(screen.getByText('Status B')).toBeInTheDocument();
    });
  });

  test('displays error if fetching statuses fails', async () => {
    (statusService.getStatuses as jest.Mock).mockRejectedValue(new Error('Failed to fetch statuses'));

    await act(async () => {
      render(<StatusManagementPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch statuses')).toBeInTheDocument();
    });
  });

  test('opens the Add New Status dialog', async () => {
    (statusService.getStatuses as jest.Mock).mockResolvedValue([]);

    await act(async () => {
      render(<StatusManagementPage />);
    });

    const addButton = screen.getByRole('button', { name: /Add New Status/i });
    fireEvent.click(addButton);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByLabelText(/Status Name/i)).toBeInTheDocument();
  });

  test('closes the Add New Status dialog', async () => {
    (statusService.getStatuses as jest.Mock).mockResolvedValue([]);

    await act(async () => {
      render(<StatusManagementPage />);
    });

    const addButton = screen.getByRole('button', { name: /Add New Status/i });
    fireEvent.click(addButton);

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  test('creates new status successfully', async () => {
    (statusService.createStatus as jest.Mock).mockResolvedValue({
      id: 3,
      name: 'Status C',
      description: 'Description C',
      is_active: true,
    });

    (statusService.getStatuses as jest.Mock).mockResolvedValueOnce([
      ...mockStatuses,
      { id: 3, name: 'Status C', description: 'Description C', is_active: true },
    ]);

    await act(async () => {
      render(<StatusManagementPage />);
    });

    const addNewStatusButton = screen.getByText('Add New Status');
    fireEvent.click(addNewStatusButton);

    fireEvent.change(screen.getByLabelText(/Status Name/i), { target: { value: 'Status C' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Description C' } });
    fireEvent.click(screen.getByText('Add'));

    expect(statusService.createStatus).toHaveBeenCalledWith({
      name: 'Status C',
      description: 'Description C',
      is_active: true,
    });

    // Verify that the new status is displayed in the table
    await waitFor(() => {
      expect(screen.getByText('Status C')).toBeInTheDocument();
    });
  });

  test('deletes a role successfully', async () => {
    // Mock the getRoles function to return mockRoles
    (statusService.getStatuses as jest.Mock).mockResolvedValue(mockStatuses);
    (statusService.deleteStatus as jest.Mock).mockResolvedValue({}); // Mock successful delete response


      // Mock window.confirm to always return true
      window.confirm = jest.fn(() => true);

        render(<StatusManagementPage />); // Render the RolesPage component
  
    // Wait for the Roles to be displayed
    await waitFor(() => {
        expect(screen.getByText('Status A')).toBeInTheDocument();
        expect(screen.getByText('Status B')).toBeInTheDocument();
    });

    // Click the delete button for the 'Admin' role
    const deleteButton = screen.getAllByLabelText('Delete status')[0]; // Get the first delete button
    fireEvent.click(deleteButton);

    // Confirm the deletion in the window.confirm
    expect(window.confirm).toHaveBeenCalled(); // Check if confirm was called

    // Mock the getRoles function to return updated roles after deletion
    (statusService.getStatuses as jest.Mock).mockResolvedValue([
      { id: 2, name: 'Status B', description: 'Description B', is_active: false  },
  ]);

     // Wait for the roles to be updated
     await waitFor(() => {
      expect(statusService.deleteStatus).toHaveBeenCalledWith(1); // Ensure deleteRole was called with the correct ID
      expect(screen.queryByText('Status A')).not.toBeInTheDocument(); // Check that 'Admin' is no longer in the document
      expect(screen.getByText('Status B')).toBeInTheDocument(); // Check that 'User ' is still in the document
  });
    });

    test('displays error message when input fields are empty during domain creation', async () => {
      (statusService.getStatuses as jest.Mock).mockResolvedValueOnce([]); // Initial empty clients
    
      render(<StatusManagementPage />);
    
      const addButton = await waitFor(() => screen.getByRole('button', { name: /add new status/i }));
      fireEvent.click(addButton); // Open the add client dialog
    
      // Attempt to submit the form without filling in the fields
      fireEvent.click(screen.getByText('Add')); // Click the Add button
    
      // Check that the error message is displayed
      await waitFor(() => {
        expect(screen.getByText('Status name is required')).toBeInTheDocument();
      });
    });

  test('displays error if updating status fails', async () => {
    (statusService.getStatuses as jest.Mock).mockResolvedValue(mockStatuses);
    (statusService.updateStatus as jest.Mock).mockRejectedValue(new Error('Failed to update status'));

    await act(async () => {
      render(<StatusManagementPage />);
    });

    const editButtons = await screen.findAllByLabelText('Edit status');
    fireEvent.click(editButtons[0]);

    const statusNameInput = screen.getByRole('textbox', { name: 'Status Name' });
    fireEvent.change(statusNameInput, { target: { value: 'Updated Status A' } });

    fireEvent.click(screen.getByText('Update'));

    await waitFor(() => {
      expect(screen.getByText('Failed to save status')).toBeInTheDocument();
    });
  });

  test('displays error if deleting status fails', async () => {
    (statusService.getStatuses as jest.Mock).mockResolvedValue(mockStatuses);
    (statusService.deleteStatus as jest.Mock).mockRejectedValue(new Error('Failed to delete status'));

    await act(async () => {
      render(<StatusManagementPage />);
    });

    // Find the delete button for Domain A
    const deleteButtons = await screen.findAllByLabelText('Delete status');
    fireEvent.click(deleteButtons[0]); // Click the delete button for Domain A

    // Confirm deletion
    window.confirm = jest.fn(() => true); // Mock window.confirm to return true
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Failed to delete status')).toBeInTheDocument();
    });
  });

  test('shows loading indicator while fetching statuses', async () => {
    (statusService.getStatuses as jest.Mock).mockImplementation(() => new Promise(() => {})); // Simulate a pending promise

    await act(async () => {
        render(<StatusManagementPage />);
    });

    // Check that the loading indicator is displayed
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('hides loading indicator after fetching statuses', async () => {
    (statusService.getStatuses as jest.Mock).mockResolvedValue(mockStatuses);

    await act(async () => {
      render(<StatusManagementPage />);
    });

    // Wait for the loading indicator to disappear
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });


  test('displays status description correctly', async () => {
    (statusService.getStatuses as jest.Mock).mockResolvedValue(mockStatuses);

    await act(async () => {
      render(<StatusManagementPage />);
    });

    // Check that the descriptions are displayed correctly
    expect(screen.getByText('Description A')).toBeInTheDocument();
    expect(screen.getByText('Description B')).toBeInTheDocument();
  });

  test('displays active/inactive status correctly', async () => {
    (statusService.getStatuses as jest.Mock).mockResolvedValue(mockStatuses);

    await act(async () => {
      render(<StatusManagementPage />);
    });

    // Check that the active status is displayed correctly
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  test('checks whether status update is successful', async () => {
    const initialDomains = [
    { id: 1,  name: 'Status A', description: 'Description A', is_active: true },
    { id: 2,  name: 'Status B', description: 'Description A', is_active: true  },
    ];

    const updatedDomains = [
    { id: 1,  name: 'Updated Status A', description: 'Description A', is_active: true  },
    { id: 2,  name: 'Status B', description: 'Description A', is_active: true  },
    ];

    (statusService.getStatuses as jest.Mock)
    .mockResolvedValueOnce(initialDomains) // Initial fetch
    .mockResolvedValueOnce(updatedDomains); // Fetch after update

    (statusService.updateStatus as jest.Mock).mockResolvedValue({ id: 1,  name: 'Updated Status A', description: 'Description A', is_active: true  });

    await act(async () => {
    render(<StatusManagementPage />);
    });

    // Find all edit buttons
    const editButtons = await screen.findAllByLabelText('Edit status');

    // Click the first edit button (for Domain A)
    fireEvent.click(editButtons[0]);

    const domainInput = screen.getByRole('textbox', { name: 'Status Name' });
    fireEvent.change(domainInput, { target: { value: 'Updated Status A' } });

    fireEvent.click(screen.getByText('Update'));

    // Wait for the updated domain name to appear in the document
    await waitFor(() => {
    expect(screen.getByText('Updated Status A')).toBeInTheDocument();
    });
});
});
     










// // StatusManagementPage.test.tsx

// import React from 'react';
// import { act } from 'react';
// import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// import '@testing-library/jest-dom';
// import StatusManagementPage from './StatusManagementPage'; // Adjust the path as necessary
// import { statusService } from '../services/statusService'; // Adjust the import path as necessary

// // Mock the statusService methods
// jest.mock('../services/statusService', () => ({
//   statusService: {
//     getStatuses: jest.fn(),
//     createStatus: jest.fn(),
//     updateStatus: jest.fn(),
//     deleteStatus: jest.fn(),
//   },
// }));

// describe('StatusManagementPage', () => {
//   const mockStatuses = [
//     { id: 1, name: 'Status A', description: 'Description A', is_active: true },
//     { id: 2, name: 'Status B', description: 'Description B', is_active: false },
//   ];

//   beforeEach(() => {
//     jest.clearAllMocks(); // Clear previous mocks before each test
//   });

//   test('fetches and displays statuses', async () => {
//     // Mock the getStatuses function to return mockStatuses
//     (statusService.getStatuses as jest.Mock).mockResolvedValue(mockStatuses);

//     await act(async () => {
//       render(<StatusManagementPage />); // Render the StatusManagementPage component
//     });

//     // Wait for the statuses to be displayed
//     await waitFor(() => {
//       expect(screen.getByText('Status A')).toBeInTheDocument();
//       expect(screen.getByText('Status B')).toBeInTheDocument();
//     });
//   });

//   test('displays error if fetching statuses fails', async () => {
//     (statusService.getStatuses as jest.Mock).mockRejectedValue(new Error('Failed to fetch statuses'));

//     await act(async () => {
//       render(<StatusManagementPage />);
//     });

//     await waitFor(() => {
//       expect(screen.getByText('Failed to fetch statuses')).toBeInTheDocument();
//     });
//   });

//   test('opens the Add New Status dialog', async () => {
//     // Mock the initial fetch to return an empty status list
//     (statusService.getStatuses as jest.Mock).mockResolvedValue([]);

//     await act(async () => {
//       render(<StatusManagementPage />);
//     });

//     // Find the "Add New Status" button and click it to open the dialog
//     const addButton = screen.getByRole('button', { name: /Add New Status/i });
//     fireEvent.click(addButton);

//     // Check that the dialog is now open by checking for the dialog role
//     const dialog = screen.getByRole('dialog');
//     expect(dialog).toBeInTheDocument();

//     // Check that the dialog has the input field for the status name
//     expect(screen.getByLabelText(/Status Name/i)).toBeInTheDocument();

//     // Find the Switch by its role
//     const toggleSwitch = screen.getByRole('checkbox'); // Get the checkbox directly
//     expect(toggleSwitch).toBeInTheDocument();
//     expect(toggleSwitch).toBeChecked(); // By default, the toggle should be checked (active)

//     // Change the toggle state to unchecked (inactive)
//     fireEvent.click(toggleSwitch);
//     expect(toggleSwitch).not.toBeChecked(); // Now it should be unchecked

//     // Find the cancel button and click it to close the dialog
//     const cancelButton = screen.getByRole('button', { name: /Cancel/i });
//     fireEvent.click(cancelButton);

//     // Check that the dialog is closed
//     await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
//   });

//   test('checks whether status creation is successful', async () => {
//     // Mock the creation of a new status
//     (statusService.createStatus as jest.Mock).mockImplementation(async (status) => {
//       return { id: 3, name: status.name, description: status.description, is_active: true }; // Return the new status based on the input
//     });

//     // Mock the retrieval of statuses to include the new status
//     (statusService.getStatuses as jest.Mock).mockResolvedValueOnce([
//       { id: 1, name: 'Status A', description: 'Description A', is_active: true },
//       { id: 2, name: 'Status B', description: 'Description B', is_active: false },
//       { id: 3, name: 'Status C', description: 'Description C', is_active: true } // Include the new status
//     ]);

//     // Render the component
//     await act(async () => {
//       render(<StatusManagementPage />);
//     });

//     // Find and click the "Add New Status" button
//     const addNewStatusButton = await screen.findByText('Add New Status');
//     fireEvent.click(addNewStatusButton);

//     // Find the input field for the status name and change its value
//     const statusNameInput = screen.getByRole('textbox', { name: 'Status Name' });
//     fireEvent.change(statusNameInput, { target: { value: 'Status C' } });

//     // Find the input field for the description and change its value
//     const descriptionInput = screen.getByLabelText(/Description/i);
//     fireEvent.change(descriptionInput, { target: { value: 'Description C' } });

//     // Click the "Add" button
//     fireEvent.click(screen.getByText('Add'));

//     // Check if createStatus was called with the correct parameters
//     expect(statusService.createStatus).toHaveBeenCalledWith({ 
//       name: 'Status C', 
//       description: 'Description C', 
//       is_active: true 
//     });

//     // Check if createStatus was called exactly once
//     expect(statusService.createStatus).toHaveBeenCalledTimes(1);
//   });
// });