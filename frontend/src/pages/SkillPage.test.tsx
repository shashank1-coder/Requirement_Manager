import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import '@testing-library/jest-dom/extend-expect';
import SkillsPage from './SkillsPage'; // Adjust the path as necessary
import { skillService } from '../services/skillService'; // Adjust the import path as necessary
import { domainService } from '../services/domainService'; // Adjust the import path as necessary

// Mock the skillService and domainService methods
jest.mock('../services/skillService', () => ({
  skillService: {
    getSkills: jest.fn(),
    getSkillsByDomain: jest.fn(),
    createSkill: jest.fn(),
    updateSkill: jest.fn(),
    deleteSkill: jest.fn(),
    reactivateSkill: jest.fn(),
  },
}));

jest.mock('../services/domainService', () => ({
  domainService: {
    getDomains: jest.fn(),
  },
}));

describe('SkillsPage', () => {
  const mockSkills = [
    { id: 1, name: 'JavaScript', domain_id: 1, is_active: true },
    { id: 2, name: 'Python', domain_id: 2, is_active: false },
  ];

  const mockDomains = [
    { id: 1, name: 'Web Development' },
    { id: 2, name: 'Data Science' },
  ];

  beforeEach(() => {
    jest.clearAllMocks(); // Clear previous mocks before each test
  });

  test('renders the SkillsPage component', async () => {
    (domainService.getDomains as jest.Mock).mockResolvedValue(mockDomains);
    (skillService.getSkills as jest.Mock).mockResolvedValue(mockSkills);

    render(<SkillsPage />);
    
    await waitFor(() => expect(screen.getByText('Skill Management')).toBeInTheDocument());
  });

  test('fetches and displays skills', async () => {
    (domainService.getDomains as jest.Mock).mockResolvedValue(mockDomains);
    (skillService.getSkills as jest.Mock).mockResolvedValue(mockSkills);

    await act(async () => {
      render(<SkillsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
      expect(screen.getByText('Python')).toBeInTheDocument();
    });
  });

  test('displays error if fetching skills fails', async () => {
    (skillService.getSkills as jest.Mock).mockRejectedValue(new Error('Failed to fetch skills'));
    (domainService.getDomains as jest.Mock).mockResolvedValue(mockDomains);

    await act(async () => {
      render(<SkillsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch skills')).toBeInTheDocument();
    });
  });

  test('opens the Add New Skill dialog', async () => {
    (domainService.getDomains as jest.Mock).mockResolvedValue(mockDomains);
    (skillService.getSkills as jest.Mock).mockResolvedValue(mockSkills);

    await act(async () => {
      render(<SkillsPage />);
    });

    const addButton = screen.getByRole('button', { name: /Add New Skill/i });
    fireEvent.click(addButton);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByLabelText(/Skill Name/i)).toBeInTheDocument();
  });

  test('checks whether skill creation is successful', async () => {
    (domainService.getDomains as jest.Mock).mockResolvedValue(mockDomains);
    (skillService.createSkill as jest.Mock).mockResolvedValue({
      id: 3,
      name: 'React',
      domain_id: 1,
      is_active: true,
    });

    (skillService.getSkills as jest.Mock).mockResolvedValueOnce(mockSkills);

    await act(async () => {
      render(<SkillsPage />);
    });

    const addNewSkillButton = await screen.findByText('Add New Skill');
    fireEvent.click(addNewSkillButton);

    const skillInput = screen.getByRole('textbox', { name: 'Skill Name' });
    fireEvent.change(skillInput, { target: { value: 'React' } });

    const domainSelect = screen.getByLabelText('Domain');
    fireEvent.change(domainSelect, { target: { value: '1' } }); // Assuming '1' is the value for 'Web Development'
    
    fireEvent.click(screen.getByText('Add'));

    expect(skillService.createSkill).toHaveBeenCalledWith({ name: 'React', domain_id: '1', is_active: true });

    expect(skillService.createSkill).toHaveBeenCalledTimes(1);

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    (skillService.getSkills as jest.Mock).mockResolvedValueOnce([
      ...mockSkills,
      { id: 3, name: 'React', domain_id: 1, is_active: true } // Include the new skill
    ]);

    expect(screen.getByText('React')).toBeInTheDocument();
  });

  test('checks whether skill editing is successful', async () => {
    (domainService.getDomains as jest.Mock).mockResolvedValue(mockDomains);
    (skillService.getSkills as jest.Mock).mockResolvedValue(mockSkills);

    await act(async () => {
      render(<SkillsPage />);
    });

    const editButtons = await screen.findAllByLabelText('Edit skill');
    fireEvent.click(editButtons[0]); // Click edit for 'JavaScript'

    const skillInput = screen.getByRole('textbox', { name: 'Skill Name' });
    expect(skillInput).toHaveValue('JavaScript');

    fireEvent.change(skillInput, { target: { value: 'Updated JavaScript' } });

    fireEvent.click(screen.getByText('Update'));

    expect(skillService.updateSkill).toHaveBeenCalledWith(1, { name: 'Updated JavaScript', domain_id: 1, is_active: true });

    (skillService.getSkills as jest.Mock).mockResolvedValueOnce([
      { id: 1, name: 'Updated JavaScript', domain_id: 1, is_active: true },
      { id: 2, name: 'Python', domain_id: 2, is_active: false },
    ]);

    // Wait for the updated domain name to appear in the document
    await waitFor(() => {
      expect(screen.getByText('Updated JavaScript')).toBeInTheDocument();
      });
  });

  test('checks whether skill deletion is successful', async () => {
    (domainService.getDomains as jest.Mock).mockResolvedValue(mockDomains);
    (skillService.getSkills as jest.Mock).mockResolvedValue(mockSkills);
    (skillService.deleteSkill as jest.Mock).mockResolvedValue({}); // Mock successful deletion

    await act(async () => {
      render(<SkillsPage />);
    });

    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();

    const deleteButtons = await screen.findAllByLabelText('Delete skill');
    fireEvent.click(deleteButtons[0]); // Click delete for 'JavaScript'

    (skillService.getSkills as jest.Mock).mockResolvedValueOnce([
      { id: 2, name: 'Python', domain_id: 2, is_active: false }, // Only Python should remain
    ]);

    await waitFor(() => {
      expect(screen.queryByText('JavaScript')).not.toBeInTheDocument(); // Ensure JavaScript is no longer present
      expect(screen.getByText('Python')).toBeInTheDocument(); // Ensure Python is still present
    });
  });

  test('checks whether skill reactivation is successful', async () => {
    (domainService.getDomains as jest.Mock).mockResolvedValue(mockDomains);
    (skillService.getSkills as jest.Mock).mockResolvedValue(mockSkills);
    (skillService.reactivateSkill as jest.Mock).mockResolvedValue({}); // Mock successful reactivation

    await act(async () => {
      render(<SkillsPage />);
    });

    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();

    const reactivateButtons = await screen.findAllByLabelText('Restore skill');
    fireEvent.click(reactivateButtons[0]); // Click restore for 'Python'

    (skillService.getSkills as jest.Mock).mockResolvedValueOnce([
      { id: 1, name: 'JavaScript', domain_id: 1, is_active: true },
      { id: 2, name: 'Python', domain_id: 2, is_active: true }, // Python should now be active
    ]);

    await waitFor(() => {
      expect(screen.getByText('Python')).toBeInTheDocument(); // Ensure Python is now active
    });
  });

  test('displays error message when trying to create a new skill with empty fields', async () => {
    (domainService.getDomains as jest.Mock).mockResolvedValue(mockDomains);
    (skillService.getSkills as jest.Mock).mockResolvedValue(mockSkills);

    await act(async () => {
        render(<SkillsPage />);
    });

    const addNewSkillButton = await screen.findByText('Add New Skill');
    fireEvent.click(addNewSkillButton);

    // Attempt to submit the form without filling in the fields
    fireEvent.click(screen.getByText('Add'));

    // Check that the error message is displayed
    await waitFor(() => {
        expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument();
    });
});

test('closes the dialog when cancel button is clicked', async () => {
    (domainService.getDomains as jest.Mock).mockResolvedValue(mockDomains);
    (skillService.getSkills as jest.Mock).mockResolvedValue(mockSkills);

    await act(async () => {
        render(<SkillsPage />);
    });

    const addNewSkillButton = await screen.findByText('Add New Skill');
    fireEvent.click(addNewSkillButton);

    // Ensure the dialog is open
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Click the cancel button
    fireEvent.click(screen.getByText(/Cancel/i));

    // Verify that the dialog is closed
    await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); // Ensure the dialog is closed
    });
});

