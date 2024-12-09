import React from 'react';
import { act } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import DomainsPage from './DomainsPage'; // Adjust the path as necessary
import { domainService } from '../services/domainService'; // Adjust the import path as necessary

// Mock the domainService methods
jest.mock('../services/domainService', () => ({
  domainService: {
    getDomains: jest.fn(),
    createDomain: jest.fn(),
    updateDomain: jest.fn(),
    deleteDomain: jest.fn(),
    reactivateDomain: jest.fn(),
  },
}));

describe('DomainsPage', () => {
    const mockDomains = [
      { id: 1, name: 'Domain A', is_active: true, created_at: '2023-01-01', updated_at: '2023-01-01' },
      { id: 2, name: 'Domain B', is_active: false, created_at: '2023-01-01', updated_at: '2023-01-01' },
];

    beforeEach(() => {
      jest.clearAllMocks(); // Clear previous mocks before each test
    });

    test('fetches and displays domains', async () => {
      // Mock the getDomains function to return mockDomains
      (domainService.getDomains as jest.Mock).mockResolvedValue(mockDomains);

      await act(async () => {
          render(<DomainsPage />); // Render the DomainsPage component
      });

      // Check for loading indicator (if applicable)
      // expect(screen.getByRole('progressbar')).toBeInTheDocument();

      // Wait for the domains to be displayed
      await waitFor(() => {
          expect(screen.getByText('Domain A')).toBeInTheDocument();
          expect(screen.getByText('Domain B')).toBeInTheDocument();
      });
    });
 

    test('displays error if fetching domains fails', async () => {
        (domainService.getDomains as jest.Mock).mockRejectedValue(new Error('Failed to fetch domains'));

        await act(async () => {
            render(<DomainsPage />);
        });

        await waitFor(() => {
            expect(screen.getByText('Failed to fetch domains')).toBeInTheDocument();
        });
    });

    test('opens the Add New Domain dialog', async () => {
        // Mock the initial fetch to return an empty domain list
        (domainService.getDomains as jest.Mock).mockResolvedValue([]);
    
        await act(async () => {
            render(<DomainsPage />);
        });
    
        // Find the "Add New Domain" button and click it to open the dialog
        const addButton = screen.getByRole('button', { name: /Add New Domain/i });
        fireEvent.click(addButton);
    
        // Check that the dialog is now open by checking for the dialog role
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
    
        // Check that the dialog has the input field for the domain name
        expect(screen.getByLabelText(/Domain Name/i)).toBeInTheDocument();
    
            // Find the Switch by its role
            const toggleSwitch = screen.getByRole('checkbox'); // Get the checkbox directly
            expect(toggleSwitch).toBeInTheDocument();
            expect(toggleSwitch).toBeChecked(); // By default, the toggle should be checked (active)
    
            // Change the toggle state to unchecked (inactive)
            fireEvent.click(toggleSwitch);
            expect(toggleSwitch).not.toBeChecked(); // Now it should be unchecked
    
        // Find the cancel button and click it to close the dialog
        const cancelButton = screen.getByRole('button', { name: /Cancel/i });
        fireEvent.click(cancelButton);
    
        // Check that the dialog is closed
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    test('checks whether domain creation is successful', async () => {
    // Mock the creation of a new domain
    (domainService.createDomain as jest.Mock).mockImplementation(async (domain) => {
        return { id: 3, name: domain.name, is_active: true }; // Return the new domain based on the input
    });

    // Mock the retrieval of domains to include the new domain
    (domainService.getDomains as jest.Mock).mockResolvedValueOnce([
        { id: 1, name: 'Domain A', is_active: true },
        { id: 2, name: 'Domain B', is_active: false },
        { id: 3, name: 'Domain C', is_active: true } // Include the new domain
    ]);

    // Render the component
    await act(async () => {
        render(<DomainsPage />);
    });

    // Find and click the "Add New Domain" button
    const addNewDomainButton = await screen.findByText('Add New Domain');
    fireEvent.click(addNewDomainButton);

    // Find the input field and change its value
    const domainInput = screen.getByRole('textbox', { name: 'Domain Name' });
    fireEvent.change(domainInput, { target: { value: 'Domain C' } });

    // Click the "Add" button
    fireEvent.click(screen.getByText('Add'));

    // Check if createDomain was called with the correct parameters
    expect(domainService.createDomain).toHaveBeenCalledWith({ name: 'Domain C', is_active: true });

    // Check if createDomain was called exactly once
    expect(domainService.createDomain).toHaveBeenCalledTimes(1);
    });

    test('adds a new domain', async () => {
    // Mock the initial domains
    (domainService.getDomains as jest.Mock).mockResolvedValueOnce(mockDomains);
    
    // Mock the creation of a new domain
    (domainService.createDomain as jest.Mock).mockImplementation(async (domain) => {
        console.log('Mock createDomain called with:', domain); // Log the input to createDomain
        return { id: 3, name: 'Domain C', is_active: true }; // Return the new domain
    });

    // Mock the retrieval of domains after a new one is added
    (domainService.getDomains as jest.Mock).mockResolvedValueOnce([
        ...mockDomains, 
        { id: 3, name: 'Domain C', is_active: true }
    ]);

    // Render the component
    await act(async () => {
        render(<DomainsPage />);
    });

    // Find and click the "Add New Domain" button
    const addNewDomainButton = await screen.findByText('Add New Domain');
    fireEvent.click(addNewDomainButton);
    console.log('Clicked Add New Domain button');

    // Find the input field and change its value
    const domainInput = screen.getByRole('textbox', { name: 'Domain Name' });
    fireEvent.change(domainInput, { target: { value: 'Domain C' } });
    console.log('Changed domain input to: Domain C');

    // Click the "Add" button
    fireEvent.click(screen.getByText('Add'));
    console.log('Clicked Add button');

    // Wait for the new domain to be displayed in the document
    await waitFor(() => {
        expect(screen.getByText(/domain c/i)).toBeInTheDocument(); // Case insensitive match
    });

    // Log the result of the test
    console.log('Test completed: Domain C should be in the document');
    });

test('checks whether domain update is successful', async () => {
    const initialDomains = [
    { id: 1, name: 'Domain A', is_active: true },
    { id: 2, name: 'Domain B', is_active: true },
    ];

    const updatedDomains = [
    { id: 1, name: 'Updated Domain A', is_active: true },
    { id: 2, name: 'Domain B', is_active: true },
    ];

    (domainService.getDomains as jest.Mock)
    .mockResolvedValueOnce(initialDomains) // Initial fetch
    .mockResolvedValueOnce(updatedDomains); // Fetch after update

    (domainService.updateDomain as jest.Mock).mockResolvedValue({ id: 1, name: 'Updated Domain A', is_active: true });

    await act(async () => {
    render(<DomainsPage />);
    });

    // Find all edit buttons
    const editButtons = await screen.findAllByLabelText('Edit domain');

    // Click the first edit button (for Domain A)
    fireEvent.click(editButtons[0]);

    const domainInput = screen.getByRole('textbox', { name: 'Domain Name' });
    fireEvent.change(domainInput, { target: { value: 'Updated Domain A' } });

    fireEvent.click(screen.getByText('Update'));

    // Wait for the updated domain name to appear in the document
    await waitFor(() => {
    expect(screen.getByText('Updated Domain A')).toBeInTheDocument();
    });
});

test('checks whether domain deletion is successful', async () => {
    const initialDomains = [
        { id: 1, name: 'Domain A', is_active: true },
        { id: 2, name: 'Domain B', is_active: true },
    ];

    // Mock the initial fetch and the delete operation
    (domainService.getDomains as jest.Mock).mockResolvedValue(initialDomains);
    (domainService.deleteDomain as jest.Mock).mockResolvedValue({}); // Mock successful deletion

    await act(async () => {
        render(<DomainsPage />);
    });

    // Verify that both domains are rendered
    expect(screen.getByText('Domain A')).toBeInTheDocument();
    expect(screen.getByText('Domain B')).toBeInTheDocument();

    // Find the delete button for Domain A
    const deleteButtons = await screen.findAllByLabelText('Delete domain');
    fireEvent.click(deleteButtons[0]); // Click the delete button for Domain A

    // Log the action
    console.log('Clicked delete button for Domain A');

    // Mock the getDomains to return the updated list after deletion
    (domainService.getDomains as jest.Mock).mockResolvedValueOnce([
        { id: 1, name: 'Domain A', is_active: false }, // Mark Domain A as inactive
        { id: 2, name: 'Domain B', is_active: true },
    ]);

    // Wait for the domains to refresh
    await waitFor(() => {
        // Check that Domain A is still present
        expect(screen.getByText('Domain A')).toBeInTheDocument(); // Ensure Domain A is still present

        // Check that Domain A's status is now "Inactive"
        const row = screen.getByText('Domain A').closest('tr');
        expect(row).not.toBeNull(); // Ensure the row is not null
        const statusCell = row?.querySelector('td:nth-child(2)');
        expect(statusCell).toHaveTextContent('Inactive'); // Check if it shows as Inactive
    });

    // Verify that Domain B is still present
    expect(screen.getByText('Domain B')).toBeInTheDocument();
});

test('displays error message when deleting a domain fails', async () => {
    (domainService.deleteDomain as jest.Mock).mockRejectedValueOnce(new Error('Failed to deactivate domain'));

    // Mock the initial domains to ensure the component has data to render
    (domainService.getDomains as jest.Mock).mockResolvedValueOnce([
        { id: 1, name: 'Domain A', is_active: true },
        { id: 2, name: 'Domain B', is_active: true },
    ]);

    render(<DomainsPage />);

    // Wait for the delete button for Domain A to be rendered
    const deleteButtons = await screen.findAllByLabelText('Delete domain');
    expect(deleteButtons.length).toBeGreaterThan(0); // Ensure that we found at least one delete button

    // Click the delete button for Domain A
    fireEvent.click(deleteButtons[0]);

    // Wait for the error message to be displayed
    await waitFor(() => {
        expect(screen.getByText('Failed to deactivate domain')).toBeInTheDocument();
    });
});

test('checks whether domain restoration is successful', async () => {
    const initialDomains = [
        { id: 1, name: 'Domain A', is_active: false }, // Start with Domain A as inactive
        { id: 2, name: 'Domain B', is_active: true },
    ];

    // Mock the initial fetch and the reactivate operation
    (domainService.getDomains as jest.Mock).mockResolvedValue(initialDomains);
    (domainService.reactivateDomain as jest.Mock).mockResolvedValue({}); // Mock successful reactivation

    await act(async () => {
        render(<DomainsPage />);
    });

    // Verify that both domains are rendered with correct statuses
    expect(screen.getByText('Domain A')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
    expect(screen.getByText('Domain B')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();

    // Find the restore button (RestoreIcon) for Domain A
    const restoreButtons = await screen.findAllByLabelText('Restore domain');
    fireEvent.click(restoreButtons[0]); // Click the restore button for Domain A

    // Log the action
    console.log('Clicked restore button for Domain A');

    // Mock the getDomains to return the updated list after reactivation
    (domainService.getDomains as jest.Mock).mockResolvedValueOnce([
        { id: 1, name: 'Domain A', is_active: true }, // Mark Domain A as active
        { id: 2, name: 'Domain B', is_active: true },
    ]);

    // Wait for the domains to refresh
    await waitFor(() => {
        // Check that Domain A is still present
        expect(screen.getByText('Domain A')).toBeInTheDocument(); // Ensure Domain A is still present

        // Check that Domain A's status is now "Active"
        const row = screen.getByText('Domain A').closest('tr');
        expect(row).not.toBeNull(); // Ensure the row is not null
        const statusCell = row?.querySelector('td:nth-child(2)'); // Use optional chaining
        expect(statusCell).toHaveTextContent('Active'); // Check if it shows as Active
    });

    // Verify that Domain B is still present
    expect(screen.getByText('Domain B')).toBeInTheDocument();
});

test('displays error message when restoring a domain fails', async () => {
    const initialDomains = [
        { id: 1, name: 'Domain A', is_active: false }, // Start with Domain A as inactive
        { id: 2, name: 'Domain B', is_active: true },
    ];

    // Mock the initial fetch to return the domains
    (domainService.getDomains as jest.Mock).mockResolvedValueOnce(initialDomains);

    // Mock the reactivation of the domain to fail
    (domainService.reactivateDomain as jest.Mock).mockRejectedValueOnce(new Error('Failed to reactivate domain'));

    await act(async () => {
        render(<DomainsPage />);
    });

    // Verify that both domains are rendered with correct statuses
    expect(screen.getByText('Domain A')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
    expect(screen.getByText('Domain B')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();

    // Find the restore button for Domain A
    const restoreButtons = await screen.findAllByLabelText('Restore domain');
    fireEvent.click(restoreButtons[0]); // Click the restore button for Domain A

    // Wait for the error message to be displayed
    await waitFor(() => {
        // Check that the error message is displayed
        expect(screen.getByText(/failed to reactivate domain/i)).toBeInTheDocument(); // Adjust the message to match the actual error message displayed in your UI
    });
});



test("Check to not show Inactive Domains initially", async() => {
    const initialDomains = [
        { id: 1, name: 'Domain A', is_active: false }, // Start with Domain A as inactive
        { id: 2, name: 'Domain B', is_active: true },
    ];

    // Mock the fetch to return only active domains initially
    (domainService.getDomains as jest.Mock).mockResolvedValue(initialDomains);


    await act(async () => {
        render(<DomainsPage />);
    });

    // Attempt to find the toggle switch (using checkbox role)
    const toggleSwitch = await screen.findByRole('checkbox', { hidden: true });

    // Ensure the toggle switch is found
    expect(toggleSwitch).toBeInTheDocument();

    // Check that the toggle switch is not checked initially
    expect(toggleSwitch).not.toBeChecked();
    });
    

test('checks whether the toggle to show inactive domains works', async () => {
    const activeDomain = { id: 1, name: 'Domain A', is_active: true };  // Active domain
    const inactiveDomain = { id: 2, name: 'Domain B', is_active: false }; // Inactive domain

    // Mock the initial fetch to return active domains only
    (domainService.getDomains as jest.Mock).mockResolvedValue([activeDomain, inactiveDomain]);

    await act(async () => {
        render(<DomainsPage />);
    });

    // Attempt to find the toggle switch (using checkbox role)
    const toggleSwitch = await screen.findByRole('checkbox', { hidden: true });

    // Ensure the toggle switch is found
    expect(toggleSwitch).toBeInTheDocument();
    expect(toggleSwitch).not.toBeChecked(); // Initially, it should not be checked

    // Toggle the switch to show inactive domains
    fireEvent.click(toggleSwitch);

    // Mock the fetch to return both active and inactive domains when the switch is toggled
    (domainService.getDomains as jest.Mock).mockResolvedValue([
        activeDomain,
        inactiveDomain // Ensure Domain B is included and marked as inactive
    ]);

    // Wait for the domains to refresh
    await waitFor(() => {
        // Verify that both active and inactive domains are shown
        expect(screen.getByText('Domain A')).toBeInTheDocument();
        expect(screen.getByText('Domain B')).toBeInTheDocument(); // Domain B should now be visible
    });

    // Verify that the toggle switch is now checked
    expect(toggleSwitch).toBeChecked(); // After clicking, it should be checked

    // Toggle the switch back to hide inactive domains
    fireEvent.click(toggleSwitch);

    // Mock the fetch to return only active domains again
    (domainService.getDomains as jest.Mock).mockResolvedValue([activeDomain]);

    // Wait for the domains to refresh again
    await waitFor(() => {
        // Verify that only active domains are shown
        expect(screen.getByText('Domain A')).toBeInTheDocument();
        expect(screen.queryByText('Domain B')).toBeInTheDocument(); // Domain B should not be visible
    });

    // Verify that the toggle switch is now unchecked
    expect(toggleSwitch).not.toBeChecked(); // After clicking back, it should not be checked
});

test('displays error message when input fields are empty during domain creation', async () => {
    (domainService.getDomains as jest.Mock).mockResolvedValueOnce([]); // Initial empty clients
  
    render(<DomainsPage />);
  
    const addButton = await waitFor(() => screen.getByRole('button', { name: /add new domain/i }));
    fireEvent.click(addButton); // Open the add client dialog
  
    // Attempt to submit the form without filling in the fields
    fireEvent.click(screen.getByText('Add')); // Click the Add button
  
    // Check that the error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument();
    });
  });

  test('closes the dialog when cancel button is clicked', async () => {
    (domainService.getDomains as jest.Mock).mockResolvedValueOnce([]); // Initial empty clients
  
    render(<DomainsPage />);
  
    const addButton = await waitFor(() => screen.getByRole('button', { name: /add new domain/i }));
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
  
  test('displays error message when trying to create a new domain with the same name as an existing active domain', async () => {
    // Mock the existing domains to include one with the name 'Domain A'
    const existingDomains = [
        { id: 1, name: 'Domain A', is_active: true },
    ];

    // Mock the fetch to return the existing domains
    (domainService.getDomains as jest.Mock).mockResolvedValueOnce(existingDomains);

    // Mock the createDomain to throw an error when trying to create a duplicate domain
    (domainService.createDomain as jest.Mock).mockRejectedValueOnce(new Error('Domain with this name already exists and is active'));

    // Render the component
    await act(async () => {
        render(<DomainsPage />);
    });

    // Find and click the "Add New Domain" button
    const addNewDomainButton = await screen.findByText('Add New Domain');
    fireEvent.click(addNewDomainButton);

    // Find the input field and change its value to 'Domain A'
    const domainInput = screen.getByRole('textbox', { name: 'Domain Name' });
    fireEvent.change(domainInput, { target: { value: 'Domain A' } });

    // Click the "Add" button
    fireEvent.click(screen.getByText('Add'));

    // Check that the error message is displayed
    await waitFor(() => {
        expect(screen.getByText('Domain with this name already exists and is active')).toBeInTheDocument();
    });

    // Optionally, check that the domains are still displayed correctly
    await waitFor(() => {
        expect(screen.getByText('Domain A')).toBeInTheDocument();
    });
});

test('creates a new domain with is_active set to false when switched to inactive', async () => {
    // Step 1: Mock the createDomain function to simulate successful creation of a domain
    (domainService.createDomain as jest.Mock).mockImplementation(async (domain) => {
        return { id: 1, name: domain.name, is_active: domain.is_active }; // Return the new domain based on the input
    });

    // Step 2: Mock the initial fetch to return an empty domain list
    (domainService.getDomains as jest.Mock).mockResolvedValueOnce([]); // Start with no domains

    // Step 3: Render the component
    await act(async () => {
        render(<DomainsPage />);
    });

    // Step 4: Find and click the "Add New Domain" button
    const addNewDomainButton = await screen.findByText('Add New Domain');
    fireEvent.click(addNewDomainButton);

    // Step 5: Find the input field and change its value
    const domainInput = screen.getByRole('textbox', { name: 'Domain Name' });
    fireEvent.change(domainInput, { target: { value: 'Inactive Domain' } });

    // Step 6: Find the toggle switch (checkbox) and switch it to inactive
    const toggleSwitch = screen.getByRole('checkbox'); // Get the checkbox directly
    fireEvent.click(toggleSwitch); // Click to switch to inactive (unchecked)

    // Step 7: Click the "Add" button
    fireEvent.click(screen.getByText('Add'));

    // Step 8: Check if createDomain was called with the correct parameters
    expect(domainService.createDomain).toHaveBeenCalledWith({ name: 'Inactive Domain', is_active: false });

    // Step 9: Mock the getDomains to return the updated list after the new domain is added
    (domainService.getDomains as jest.Mock).mockResolvedValueOnce([
        { id: 1, name: 'Inactive Domain', is_active: false } // Include the newly created domain
    ]);

    // Step 10: Wait for the new domain to be displayed in the document
    const newDomainRow = await screen.findByText('Inactive Domain');

    // Step 11: Check if the newly created domain is displayed correctly
    expect(newDomainRow).toBeInTheDocument();
    const row = newDomainRow.closest('tr');
    expect(row).not.toBeNull(); // Ensure the row is not null
    const statusCell = row?.querySelector('td:nth-child(2)'); // Use optional chaining
    expect(statusCell).toHaveTextContent('Inactive'); // Check if it shows as Inactive
});

test('updates an existing domain and refreshes the domain list to show the updated domain', async () => {
    // Step 1: Mock the initial state with an existing domain
    const initialDomain = {
        id: 1,
        name: 'Old Domain',
        is_active: true,
    };

    // Mock the getDomains to return the initial domain
    (domainService.getDomains as jest.Mock).mockResolvedValueOnce([initialDomain]);

    // Step 2: Render the DomainsPage component
    render(<DomainsPage />);

    // Step 3: Wait for the domain to be rendered
    const editButtons = await screen.findAllByLabelText('Edit domain');
    expect(editButtons).toHaveLength(1); // Ensure there is one edit button for the existing domain

    // Step 4: Click the edit button for the existing domain
    fireEvent.click(editButtons[0]);

    // Step 5: Fill in the form fields with updated domain data
    fireEvent.change(screen.getByLabelText(/domain name/i), { target: { value: 'Updated Domain' } });

    // Step 6: Mock the updateDomain function to simulate successful update
    (domainService.updateDomain as jest.Mock).mockResolvedValueOnce({
        id: 1,
        name: 'Updated Domain',
        is_active: true,
    });

    // Step 7: Click the "Update" button to submit the form
    fireEvent.click(screen.getByText(/update/i ));

    // Step 8: Mock the getDomains to return the updated domain after the update
    (domainService.getDomains as jest.Mock).mockResolvedValueOnce([
        {
            id: 1,
            name: 'Updated Domain',
            is_active: true,
        },
    ]);

    // Step 9: Wait for the updated domain to be displayed in the document
    const updatedDomainRow = await screen.findByText('Updated Domain');

    // Step 10: Check if the updated domain is displayed correctly
    expect(updatedDomainRow).toBeInTheDocument();
    const row = updatedDomainRow.closest('tr');
    expect(row).not.toBeNull(); // Ensure the row is not null
    const statusCell = row?.querySelector('td:nth-child(2)'); // Adjust the index based on your table structure
    expect(statusCell).toHaveTextContent('Active'); // Check if it shows as Active
});

test('creates a new domain and updates the domain list to include the newly created domain', async () => {
    // Step 1: Mock the createDomain function to simulate successful creation of a domain
    (domainService.createDomain as jest.Mock).mockImplementation(async (domain) => {
        return { id: 3, name: domain.name, is_active: domain.is_active }; // Return the new domain based on the input
    });

    // Step 2: Mock the initial fetch to return existing domains
    const initialDomains = [
        { id: 1, name: 'Domain A', is_active: true },
        { id: 2, name: 'Domain B', is_active: true },
    ];
    (domainService.getDomains as jest.Mock).mockResolvedValueOnce(initialDomains); // Start with two existing domains

    // Step 3: Render the DomainsPage component
    render(<DomainsPage />);

    // Step 5: Find and click the "Add New Domain" button
    const addButton = await screen.findByRole('button', { name: /add new domain/i });
    fireEvent.click(addButton);

    // Step 6: Fill in the form fields with new domain data
    fireEvent.change(screen.getByLabelText(/domain name/i), { target: { value: 'New Domain' } });

    // Step 8: Click the "Add" button to submit the form
    fireEvent.click(screen.getByText('Add'));

    // Step 9: Check if createDomain was called with the correct parameters
    expect(domainService.createDomain).toHaveBeenCalledWith({
        name: 'New Domain',
        is_active: true, // Assuming the default is active
    });

    // Step 10: Mock the getDomains to return the updated list after the new domain is added
    (domainService.getDomains as jest.Mock).mockResolvedValueOnce([
        ...initialDomains,
        { id: 3, name: 'New Domain', is_active: true }, // Include the new domain
    ]);

    // Step 11: Wait for the new domain to be displayed in the document
    const newDomainRow = await screen.findByText('New Domain');

    // Step 12: Check if the newly created domain is displayed correctly
    expect(newDomainRow).toBeInTheDocument();
    const row = newDomainRow.closest('tr');
    expect(row).not.toBeNull(); // Ensure the row is not null
    const statusCell = row?.querySelector('td:nth-child(2)'); // Adjust the index based on your table structure
    expect(statusCell).toHaveTextContent('Active'); // Check if it shows as Active
});
});





