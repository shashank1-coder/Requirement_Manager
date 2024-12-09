import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import RolesPage from './RolesPage'; // Adjust the path as necessary
import { roleService } from '../services/roleService'; // Adjust the import path as necessary

// Mock the roleService methods
jest.mock('../services/roleService', () => ({
  roleService: {
    getRoles: jest.fn(),
    createRole: jest.fn(),
    updateRole: jest.fn(),
    deleteRole: jest.fn(),
  },
}));

describe('RolesPage', () => {
  const mockRoles = [
    { id: 1, name: 'Admin', description: 'Administrator role' },
    { id: 2, name: 'User ', description: 'Standard user role' },
  ];

  beforeEach(() => {
    jest.clearAllMocks(); // Clear previous mocks before each test
  });

  test('renders the RolesPage component', async () => {
    (roleService.getRoles as jest.Mock).mockResolvedValue(mockRoles);

    render(<RolesPage />);
    
    await waitFor(() => expect(screen.getByText('Role Management')).toBeInTheDocument());
});

test('fetches and displays roles', async () => {
  // Mock the getRoles function to return mockRoles
  (roleService.getRoles as jest.Mock).mockResolvedValue(mockRoles);

      render(<RolesPage />); // Render the RolesPage component

  // Wait for the Roles to be displayed
  await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
  });
  });

  test('displays error if fetching roles fails', async () => {
    (roleService.getRoles as jest.Mock).mockRejectedValue(new Error('Failed to fetch roles'));

        render(<RolesPage />);

    await waitFor(() => {
        expect(screen.getByText('Failed to fetch roles')).toBeInTheDocument();
    });
});

