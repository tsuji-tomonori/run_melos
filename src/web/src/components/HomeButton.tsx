import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomeButton: React.FC = () => {
    const navigate = useNavigate();

    return (
        <button onClick={() => navigate('/')}>
            Homeへ戻る
        </button>
    );
};

export default HomeButton;
