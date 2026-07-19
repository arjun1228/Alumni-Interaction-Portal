import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { verifyEmail } from '../services/api';

export const VerifyEmail = () => {
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('Verifying your email token...');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        if (!token) {
            setStatus('error');
            setMessage('No verification token provided in the link.');
            return;
        }

        const runVerification = async () => {
            try {
                const res = await verifyEmail(token);
                setStatus('success');
                setMessage(res.message || 'Your email address has been verified successfully! You can now close this tab and log in.');
            } catch (err) {
                console.error(err);
                setStatus('error');
                setMessage(err.message || 'Verification failed. The token may be expired or invalid.');
            }
        };

        runVerification();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-transparent dark:border-slate-850 rounded-3xl shadow-2xl p-8 text-center animate-in fade-in duration-300">
                <div className="flex flex-col items-center">
                    {status === 'verifying' && (
                        <>
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-955/30 rounded-full flex items-center justify-center mb-6 text-blue-605 dark:text-blue-400">
                                <Loader2 className="w-8 h-8 animate-spin" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Verifying Email</h2>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">{message}</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="w-16 h-16 bg-green-105 dark:bg-green-955/30 rounded-full flex items-center justify-center mb-6 text-green-600 dark:text-green-400">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-805 dark:text-white mb-2">Verification Successful!</h2>
                            <p className="text-slate-655 dark:text-slate-350 mb-6">{message}</p>
                            <a
                                href="/"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-all cursor-pointer inline-block"
                            >
                                Go to Login Page
                            </a>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-955/30 rounded-full flex items-center justify-center mb-6 text-red-650 dark:text-red-400">
                                <XCircle className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-805 dark:text-white mb-2">Verification Failed</h2>
                            <p className="text-slate-655 dark:text-slate-350 mb-6">{message}</p>
                            <a
                                href="/"
                                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-3 px-4 rounded-xl transition-all cursor-pointer inline-block"
                            >
                                Return to Login
                            </a>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