test('opens the Add New Role dialog', async () => {
    // Mock the initial fetch to return an empty role list
    (roleService.getRoles as jest.Mock).mockResolvedValue([]);

        render(<RolesPage />);

    // Find the "Add New Role" button and click it to open the dialog
    const addNewRoleButton = await screen.findByText('Add New Role');
    fireEvent.click(addNewRoleButton);

    // Check that the dialog is now open by checking for the dialog role
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Check that the dialog has the input field for the role name
    expect(screen.getByLabelText(/Role Name/i)).toBeInTheDocument();

    // Find the cancel button and click it to close the dialog
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    // Check that the dialog is closed
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

  test('checks whether roles creation is successful', async () => {
  // Mock the creation of a new roles
  (roleService.createRole as jest.Mock).mockImplementation(async (roles) => {
      return { id: 3, name: roles.name, description: roles.description  }; // Return the new roles based on the input
  });

  // Mock the retrieval of roles to include the new roles
  (roleService.getRoles as jest.Mock).mockResolvedValueOnce([
      { id: 1, name: 'Admin', description: 'Administrator role' },
      { id: 2, name: 'User ', description: 'Standard user role' },
      { id: 2, name: 'Sales ', description: 'Sales role' }, // Include the new role
  ]);

  // Render the component
      render(<RolesPage />);

  // Find and click the "Add New Role" button
  const addNewRoleButton = await screen.findByText('Add New Role');
  fireEvent.click(addNewRoleButton);

  // Find the input field and change its value
  const roleInput = screen.getByRole('textbox', { name: 'Role Name' });
  fireEvent.change(roleInput, { target: { value: 'Sales' } });

  // Find the input field and change its value
  const rolesInput = screen.getByRole('textbox', { name: 'Description' });
  fireEvent.change(rolesInput, { target: { value: 'Sales role' } });

  // Click the "Add" button
  fireEvent.click(screen.getByText('Add'));

  // Check if createRole was called with the correct parameters
  expect(roleService.createRole).toHaveBeenCalledWith({ name: 'Sales', description: 'Sales role' });

  // Check if createRole was called exactly once
  expect(roleService.createRole).toHaveBeenCalledTimes(1);
  });

  test('adds a new role', async () => {
  // Mock the initial roles
  (roleService.getRoles as jest.Mock).mockResolvedValueOnce(mockRoles);

  // Mock the creation of a new role
  (roleService.createRole as jest.Mock).mockImplementation(async (role) => {
      console.log('Mock createRole called with:', role); // Log the input to createRole
      return { id: 3, name: 'Sales', description: 'Sales role' }; // Return the new role
  });

  // Mock the retrieval of roles after a new one is added
  (roleService.getRoles as jest.Mock).mockResolvedValueOnce([
      ...mockRoles, 
      { id: 3, name: 'Sales',description: 'Sales role' }
  ]);

  // Render the component
      render(<RolesPage />);

  // Find and click the "Add New Role" button
  const addNewRoleButton = await screen.findByText('Add New Role');
  fireEvent.click(addNewRoleButton);
  console.log('Clicked Add New Role button');

  // Find the input field and change its value
  const roleInput = screen.getByRole('textbox', { name: 'Role Name' });
  fireEvent.change(roleInput, { target: { value: 'Sales' } });
  console.log('Changed role input to: Sales');

  const rolesInput = screen.getByRole('textbox', { name: 'Description' });
  fireEvent.change(rolesInput, { target: { value: 'Sales role' } });
  console.log('Changed roles input to: Sales role');

  // Click the "Add" button
  fireEvent.click(screen.getByText('Add'));
  console.log('Clicked Add button');

// Assuming you have a table and you want to get the text from the cell containing "Sales"
  await waitFor(() => {
  // Find the table row that contains the cell you want
  const row = screen.getByRole('row', { name: /Sales/i }); // You can adjust the selector based on your structure
  // Now find the specific cell you want from that row
  const statusCell = row?.querySelector('td:nth-child(1)'); // This assumes you want the first cell; adjust if necessary
  expect(statusCell).toHaveTextContent('Sales'); // Check if the cell contains the expected text
});

  // Log the result of the test
  console.log('Test completed: Sales should be in the document');
  });

  test('checks whether role update is successful', async () => {
    const initialRoles = [
      { id: 1, name: 'Admin', description: 'Administrator role' },
      { id: 2, name: 'User ', description: 'Standard user role' },
    ];
  
    const updatedRoles = [
      { id: 1, name: 'Updated Admin', description: 'Administrator role' },
      { id: 2, name: 'User ', description: 'Standard user role' },
    ];
  
    (roleService.getRoles as jest.Mock)
    .mockResolvedValueOnce(initialRoles) // Initial fetch
    .mockResolvedValueOnce(updatedRoles); // Fetch after update
  
    (roleService.updateRole as jest.Mock).mockResolvedValue({ id: 1, name: 'Updated Admin', description: 'Administrator role' });
  
    render(<RolesPage />);
  
    // Find all edit buttons
    const editButtons = await screen.findAllByLabelText('Edit role');
  
    // Click the first edit button (for Updated Admin)
    fireEvent.click(editButtons[0]);
  
    const roleInput = screen.getByRole('textbox', { name: 'Role Name' });
    fireEvent.change(roleInput, { target: { value: 'Updated Admin' } });
  
    fireEvent.click(screen.getByText('Update'));
  
    // Wait for the updated role name to appear in the document
    await waitFor(() => {
    expect(screen.getByText('Updated Admin')).toBeInTheDocument();
    });
  });

  test('deletes a role successfully', async () => {
    // Mock the getRoles function to return mockRoles
    (roleService.getRoles as jest.Mock).mockResolvedValue(mockRoles);
    (roleService.deleteRole as jest.Mock).mockResolvedValue({}); // Mock successful delete response


      // Mock window.confirm to always return true
      window.confirm = jest.fn(() => true);

        render(<RolesPage />); // Render the RolesPage component
  
    // Wait for the Roles to be displayed
    await waitFor(() => {
        expect(screen.getByText('Admin')).toBeInTheDocument();
        expect(screen.getByText('User')).toBeInTheDocument();
    });

    // Click the delete button for the 'Admin' role
    const deleteButton = screen.getAllByLabelText('Delete role')[0]; // Get the first delete button
    fireEvent.click(deleteButton);

    // Confirm the deletion in the window.confirm
    expect(window.confirm).toHaveBeenCalled(); // Check if confirm was called

    // Mock the getRoles function to return updated roles after deletion
    (roleService.getRoles as jest.Mock).mockResolvedValue([
      { id: 2, name: 'User  ', description: 'Standard user role' },
  ]);

     // Wait for the roles to be updated
     await waitFor(() => {
      expect(roleService.deleteRole).toHaveBeenCalledWith(1); // Ensure deleteRole was called with the correct ID
      expect(screen.queryByText('Admin')).not.toBeInTheDocument(); // Check that 'Admin' is no longer in the document
      expect(screen.getByText('User')).toBeInTheDocument(); // Check that 'User ' is still in the document
  });
    });

  test('displays error message when deleting a role fails', async () => {
    // Mock the getRoles function to return mockRoles
    (roleService.getRoles as jest.Mock).mockResolvedValue(mockRoles);
    // Mock the deleteRole function to throw an error
    (roleService.deleteRole as jest.Mock).mockRejectedValue(new Error('Failed to delete role'));


      // Mock window.confirm to always return true
      window.confirm = jest.fn(() => true);

        render(<RolesPage />); // Render the RolesPage component
  
    // Wait for the Roles to be displayed
    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
    });

    // Click the delete button for the 'Admin' role
    const deleteButton = screen.getAllByLabelText('Delete role')[0]; // Get the first delete button
    fireEvent.click(deleteButton);

    // Confirm the deletion in the window.confirm
    expect(window.confirm).toHaveBeenCalled(); // Check if confirm was called

      // Wait for the roles to be updated
      await waitFor(() => {
      expect(screen.getByText('Failed to delete role')).toBeInTheDocument(); // Check that the error message is displayed
    });
    expect(screen.getByText('User')).toBeInTheDocument(); // Check that 'User ' is still in the document
    expect(screen.queryByText('Admin')).toBeInTheDocument(); // Check that 'Admin' is no longer in the document
    });


    test('displays error message when input fields are empty during role creation', async () => {
      (roleService.getRoles as jest.Mock).mockResolvedValueOnce([]); // Initial empty clients
    
      render(<RolesPage />);
    
      const addButton = await waitFor(() => screen.getByRole('button', { name: /add new role/i }));
      fireEvent.click(addButton); // Open the add client dialog
    
      // Attempt to submit the form without filling in the fields
      fireEvent.click(screen.getByText('Add')); // Click the Add button
    
      // Check that the error message is displayed
      await waitFor(() => {
        expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument();
      });
    });
  
    test('closes the dialog when cancel button is clicked', async () => {
      (roleService.getRoles as jest.Mock).mockResolvedValueOnce([]); // Initial empty clients
    
      render(<RolesPage />);
    
      const addButton = await waitFor(() => screen.getByRole('button', { name: /add new role/i }));
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
    
    test('displays error message when trying to create a new role with the same name as an existing role', async () => {
      // Mock the existing roles to include one with the name 'role A'
      const existingroles = [
        { id: 1, name: 'Admin', description: 'Administrator role' },
      ];
  
      // Mock the fetch to return the existing roles
      (roleService.getRoles as jest.Mock).mockResolvedValueOnce(existingroles);
  
      // Mock the createrole to throw an error when trying to create a duplicate role
      (roleService.createRole as jest.Mock).mockRejectedValueOnce(new Error('Failed to save role'));
  
      // Render the componentl
          render(<RolesPage />);
  
      // Find and click the "Add New role" button
      const addButton = await waitFor(() => screen.getByRole('button', { name: /add new role/i }));
      fireEvent.click(addButton); // Open the add client dialog
  
      // Find the input field and change its value to 'role A'
      const roleInput = screen.getByRole('textbox', { name: 'Role Name' });
      fireEvent.change(roleInput, { target: { value: 'Admin' } });

      const rolesInput = screen.getByRole('textbox', { name: 'Description' });
      fireEvent.change(rolesInput, { target: { value: 'Administrator' } });
  
      // Click the "Add" button
      fireEvent.click(screen.getByText('Add'));

      // Click the cancel button
      const cancelButton = screen.getByText(/cancel/i);
      fireEvent.click(cancelButton); // Close the dialog
    
      // Verify that the dialog is closed
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); // Ensure the dialog is closed
      });
  
      // Check that the error message is displayed
      await waitFor(() => {
          expect(screen.getByText('Failed to save role')).toBeInTheDocument();
      });
  
      // Optionally, check that the roles are still displayed correctly
      await waitFor(() => {
          expect(screen.getByText('Admin')).toBeInTheDocument();
      });
  });

  test('updates an existing role and refreshes the role list to show the updated role', async () => {
    // Step 1: Mock the initial state with an existing role
    const initialRole = {
        id: 1,
        name: 'Old Role',
        description: 'Old Description',
    };

    // Mock the getRoles to return the initial role
    (roleService.getRoles as jest.Mock).mockResolvedValueOnce([initialRole]);

    // Step 2: Render the RolesPage component
    render(<RolesPage />);

    // Step 3: Wait for the role to be rendered
    const editButtons = await screen.findAllByLabelText('Edit role');
    expect(editButtons).toHaveLength(1); // Ensure there is one edit button for the existing role

    // Step 4: Click the edit button for the existing role
    fireEvent.click(editButtons[0]);

    // Step 5: Fill in the form fields with updated role data
    fireEvent.change(screen.getByLabelText(/role name/i), { target: { value: 'Updated Role' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Updated Description' } });

    // Step 6: Mock the updateRole function to simulate successful update
    (roleService.updateRole as jest.Mock).mockResolvedValueOnce({
        id: 1,
        name: 'Updated Role',
        description: 'Updated Description',
    });

    // Step 7: Click the "Update" button to submit the form
    fireEvent.click(screen.getByText(/update/i));

    // Step 8: Mock the getRoles to return the updated role after the update
    (roleService.getRoles as jest.Mock).mockResolvedValueOnce([
        {
            id: 1,
            name: 'Updated Role',
            description: 'Updated Description',
        },
    ]);

    // Step 9: Wait for the updated role to be displayed in the document
    const updatedRoleRow = await screen.findByText('Updated Role');

    // Step 10: Check if the updated role is displayed correctly
    expect(updatedRoleRow).toBeInTheDocument();
    const row = updatedRoleRow.closest('tr');
    expect(row).not.toBeNull(); // Ensure the row is not null
    const descriptionCell = row?.querySelector('td:nth-child(2)'); // Adjust the index based on your table structure
    expect(descriptionCell).toHaveTextContent('Updated Description'); // Check if it shows the updated description
});

test('creates a new role and updates the role list to include the newly created role', async () => {
  // Step 1: Mock the createRole function to simulate successful creation of a role
  (roleService.createRole as jest.Mock).mockImplementation(async (role) => {
      return { id: 3, name: role.name, description: role.description }; // Return the new role based on the input
  });

  // Step 2: Mock the initial fetch to return existing roles
  const initialRoles = [
      { id: 1, name: 'Role A', description: 'Description A' },
      { id: 2, name: 'Role B', description: 'Description B' },
  ];
  (roleService.getRoles as jest.Mock).mockResolvedValueOnce(initialRoles); // Start with two existing roles

  // Step 3: Render the RolesPage component
  render(<RolesPage />);

  // Step 4: Find and click the "Add New Role" button
  const addButton = await screen.findByRole('button', { name: /add new role/i });
  fireEvent.click(addButton);

  // Step 5: Fill in the form fields with new role data
  fireEvent.change(screen.getByLabelText(/role name/i), { target: { value: 'New Role' } });
  fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'New Description' } });

  // Step 6: Click the "Add" button to submit the form
  fireEvent.click(screen.getByText('Add'));

  // Step 7: Check if createRole was called with the correct parameters
  expect(roleService.createRole).toHaveBeenCalledWith({
      name: 'New Role',
      description: 'New Description',
  });

  // Step 8: Mock the getRoles to return the updated list after the new role is added
  (roleService.getRoles as jest.Mock).mockResolvedValueOnce([
      ...initialRoles,
      { id: 3, name: 'New Role', description: 'New Description' }, // Include the new role
  ]);

  // Step 9: Wait for the new role to be displayed in the document
  const newRoleRow = await screen.findByText('New Role');

  // Step 10: Check if the newly created role is displayed correctly
  expect(newRoleRow).toBeInTheDocument();
  const row = newRoleRow.closest('tr');
  expect(row).not.toBeNull(); // Ensure the row is not null
  const descriptionCell = row?.querySelector('td:nth-child(2)'); // Adjust the index based on your table structure
  expect(descriptionCell).toHaveTextContent('New Description'); // Check if it shows the new description
});
  });

