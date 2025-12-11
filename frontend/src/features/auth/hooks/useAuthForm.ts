import { useState } from 'react';
import { useAuth } from '../../../shared/contexts/AuthContext';

export function useAuthForm() {
    const { login, register, isLoading } = useAuth();
    const [activeTab, setActiveTab] = useState('login');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitError, setSubmitError] = useState('');

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
        setSubmitError('');
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (activeTab === 'register') {
            if (!formData.name) {
                newErrors.name = 'Name is required';
            }
            if (!formData.confirmPassword) {
                newErrors.confirmPassword = 'Please confirm your password';
            } else if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            let result;
            if (activeTab === 'login') {
                result = await login(formData.email, formData.password);
            } else {
                result = await register(formData.name, formData.email, formData.password);
            }

            if (!result.success && result.error) {
                setSubmitError(result.error);
            }
        } catch (error) {
            setSubmitError('An unexpected error occurred. Please try again.');
        }
    };

    const resetForm = () => {
        setFormData({ name: '', email: '', password: '', confirmPassword: '' });
        setErrors({});
        setSubmitError('');
    };

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        resetForm();
    };

    return {
        activeTab,
        formData,
        errors,
        submitError,
        isLoading,
        handleInputChange,
        handleSubmit,
        handleTabChange
    };
}
