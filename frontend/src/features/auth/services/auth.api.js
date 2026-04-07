import axios from 'axios'
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
    withCredentials: true
});

export async function register({username, email, password, securityQuestion, securityAnswer}) {
    try{
        const response = await api.post('/api/auth/register', {
            username,
            email,
            password,
            securityQuestion,
            securityAnswer
        });
        return response.data;
    } catch (error) {
        console.error('Error registering user:', error);
        throw error.response?.data?.message || 'Registration failed.';
    }
}

export async function login({email, password}) {
    try{
        const response = await api.post('/api/auth/login', {
            email,
            password
        });
        return response.data;
    } catch (error) {
        console.error('Error logging in user:', error);
        throw error.response?.data?.message || 'Invalid email or password.';
    }
}

export async function logout() {
    try{
        const response = await api.get('/api/auth/logout'); 
        return response.data;
    } catch (error) {
        console.error('Error logging out user:', error);
        throw error.response?.data?.message || 'Logout failed.';
    }   
}

export async function getMe() {
    try{
        const response = await api.get('/api/auth/get-me');
        return response.data;
    } catch (error) {
        console.log('Error fetching user data:', error);
    }
}

// ─── SECURITY QUESTION RECOVERY API FUNCTIONS ───────────────────────────

export async function getSecurityQuestion(email) {
    try {
        const response = await api.post('/api/auth/get-security-question', { email });
        return response.data;
    } catch (error) {
        console.error('Error fetching security question:', error);
        throw error.response?.data?.message || 'Failed to fetch security question.';
    }
}

export async function verifySecurityAnswer(email, securityAnswer) {
    try {
        const response = await api.post('/api/auth/verify-security-answer', { email, securityAnswer });
        return response.data; // returns resetToken
    } catch (error) {
        console.error('Error verifying answer:', error);
        throw error.response?.data?.message || 'Answer verification failed.';
    }
}

export async function resetPassword(resetToken, newPassword) {
    try {
        const response = await api.post('/api/auth/reset-password', { resetToken, newPassword });
        return response.data;
    } catch (error) {
        console.error('Error resetting password:', error);
        throw error.response?.data?.message || 'Password reset failed.';
    }
}

export async function deleteAccount(password) {
    try {
        const response = await api.delete('/api/auth/delete-account', { data: { password } });
        return response.data;
    } catch (error) {
        console.error('Error deleting account:', error);
        throw error.response?.data?.message || 'Account deletion failed.';
    }
}