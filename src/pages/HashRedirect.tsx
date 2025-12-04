import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * This component handles redirects from non-hash URLs to hash-based URLs
 * Useful when external services (like Supabase) send links to /reset-password
 * but the app uses HashRouter and expects /#/reset-password
 */
export default function HashRedirect() {
    const navigate = useNavigate();

    useEffect(() => {
        // Check if we're on a non-hash reset password URL
        const path = window.location.pathname;
        const hash = window.location.hash;
        const search = window.location.search;

        console.log('🔄 HashRedirect - Checking URL:', {
            pathname: path,
            hash,
            search,
            href: window.location.href
        });

        // If we're at /reset-password (not /#/reset-password)
        // This happens when Supabase sends emails with the wrong URL format
        if (path === '/reset-password' || path.includes('/reset-password')) {
            console.log('🔄 HashRedirect - Detected /reset-password, redirecting to /#/reset-password');

            // Build the new hash-based URL with all parameters preserved
            let newUrl = `${window.location.origin}/#/reset-password`;

            // If there's a hash with tokens (format: /reset-password#access_token=...)
            if (hash && hash.length > 1) {
                newUrl += hash; // This will create /#/reset-password#access_token=...
            }

            // If there are query params (format: /reset-password?access_token=...)
            if (search) {
                // Convert to hash format
                newUrl += hash.length > 1 ? '&' : '#';
                newUrl += search.substring(1); // Remove the '?'
            }

            console.log('🔄 HashRedirect - Redirecting to:', newUrl);
            window.location.href = newUrl;
            return;
        }

        // If we're at /forgot-password (not /#/forgot-password)
        if (path === '/forgot-password' || path.includes('/forgot-password')) {
            console.log('🔄 HashRedirect - Detected /forgot-password, redirecting to /#/forgot-password');
            window.location.href = `${window.location.origin}/#/forgot-password`;
            return;
        }
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6">
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Redirigiendo...</p>
                </div>
            </div>
        </div>
    );
}