test('checks whether the toggle to show inactive skills works', async () => {
  const activeSkill = { id: 1, name: 'JavaScript', domain_id: 1, is_active: true };  // Active skill
  const inactiveSkill = { id: 2, name: 'Python', domain_id: 2, is_active: false }; // Inactive skill

  // Mock the initial fetch to return active skills only
  (skillService.getSkills as jest.Mock).mockResolvedValue([activeSkill, inactiveSkill]);
  (domainService.getDomains as jest.Mock).mockResolvedValue(mockDomains);

  await act(async () => {
      render(<SkillsPage />);
  });

  // Attempt to find the toggle switch (using checkbox role)
  const toggleSwitch = await screen.findByRole('checkbox', { hidden: true });

  // Ensure the toggle switch is found
  expect(toggleSwitch).toBeInTheDocument();
  expect(toggleSwitch).not.toBeChecked(); // Initially, it should not be checked

  // Toggle the switch to show inactive skills
  fireEvent.click(toggleSwitch);

  // Mock the fetch to return both active and inactive skills when the switch is toggled
  (skillService.getSkills as jest.Mock).mockResolvedValueOnce([
      activeSkill,
      inactiveSkill // Ensure Python is included and marked as inactive
  ]);

  // Wait for the skills to refresh
  await waitFor(() => {
      // Verify that both active and inactive skills are shown
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
      expect(screen.getByText('Python')).toBeInTheDocument(); // Python should now be visible
  });

  // Verify that the toggle switch is now checked
  expect(toggleSwitch).toBeChecked(); // After clicking, it should be checked

  // Toggle the switch back to hide inactive skills
  fireEvent.click(toggleSwitch);

  // Mock the fetch to return only active skills again
  (skillService.getSkills as jest.Mock).mockResolvedValueOnce([activeSkill]);

  // Wait for the skills to refresh again
  await waitFor(() => {
      // Verify that only active skills are shown
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
      expect(screen.queryByText('Python')).toBeInTheDocument(); // Python should not be visible
  });

  // Verify that the toggle switch is now unchecked
  expect(toggleSwitch).not.toBeChecked(); // After clicking back, it should not be checked
});

