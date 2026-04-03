import React from 'react';
import { render, screen } from '@testing-library/react';
import ChatBot from '../components/admin/ChatBot/ChatBot';

// Mock the API utility
jest.mock('@/backend/utils/api', () => ({
  default: {
    post: jest.fn().mockResolvedValue({
      data: {
        response: 'This is a test response',
        preview: {
          title: 'Test Task',
          steps: ['Step 1', 'Step 2', 'Step 3']
        }
      }
    })
  }
}));

// Mock router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      prefetch: () => null
    };
  }
}));

describe('ChatBot', () => {
  it('renders the minimized chatbot icon', () => {
    render(<ChatBot />);
    expect(screen.getByText('message')).toBeInTheDocument();
  });

  it('opens chat window when icon is clicked', () => {
    render(<ChatBot />);
    const icon = screen.getByText('message');
    icon.click();
    expect(screen.getByText('Admin Assistant')).toBeInTheDocument();
  });
});