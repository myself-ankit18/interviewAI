import axios from 'axios'
const api = axios.create({
    baseURL: 'http://localhost:3000',
    withCredentials: true
});

export async function register({username, email, password}) {
    try{
        const response = await api.post('/api/auth/register', {
            username,
            email,
            password
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