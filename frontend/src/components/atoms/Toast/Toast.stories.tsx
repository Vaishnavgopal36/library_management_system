import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Toast } from './Toast';
import { Button } from '../Button/Button';
import { Skeleton } from '../Skeleton/Skeleton';

const meta: Meta<typeof Toast> = {
  title: 'Atoms/Toast',
  component: Toast,
  tags: ['autodocs'],
};

export default meta;

const AsyncSimulationWrapper = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleSimulateTimeout = () => {
    setIsLoading(true);
    setShowToast(false);

    // Simulate a 2.5 second network request that fails
    setTimeout(() => {
      setIsLoading(false);
      setShowToast(true);
    }, 2500);
  };

  return (
    <div style={{ padding: '2rem', border: '1px dashed #ccc', borderRadius: '8px', position: 'relative', height: '300px' }}>
      
      {/* Skeleton overlay when loading */}
      {isLoading ? (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: '2rem', backgroundColor: 'rgba(255,255,255,0.9)', zIndex: 50 }}>
          <Skeleton variant="text" width="40%" height={24} style={{ marginBottom: '1rem' }} />
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="rectangular" width={120} height={40} style={{ marginTop: '2rem' }} />
        </div>
      ) : (
        <>
          <h3>Simulate API Timeout</h3>
          <p style={{ marginBottom: '1rem', color: '#666' }}>Click to simulate reserving a book. It will load for 2.5s, fail, and show an error toast.</p>
          
          <Button variant="primary" onClick={handleSimulateTimeout}>
            Reserve Book
          </Button>
        </>
      )}

      {/* Floating container for the Toast */}
      <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', zIndex: 100 }}>
        {showToast && (
          <Toast 
            message="Connection timeout: Failed to connect to the library server." 
            variant="error" 
            onClose={() => setShowToast(false)} 
            duration={4000} 
          />
        )}
      </div>
    </div>
  );
};

export const NetworkTimeoutSimulation: StoryObj = {
  render: () => <AsyncSimulationWrapper />,
};

export const StaticSuccess: StoryObj<typeof Toast> = {
  args: {
    message: 'Book reserved successfully!',
    variant: 'success',
  },
};