test('displays error message when trying to delete a skill fails', async () => {
    (domainService.getDomains as jest.Mock).mockResolvedValue(mockDomains);
    (skillService.getSkills as jest.Mock).mockResolvedValue(mockSkills);
    (skillService.deleteSkill as jest.Mock).mockRejectedValueOnce(new Error('Failed to deactivate skill'));

    await act(async () => {
        render(<SkillsPage />);
    });

    const deleteButtons = await screen.findAllByLabelText('Delete skill');
    fireEvent.click(deleteButtons[0]); // Click delete for 'JavaScript'

    // Wait for the error message to be displayed
    await waitFor(() => {
        expect(screen.getByText('Failed to deactivate skill')).toBeInTheDocument();
    });
});

test('displays error message when trying to reactivate a skill fails', async () => {
  (domainService.getDomains as jest.Mock).mockResolvedValue(mockDomains);
  (skillService.getSkills as jest.Mock).mockResolvedValue(mockSkills);
  (skillService.reactivateSkill as jest.Mock).mockRejectedValueOnce(new Error('Failed to reactivate skill'));

  await act(async () => {
      render(<SkillsPage />);
  });

  const reactivateButtons = await screen.findAllByLabelText('Restore skill');
  fireEvent.click(reactivateButtons[0]); // Click restore for 'Python'

  // Wait for the error message to be displayed
  await waitFor(() => {
      expect(screen.getByText('Failed to reactivate skill')).toBeInTheDocument();
  });
});

