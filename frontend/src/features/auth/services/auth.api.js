import api from '../../../api/api'

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

// ─── REGISTRATION EMAIL OTP VERIFICATION ────────────────────────────────────
// These 2 functions power the inline, button-free email verification on Register.
// They are auto-triggered by UI events (blur + 6th digit typed), not by button clicks.
// They are auto-triggered by UI events (blur + 6th digit typed), not by button clicks.

/**
 * Step 1: Send Registration OTP — auto-called when user blurs the email field.
 * Backend checks if email is already taken, generates OTP, emails it.
 * @param {string} email - The email address to verify
 */
export async function sendRegistrationOtp(email) {
    try {
        const response = await api.post('/api/auth/send-registration-otp', { email });
        return response.data;
    } catch (error) {
        console.error('Error sending registration OTP:', error);
        throw error.response?.data?.message || 'Failed to send verification OTP.';
    }
}

/**
 * Step 2: Verify Registration OTP — auto-called when user types the 6th OTP digit.
 * Backend compares OTP, returns { verified: true } if correct.
 * No button click needed — triggers automatically!
 * @param {string} email - The email address being verified
 * @param {string} otp - The 6-digit OTP entered by the user
 * @returns {object} { success, message, verified }
 */
export async function verifyRegistrationOtp(email, otp) {
    try {
        const response = await api.post('/api/auth/verify-registration-otp', { email, otp });
        return response.data;
    } catch (error) {
        console.error('Error verifying registration OTP:', error);
        throw error.response?.data?.message || 'OTP verification failed.';
    }
}

// ─── FORGOT PASSWORD API FUNCTIONS ──────────────────────────────────────
// These 3 functions correspond to the 3-step forgot password flow on the backend.

/**
 * Step 1: Request OTP — sends a 6-digit OTP to the user's email.
 * @param {string} email - The registered email address to send the OTP to
 */
export async function forgotPassword(email) {
    try {
        const response = await api.post('/api/auth/forgot-password', { email });
        return response.data;
    } catch (error) {
        console.error('Error sending OTP:', error);
        throw error.response?.data?.message || 'Failed to send OTP.';
    }
}

/**
 * Step 2: Verify OTP — checks if the user-entered OTP matches.
 * @param {string} email - The email address associated with the OTP
 * @param {string} otp - The 6-digit OTP entered by the user
 * @returns {object} { success, message, resetToken }
 */
export async function verifyOtp(email, otp) {
    try {
        const response = await api.post('/api/auth/verify-otp', { email, otp });
        return response.data;
    } catch (error) {
        console.error('Error verifying OTP:', error);
        throw error.response?.data?.message || 'OTP verification failed.';
    }
}

/**
 * Step 3: Reset Password — uses the reset token to authorize setting a new password.
 * @param {string} resetToken - The JWT received from verifyOtp
 * @param {string} newPassword - The new password to set
 */
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