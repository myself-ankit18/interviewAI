import {createBrowserRouter} from 'react-router'
import Login from './features/auth/pages/Login'
import Register from './features/auth/pages/Register'
import ForgotPassword from './features/auth/pages/ForgotPassword'
import Protected from './features/auth/components/Protected'
import Home from './features/interview/pages/Home'
import Interview from './features/interview/pages/Interview'
export const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/register",
        element: <Register />
    },
    // FORGOT PASSWORD ROUTE: Public route (no <Protected> wrapper) since
    // the user can't log in to access it. Contains the 3-step OTP flow.
    {
        path: "/forgot-password",
        element: <ForgotPassword />
    },
    {
        path:"/",
        element: <Protected><Home /></Protected>
    },{
        path:"/interview/:interviewId",
        element: <Protected><Interview /></Protected>
    }
])