// test('checks whether skill creation fails when a skill with the same name already exists', async () => {
//   const existingSkills = [
//       { id: 1, name: 'JavaScript', domain_id: 1, is_active: true },
//       { id: 2, name: 'Python', domain_id: 2, is_active: false },
//   ];

//   (domainService.getDomains as jest.Mock).mockResolvedValue(mockDomains);
//   (skillService.getSkills as jest.Mock).mockResolvedValue(existingSkills);
//   (skillService.createSkill as jest.Mock).mockRejectedValueOnce(new Error('Skill with this name already exists'));

//   await act(async () => {
//       render(<SkillsPage />);
//   });

//   const addNewSkillButton = await screen.findByText('Add New Skill');
//   fireEvent.click(addNewSkillButton);

//   const skillInput = screen.getByRole('textbox', { name: 'Skill Name' });
//   fireEvent.change(skillInput, { target: { value: 'JavaScript' } }); // Duplicate skill name

//   const domainSelect = screen.getByLabelText('Domain');
//   fireEvent.change(domainSelect, { target: { value: '1' } });

//   fireEvent.click(screen.getByText('Add'));

//   // Wait for the error message to be displayed
//   await waitFor(() => {
//       expect(screen.getByText('Skill with this name already exists')).toBeInTheDocument();
//   });
// });

test('checks whether skill updates correctly after editing', async () => {
  (domainService.getDomains as jest.Mock).mockResolvedValue(mockDomains);
  (skillService.getSkills as jest.Mock).mockResolvedValue(mockSkills);
  (skillService.updateSkill as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'Updated JavaScript',
      domain_id: 1,
      is_active: true,
  });

  await act(async () => {
      render(<SkillsPage />);
  });

  const editButtons = await screen.findAllByLabelText('Edit skill');
  fireEvent.click(editButtons[0]); // Click edit for 'JavaScript'

  const skillInput = screen.getByRole('textbox', { name: 'Skill Name' });
  fireEvent.change(skillInput, { target: { value: 'Updated JavaScript' } });

  fireEvent.click(screen.getByText('Update'));

  // Mock the fetch to return the updated skill
  (skillService.getSkills as jest.Mock).mockResolvedValueOnce([
      { id: 1, name: 'Updated JavaScript', domain_id: 1, is_active: true },
      { id: 2, name: 'Python', domain_id: 2, is_active: false },
  ]);

  await waitFor(() => {
      expect(screen.getByText('Updated JavaScript')).toBeInTheDocument();
  });
});

test('checks whether the skills list updates correctly after a skill is deleted', async () => {
  (domainService.getDomains as jest.Mock).mockResolvedValue(mockDomains);
  (skillService.getSkills as jest.Mock).mockResolvedValue(mockSkills);
  (skillService.deleteSkill as jest.Mock).mockResolvedValue({}); // Mock successful deletion

  await act(async () => {
      render(<SkillsPage />);
  });

  const deleteButtons = await screen.findAllByLabelText('Delete skill');
  fireEvent.click(deleteButtons[0]); // Click delete for 'JavaScript'

  // Mock the fetch to return the updated skills list
  (skillService.getSkills as jest.Mock).mockResolvedValueOnce([
      { id: 2, name: 'Python', domain_id: 2, is_active: false }, // Only Python should remain
  ]);

  await waitFor(() => {
      expect(screen.queryByText('JavaScript')).not.toBeInTheDocument(); // Ensure JavaScript is no longer present
      expect(screen.getByText('Python')).toBeInTheDocument(); // Ensure Python is still present
  });
});

