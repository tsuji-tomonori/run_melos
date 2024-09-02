import React from 'react';

interface MemoryButtonProps {
    memory: string;
    isActive: boolean;
    toggleMemory: (memory: string) => void;
}

const MemoryButton: React.FC<MemoryButtonProps> = ({ memory, isActive, toggleMemory }) => {
    return (
        <button
            onClick={() => toggleMemory(memory)}
            style={{ backgroundColor: isActive ? '#f0ad4e' : '#d3d3d3' }}
        >
            {memory}
        </button>
    );
};

export default MemoryButton;