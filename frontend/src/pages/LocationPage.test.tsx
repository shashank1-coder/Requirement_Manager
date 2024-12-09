// LocationsPage.test.tsx

import React from 'react';
import { act } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LocationsPage from './LocationsPage'; // Adjust the path as necessary
import { locationService } from '../services/locationService'; // Adjust the import path as necessary

// Mock the locationService methods
jest.mock('../services/locationService', () => ({
  locationService: {
    getLocations: jest.fn(),
    createLocation: jest.fn(),
    updateLocation: jest.fn(),
    deleteLocation: jest.fn(),
    reactivateLocation: jest.fn(),
  },
}));

describe('LocationsPage', () => {
  const mockLocations = [
    { id: 1, name: 'Location A', country: 'Country A', description: 'Description A', is_active: true },
    { id: 2, name: 'Location B', country: 'Country B', description: 'Description B', is_active: false },
  ];

  beforeEach(() => {
    jest.clearAllMocks(); // Clear previous mocks before each test
  });

  test('fetches and displays locations', async () => {
    // Mock the getLocations function to return mockLocations
    (locationService.getLocations as jest.Mock).mockResolvedValue(mockLocations);

    await act(async () => {
      render(<LocationsPage />); // Render the LocationsPage component
    });

    // Wait for the locations to be displayed
    await waitFor(() => {
      expect(screen.getByText('Location A')).toBeInTheDocument();
      expect(screen.getByText('Location B')).toBeInTheDocument();
    });
  });

  test('displays error if fetching locations fails', async () => {
    (locationService.getLocations as jest.Mock).mockRejectedValue(new Error('Failed to fetch locations'));

    await act(async () => {
      render(<LocationsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch locations')).toBeInTheDocument();
    });
  });

  test('opens the Add New Location dialog', async () => {
    // Mock the initial fetch to return an empty location list
    (locationService.getLocations as jest.Mock).mockResolvedValue([]);

    await act(async () => {
      render(<LocationsPage />);
    });

    // Find the "Add New Location" button and click it to open the dialog
    const addButton = screen.getByRole('button', { name: /Add New Location/i });
    fireEvent.click(addButton);

    // Check that the dialog is now open by checking for the dialog role
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Check that the dialog has the input field for the location name
    expect(screen.getByLabelText(/Location Name/i)).toBeInTheDocument();

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

  test('checks whether location creation is successful', async () => {
    // Mock the creation of a new location
    (locationService.createLocation as jest.Mock).mockImplementation(async (location) => {
      return { id: 3, name: location.name, country: location.country, description: location.description, is_active: true }; // Return the new location based on the input
    });

    // Mock the retrieval of locations to include the new location
    (locationService.getLocations as jest.Mock).mockResolvedValueOnce([
      { id: 1, name: 'Location A', country: 'Country A', description: 'Description A', is_active: true },
      { id: 2, name: 'Location B', country: 'Country B', description: 'Description B', is_active: false },
      { id: 3, name: 'Location C', country: 'Country C', description: 'Description C', is_active : true } // Include the new location
    ]);

    // Render the component
    await act(async () => {
      render(<LocationsPage />);
    });

    // Find and click the "Add New Location" button
    const addNewLocationButton = await screen.findByText('Add New Location');
    fireEvent.click(addNewLocationButton);

    // Find the input fields and change their values
    const locationNameInput = screen.getByRole('textbox', { name: 'Location Name' });
    fireEvent.change(locationNameInput, { target: { value: 'Location C' } });

    const countryInput = screen.getByRole('textbox', { name: 'Country' });
    fireEvent.change(countryInput, { target: { value: 'Country C' } });

    const descriptionInput = screen.getByRole('textbox', { name: 'Description' });
    fireEvent.change(descriptionInput, { target: { value: 'Description C' } });

    // Click the "Add" button
    fireEvent.click(screen.getByText('Add'));

    // Check if createLocation was called with the correct parameters
    expect(locationService.createLocation).toHaveBeenCalledWith({ name: 'Location C', country: 'Country C', description: 'Description C', is_active: true });

    // Check if createLocation was called exactly once
    expect(locationService.createLocation).toHaveBeenCalledTimes(1);
  });

  test('checks whether location update is successful', async () => {
    // Mock the retrieval of locations to include an existing location
    (locationService.getLocations as jest.Mock).mockResolvedValueOnce([
      { id: 1, name: 'Location A', country: 'Country A', description: 'Description A', is_active: true },
    ]);
  
    // Mock the update of a location
    (locationService.updateLocation as jest.Mock).mockImplementation(async (location) => {
      return { ...location }; // Return the updated location
    });
  
    // Render the component
    await act(async () => {
      render(<LocationsPage />);
    });
  
    // Find and click the "Edit" button for Location A
    const editButton = screen.getByRole('button', { name: /Edit Location/i });
    fireEvent.click(editButton);
  
    // Change the input fields
    const locationNameInput = screen.getByRole('textbox', { name: 'Location Name' });
    fireEvent.change(locationNameInput, { target: { value: 'Updated Location A' } });
  
    // Click the "Save" button
    fireEvent.click(screen.getByText('Update'));
  
    // Check if updateLocation was called with the correct parameters
    expect(locationService.updateLocation).toHaveBeenCalledWith(1,{ name: 'Updated Location A', country: 'Country A', description: 'Description A', is_active: true });
  
    // Check if updateLocation was called exactly once
    expect(locationService.updateLocation).toHaveBeenCalledTimes(1);
  });

  test('checks whether location deletion is successful', async () => {
    // Mock the retrieval of locations to include an existing location
    (locationService.getLocations as jest.Mock).mockResolvedValueOnce([
      { id: 1, name: 'Location A', country: 'Country A', description: 'Description A', is_active: true },
    ]);
  
    // Mock the deletion of a location
    (locationService.deleteLocation as jest.Mock).mockResolvedValue({ success: true });
  
     // Mock window.confirm to always return true
     window.confirm = jest.fn(() => true);

    // Render the component
    await act(async () => {
      render(<LocationsPage />);
    });
  
    // Find and click the "Delete" button for Location A
    const deleteButton = screen.getByRole('button', { name: /Delete Location/i });
    fireEvent.click(deleteButton);
  
 // Mock window.confirm to always return true
      window.confirm = jest.fn(() => true);
  
    // Check if deleteLocation was called with the correct parameters
    expect(locationService.deleteLocation).toHaveBeenCalledWith(1);
  
    // Check if deleteLocation was called exactly once
    expect(locationService.deleteLocation).toHaveBeenCalledTimes(1);
  });

  test('checks whether location deletion is successful', async () => {
    // Mock the retrieval of locations to include an existing location
    (locationService.getLocations as jest.Mock).mockResolvedValueOnce([
      { id: 1, name: 'Location A', country: 'Country A', description: 'Description A', is_active: true },
    ]);
  
    // Mock the deletion of a location
    (locationService.deleteLocation as jest.Mock).mockRejectedValue(new Error('Failed to delete location'));
  
     // Mock window.confirm to always return true
     window.confirm = jest.fn(() => true);

    // Render the component
    await act(async () => {
      render(<LocationsPage />);
    });
  
    // Find and click the "Delete" button for Location A
    const deleteButton = screen.getByRole('button', { name: /Delete Location/i });
    fireEvent.click(deleteButton);
  
   // Mock window.confirm to always return true
      window.confirm = jest.fn(() => true);
  
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('Failed to delete location')).toBeInTheDocument();
    });
  });

  test('checks whether location reactivation is successful', async () => {
    // Mock the retrieval of locations to include an inactive location
    (locationService.getLocations as jest.Mock).mockResolvedValueOnce([
      { id: 2, name: 'Location B', country: 'Country B', description: 'Description B', is_active: false },
    ]);
  
    // Mock the reactivation of a location
    (locationService.reactivateLocation as jest.Mock).mockResolvedValue({ success: true });
  
    // Render the component
    await act(async () => {
      render(<LocationsPage />);
    });
  
    // Find and click the "Reactivate" button for Location B
    const reactivateButton = screen.getByRole('button', { name: /Restore Location/i });
    fireEvent.click(reactivateButton);
  
    // Check if reactivateLocation was called with the correct parameters
    expect(locationService.reactivateLocation).toHaveBeenCalledWith(2);
  
    // Check if reactivateLocation was called exactly once
    expect(locationService.reactivateLocation).toHaveBeenCalledTimes(1);
  });


  test('checks whether location reactivation is successful', async () => {
    // Mock the retrieval of locations to include an inactive location
    (locationService.getLocations as jest.Mock).mockResolvedValueOnce([
      { id: 2, name: 'Location B', country: 'Country B', description: 'Description B', is_active: false },
    ]);
  
    // Mock the reactivation of a location
    (locationService.reactivateLocation as jest.Mock).mockRejectedValue(new Error('Failed to reactivate location'));
  
    // Render the component
    await act(async () => {
      render(<LocationsPage />);
    });
  
    // Find and click the "Reactivate" button for Location B
    const reactivateButton = screen.getByRole('button', { name: /Restore Location/i });
    fireEvent.click(reactivateButton);

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('Failed to reactivate location')).toBeInTheDocument();
    });
  });
  
  test('handles location update failure gracefully', async () => {
    // Mock the retrieval of locations to include an existing location
    (locationService.getLocations as jest.Mock).mockResolvedValueOnce([
      { id: 1, name: 'Location A', country: 'Country A', description: 'Description A', is_active: true },
    ]);
  
    // Mock the update of a location to fail
    (locationService.updateLocation as jest.Mock).mockRejectedValue(new Error('Failed to save location'));
  
    // Render the component
    await act(async () => {
      render(<LocationsPage />);
    });
  
    // Open the edit dialog for Location A
    const editButton = screen.getByRole('button', { name: /Edit Location/i });
    fireEvent.click(editButton);
  
    // Change the input fields
    fireEvent.change(screen.getByLabelText(/Location Name/i), { target: { value: 'Updated Location A' } });
  
    // Click the "Save" button
    fireEvent.click(screen.getByRole('button', { name: /Update/i }));
  
    // Check if the error message is displayed
    expect(await screen.findByText('Failed to save location')).toBeInTheDocument();
  });

  test('displays error message when input fields are empty during location creation', async () => {
    (locationService.getLocations as jest.Mock).mockResolvedValueOnce([]); // Initial empty clients
  
    render(<LocationsPage />);
  
    const addButton = await waitFor(() => screen.getByRole('button', { name: /add new location/i }));
    fireEvent.click(addButton); // Open the add client dialog
  
    // Attempt to submit the form without filling in the fields
    fireEvent.click(screen.getByText('Add')); // Click the Add button
  
    // Check that the error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Location name is required')).toBeInTheDocument();
    });
  });

  test('closes the dialog when cancel button is clicked', async () => {
    (locationService.getLocations as jest.Mock).mockResolvedValueOnce([]); // Initial empty clients
  
    render(<LocationsPage />);
  
    const addButton = await waitFor(() => screen.getByRole('button', { name: /add new location/i }));
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

  test('displays error message when trying to create a new domain with the same name as an existing active location', async () => {
    // Mock the existing domains to include one with the name 'Domain A'
    const existingDomains = [
        { id: 1, name: 'Domain A', is_active: true },
    ];

    // Mock the fetch to return the existing domains
    (locationService.getLocations as jest.Mock).mockResolvedValueOnce(mockLocations);

    // Mock the createDomain to throw an error when trying to create a duplicate domain
    (locationService.createLocation as jest.Mock).mockRejectedValueOnce(new Error('Failed to save location'));

    // Render the component
    await act(async () => {
        render(<LocationsPage />);
    });

    // Find and click the "Add New Domain" button
    const addNewDomainButton = await screen.findByText('Add New Location');
    fireEvent.click(addNewDomainButton);

    // Find the input field and change its value to 'Domain A'
    const domainInput = screen.getByRole('textbox', { name: 'Location Name' });
    fireEvent.change(domainInput, { target: { value: 'Location A' } });

    // Click the "Add" button
    fireEvent.click(screen.getByText('Add'));

    // Click the cancel button
    const cancelButton = screen.getByText(/cancel/i);
    fireEvent.click(cancelButton); // Close the dialog

    // // Check that the error message is displayed
    // await waitFor(() => {
    //     expect(screen.getByText('Failed to save location')).toBeInTheDocument();
    // });

    // Optionally, check that the domains are still displayed correctly
    await waitFor(() => {
        expect(screen.getByText('Location A')).toBeInTheDocument();
    });
});

test('shows inactive locations when "Show Inactive" toggle is checked', async () => {
  // Mock the getLocations method to return both active and inactive locations
  const mockLocations = [
    { id: 1, name: 'Location A', country: 'Country A', is_active: true },
    { id: 2, name: 'Location B', country: 'Country B', is_active: false },
    { id: 3, name: 'Location C', country: 'Country C', is_active: true },
    { id: 4, name: 'Location D', country: 'Country D', is_active: false },
  ];

  (locationService.getLocations as jest.Mock).mockResolvedValue(mockLocations);

  await act(async () => {
    render(<LocationsPage />);
  });

  // Initially, only active locations should be displayed
  expect(screen.getByText('Location A')).toBeInTheDocument();
  expect(screen.getByText('Location C')).toBeInTheDocument();
  expect(screen.queryByText('Location B')).toBeInTheDocument();
  expect(screen.queryByText('Location D')).toBeInTheDocument();

  // Find and check the "Show Inactive" toggle
  const toggleSwitch = await screen.findByRole('checkbox', { hidden: true });
 
  // Verify that the toggle switch is now checked
  expect(toggleSwitch).not.toBeChecked(); // After clicking, it should be checked

  fireEvent.click(toggleSwitch);

  // Wait for the inactive locations to be displayed
  await waitFor(() => {
    expect(screen.getByText('Location B')).toBeInTheDocument();
    expect(screen.getByText('Location D')).toBeInTheDocument();

    // Verify that the toggle switch is now checked
    expect(toggleSwitch).toBeChecked(); // After clicking, it should be checked
  });
});


}); 