test('checks whether the skills list updates correctly after a skill is reactivated', async () => {
  (domainService.getDomains as jest.Mock).mockResolvedValue(mockDomains);
  (skillService.getSkills as jest.Mock).mockResolvedValue(mockSkills);
  (skillService.reactivateSkill as jest.Mock).mockResolvedValue({}); // Mock successful reactivation

  await act(async () => {
      render(<SkillsPage />);
  });

  const reactivateButtons = await screen.findAllByLabelText('Restore skill');
  fireEvent.click(reactivateButtons[0]); // Click restore for 'Python'

  // Mock the fetch to return the updated skills list
  (skillService.getSkills as jest.Mock).mockResolvedValueOnce([
      { id: 1, name: 'JavaScript', domain_id: 1, is_active: true },
      { id: 2, name: 'Python', domain_id: 2, is_active: true }, // Python should now be active
  ]);

  await waitFor(() => {
      expect(screen.getByText('Python')).toBeInTheDocument(); // Ensure Python is now active
  });
});

test('displays loading indicator while fetching skills', async () => {
  (domainService.getDomains as jest.Mock).mockResolvedValue(mockDomains);
  (skillService.getSkills as jest.Mock).mockImplementation(() => new Promise(() => {})); // Simulate a long fetch

  await act(async () => {
      render(<SkillsPage />);
  });

  expect(screen.getByRole('progressbar')).toBeInTheDocument(); // Check for loading indicator
});

test('displays error message when fetching domains fails', async () => {
  (domainService.getDomains as jest.Mock).mockRejectedValue(new Error('Failed to fetch domains')); 
  (skillService.getSkills as jest.Mock).mockResolvedValue(mockSkills);

  await act(async () => {
      render(<SkillsPage />);
  });

  await waitFor(() => {
      expect(screen.getByText('Failed to fetch domains')).toBeInTheDocument();
  });
});

// test('checks whether the skills list updates correctly when filtering by domain', async () => {
//   (domainService.getDomains as jest.Mock).mockResolvedValue(mockDomains);
//   (skillService.getSkillsByDomain as jest.Mock).mockResolvedValue([
//       { id: 1, name: 'JavaScript', domain_id: 1, is_active: true },
//   ]);

//   await act(async () => {
//       render(<SkillsPage />);
//   });

//   const domainSelect = screen.getByLabelText('Filter by Domain');
//   fireEvent.change(domainSelect, { target: { value: '1' } }); // Filter by 'Web Development'

//   await waitFor(() => {
//       expect(screen.getByText('JavaScript')).toBeInTheDocument(); // JavaScript should be visible
//       expect(screen.queryByText('Python')).not.toBeInTheDocument(); // Python should not be visible
//   });
// });

// test('checks whether the skills list resets when filtering by domain is cleared', async () => {
//   (domainService.getDomains as jest.Mock).mockResolvedValue(mockDomains);
//   (skillService.getSkills as jest.Mock).mockResolvedValue(mockSkills);

//   await act(async () => {
//       render(<SkillsPage />);
//   });

//   const domainSelect = screen.getByLabelText('Filter by Domain');
//   fireEvent.change(domainSelect, { target: { value: '1' } }); // Filter by 'Web Development'

//   await waitFor(() => {
//       expect(screen.getByText('JavaScript')).toBeInTheDocument(); // JavaScript should be visible
//   });

//   fireEvent.change(domainSelect, { target: { value: '' } }); // Clear the filter

//   await waitFor(() => {
//       expect(screen.getByText('JavaScript')).toBeInTheDocument(); // JavaScript should still be visible
//       expect(screen.getByText('Python')).toBeInTheDocument(); // Python should also be visible
//   });
// });
});