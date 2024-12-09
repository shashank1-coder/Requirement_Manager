import React from 'react';
import { act } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import RequirementsPage from './RequirementsPage'; // Adjust the path as necessary
import { requirementService } from '../services/requirementService'; // Adjust the import path as necessary

// Mock the requirementService methods
jest.mock('../services/requirementService', () => ({
  requirementService: {
    getRequirements: jest.fn(),
    createRequirement: jest.fn(),
    updateRequirement: jest.fn(),
    deleteRequirement: jest.fn(),
    getClients: jest.fn(),
    getLocations: jest.fn(),
    getDomains: jest.fn(),
    getStatuses: jest.fn(),
    getSkills: jest.fn(),
  },
}));

describe('RequirementsPage', () => {
    const mockClients = [
        { id: 1, name: 'Client A' },
        { id: 2, name: 'Client B' },
    ];

    const mockLocations = [
        { id: 1, name: 'Location A' },
        { id: 2, name: 'Location B' },
    ];

    const mockDomains = [
        { id: 1, name: 'Domain A' },
        { id: 2, name: 'Domain B' },
    ];

    const mockStatuses = [
        { id: 1, name: 'Active' },
        { id: 2, name: 'Inactive' },
    ];

    const mockSkills = [
        { id: 1, name: 'Skill A' },
        { id: 2, name: 'Skill B' },
    ];

    beforeEach(() => {
        jest.clearAllMocks(); // Clear previous mocks before each test
    });

    test('fetches and displays requirements', async () => {
        const mockRequirements = [
            { id: 1, description: 'Requirement A', client_id: 1, domain_id: 1, status_id: 1, experience_min: 2, experience_max: 5 },
            { id: 2, description: 'Requirement B', client_id: 2, domain_id: 2, status_id: 2, experience_min: 3, experience_max: 6 },
        ];

        (requirementService.getRequirements as jest.Mock).mockResolvedValue(mockRequirements);
        (requirementService.getClients as jest.Mock).mockResolvedValue(mockClients);
        (requirementService.getLocations as jest.Mock).mockResolvedValue(mockLocations);
        (requirementService.getDomains as jest.Mock).mockResolvedValue(mockDomains);
        (requirementService.getStatuses as jest.Mock).mockResolvedValue(mockStatuses);
        (requirementService.getSkills as jest.Mock).mockResolvedValue(mockSkills);

        await act(async () => {
            render(<RequirementsPage />);
        });

        expect(screen.getByText('Requirement A')).toBeInTheDocument();
        expect(screen.getByText('Requirement B')).toBeInTheDocument();
    });

    test('displays error if fetching requirements fails', async () => {
        (requirementService.getRequirements as jest.Mock).mockRejectedValue(new Error('Failed to fetch requirements'));

        await act(async () => {
            render(<RequirementsPage />);
        });

        expect(await screen.findByText('Failed to fetch requirements')).toBeInTheDocument();
    });

    test('opens the Add New Requirement dialog', async () => {
        (requirementService.getClients as jest.Mock).mockResolvedValue(mockClients);
        (requirementService.getLocations as jest.Mock).mockResolvedValue(mockLocations);
        (requirementService.getDomains as jest.Mock).mockResolvedValue(mockDomains);
        (requirementService.getStatuses as jest.Mock).mockResolvedValue(mockStatuses);
        (requirementService.getSkills as jest.Mock).mockResolvedValue(mockSkills);

        await act(async () => {
            render(<RequirementsPage />);
        });

        const addButton = screen.getByRole('button', { name: /add new requirement/i });
        fireEvent.click(addButton);

        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    test('checks whether requirement creation is successful', async () => {
        (requirementService.getClients as jest.Mock).mockResolvedValue(mockClients);
        (requirementService.getLocations as jest.Mock).mockResolvedValue(mockLocations);
        (requirementService.getDomains as jest.Mock).mockResolvedValue(mockDomains);
        (requirementService.getStatuses as jest.Mock).mockResolvedValue(mockStatuses);
        (requirementService.getSkills as jest.Mock).mockResolvedValue(mockSkills);

        (requirementService.createRequirement as jest.Mock ).mockResolvedValue({ id: 3, description: 'Requirement C' });

        await act(async () => {
            render(<RequirementsPage />);
        });

        const addButton = screen.getByRole('button', { name: /add new requirement/i });
        fireEvent.click(addButton);

        const descriptionInput = screen.getByLabelText(/description/i);
        fireEvent.change(descriptionInput, { target: { value: 'Requirement C' } });

        const submitButton = screen.getByRole('button', { name: /submit/i });
        fireEvent.click(submitButton);

        expect(await screen.findByText('Requirement C')).toBeInTheDocument();
    });

    test('checks whether requirement update is successful', async () => {
        const mockRequirements = [
            { id: 1, description: 'Requirement A' },
        ];

        (requirementService.getRequirements as jest.Mock).mockResolvedValue(mockRequirements);
        (requirementService.updateRequirement as jest.Mock).mockResolvedValue({ id: 1, description: 'Updated Requirement A' });

        await act(async () => {
            render(<RequirementsPage />);
        });

        const editButton = screen.getByRole('button', { name: /edit requirement a/i });
        fireEvent.click(editButton);

        const descriptionInput = screen.getByLabelText(/description/i);
        fireEvent.change(descriptionInput, { target: { value: 'Updated Requirement A' } });

        const submitButton = screen.getByRole('button', { name: /submit/i });
        fireEvent.click(submitButton);

        expect(await screen.findByText('Updated Requirement A')).toBeInTheDocument();
    });

    test('checks whether requirement deletion is successful', async () => {
        const mockRequirements = [
            { id: 1, description: 'Requirement A' },
        ];

        (requirementService.getRequirements as jest.Mock).mockResolvedValue(mockRequirements);
        (requirementService.deleteRequirement as jest.Mock).mockResolvedValue({ success: true });

        await act(async () => {
            render(<RequirementsPage />);
        });

        const deleteButton = screen.getByRole('button', { name: /delete requirement a/i });
        fireEvent.click(deleteButton);

        expect(await screen.queryByText('Requirement A')).not.toBeInTheDocument();
    });

    test('checks whether requirement reactivation is successful', async () => {
        const mockRequirements = [
            { id: 1, description: 'Requirement A', active: false },
        ];

        (requirementService.getRequirements as jest.Mock).mockResolvedValue(mockRequirements);
        (requirementService.updateRequirement as jest.Mock).mockResolvedValue({ id: 1, description: 'Requirement A', active: true });

        await act(async () => {
            render(<RequirementsPage />);
        });

        const reactivateButton = screen.getByRole('button', { name: /reactivate requirement a/i });
        fireEvent.click(reactivateButton);

        expect(await screen.findByText('Requirement A')).toBeInTheDocument();
    });

    test('handles requirement update failure gracefully', async () => {
        const mockRequirements = [
            { id: 1, description: 'Requirement A' },
        ];

        (requirementService.getRequirements as jest.Mock).mockResolvedValue(mockRequirements);
        (requirementService.updateRequirement as jest.Mock).mockRejectedValue(new Error('Failed to update requirement'));

        await act(async () => {
            render(<RequirementsPage />);
        });

        const editButton = screen.getByRole('button', { name: /edit requirement a/i });
        fireEvent.click(editButton);

        const descriptionInput = screen.getByLabelText(/description/i);
        fireEvent.change(descriptionInput, { target: { value: 'Updated Requirement A' } });

        const submitButton = screen.getByRole('button', { name: /submit/i });
        fireEvent.click(submitButton);

        expect(await screen.findByText('Failed to update requirement')).toBeInTheDocument();
    });

    test('displays error message when input fields are empty during requirement creation', async () => {
        await act(async () => {
            render(<RequirementsPage />);
        });

        const addButton = screen.getByRole('button', { name: /add new requirement/i });
        fireEvent.click(addButton);

        const submitButton = screen.getByRole('button', { name: /submit/i });
        fireEvent.click(submitButton);

        expect(await screen.findByText('Description is required')).toBeInTheDocument();
    });

    test('closes the dialog when cancel button is clicked', async () => {
        await act(async () => {
            render(<RequirementsPage />);
        });

        const addButton = screen.getByRole('button', { name: /add new requirement/i });
        fireEvent.click(addButton );

        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        fireEvent.click(cancelButton);

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('displays error message when trying to create a new requirement with the same name as an existing requirement', async () => {
        const mockRequirements = [
            { id: 1, description: 'Requirement A' },
        ];

        (requirementService.getRequirements as jest.Mock).mockResolvedValue(mockRequirements);
        (requirementService.createRequirement as jest.Mock).mockRejectedValue(new Error('Requirement already exists'));

        await act(async () => {
            render(<RequirementsPage />);
        });

        const addButton = screen.getByRole('button', { name: /add new requirement/i });
        fireEvent.click(addButton);

        const descriptionInput = screen.getByLabelText(/description/i);
        fireEvent.change(descriptionInput, { target: { value: 'Requirement A' } });

        const submitButton = screen.getByRole('button', { name: /submit/i });
        fireEvent.click(submitButton);

        expect(await screen.findByText('Requirement already exists')).toBeInTheDocument();
    });
});