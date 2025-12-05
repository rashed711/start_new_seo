import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';

// Declare the google object from the script in index.html
declare const google: any;

export const LoginPage: React.FC = () => {
    const { t, isProcessing } = useUI();
    const { unifiedLogin, registerWithEmailPassword, loginWithGoogle } = useAuth();

    const [formType, setFormType] = useState<'login' | 'register'>('login');
    const [error, setError] = useState('');

    // Unified login state
    const [identifier, setIdentifier] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Register state
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const googleButtonRef = useRef<HTMLDivElement>(null);
    const [isAndroid, setIsAndroid] = useState(false);
    const authCallbacksRef = useRef({ loginWithGoogle, setError });

    useEffect(() => {
        authCallbacksRef.current = { loginWithGoogle, setError };
    }, [loginWithGoogle, setError]);
    
    useEffect(() => {
        if ((window as any).Android?.requestGoogleSignIn) {
            setIsAndroid(true);
        }

        (window as any).handleGoogleSignInFromAndroid = async (token: string) => {
            if (!token) {
                authCallbacksRef.current.setError(t.language === 'ar' ? 'فشل تسجيل الدخول من أندرويد: لم يتم استلام رمز.' : 'Android sign-in failed: No token received.');
                return;
            }
            authCallbacksRef.current.setError('');
            const errorMessage = await authCallbacksRef.current.loginWithGoogle(token);
            if (errorMessage) {
                authCallbacksRef.current.setError(errorMessage);
            }
        };

        return () => {
            delete (window as any).handleGoogleSignInFromAndroid;
        };
    }, [t.language]);


    useEffect(() => {
        setError('');
    }, [formType]);

    const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
        e.preventDefault();
        window.location.hash = path;
    };

    const handleUnifiedLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const errorMessage = await unifiedLogin(identifier, loginPassword);
        if (errorMessage) {
            setError(errorMessage);
        }
    };
    
    const handleGoogleSignIn = useCallback(async (response: any) => {
        if (response.credential) {
            setError('');
            const errorMessage = await loginWithGoogle(response.credential);
            if (errorMessage) {
                setError(errorMessage);
            }
        } else {
            setError(t.language === 'ar' ? 'فشل تسجيل الدخول باستخدام جوجل.' : 'Google sign-in failed.');
        }
    }, [loginWithGoogle, t.language]);

    useEffect(() => {
        if (isAndroid || typeof google === 'undefined' || !google.accounts) {
            // Don't render GSI button on Android or if script isn't ready
            return;
        }

        google.accounts.id.initialize({
            client_id: "735797678309-p764bsgq9vh3viv6hn09h467lv20s3oh.apps.googleusercontent.com",
            callback: handleGoogleSignIn
        });

        if (googleButtonRef.current) {
            // Ensure the container is empty before rendering
            googleButtonRef.current.innerHTML = ''; 
            google.accounts.id.renderButton(
                googleButtonRef.current,
                { theme: "outline", size: "large", type: "standard", shape: "rectangular", text: "signin_with", logo_alignment: "left" }
            );
        }
    }, [handleGoogleSignIn, formType, isAndroid]);


    const handleCustomerRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (registerPassword !== confirmPassword) {
            setError(t.passwordsDoNotMatch);
            return;
        }
        const errorMessage = await registerWithEmailPassword({ name, mobile, email, password: registerPassword });
        if (errorMessage) {
            setError(errorMessage);
        } else {
            setFormType('login');
            setName('');
            setMobile('');
            setEmail('');
            setRegisterPassword('');
            setConfirmPassword('');
        }
    };

    const renderLoginForm = () => (
        <form className="space-y-4" onSubmit={handleUnifiedLogin}>
            <div>
                <label htmlFor="identifier" className="block mb-2 text-sm font-medium text-slate-800 dark:text-slate-300">{t.emailOrMobile}</label>
                <input 
                    type="text" 
                    id="identifier" 
                    value={identifier} 
                    onChange={(e) => setIdentifier(e.target.value)} 
                    className="w-full p-3 text-slate-900 bg-slate-50 dark:bg-slate-700 dark:text-white border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition" 
                    required 
                />
            </div>
            <div>
                <label htmlFor="login-password" className="block mb-2 text-sm font-medium text-slate-800 dark:text-slate-300">{t.password}</label>
                <input 
                    type="password" 
                    id="login-password" 
                    value={loginPassword} 
                    onChange={(e) => setLoginPassword(e.target.value)} 
                    className="w-full p-3 text-slate-900 bg-slate-50 dark:bg-slate-700 dark:text-white border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition" 
                    required 
                />
            </div>
            <button type="submit" disabled={isProcessing} className="w-full px-5 py-3 font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:bg-primary-400">
                {isProcessing ? '...' : t.login}
            </button>
            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
                <span className="flex-shrink mx-4 text-slate-500 dark:text-slate-400 text-sm">{t.or}</span>
                <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
            </div>
            <div ref={googleButtonRef} className="flex justify-center">
                {isAndroid && (
                    <button
                        type="button"
                        onClick={() => (window as any).Android.requestGoogleSignIn()}
                        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border-2 border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 48 48">
                            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,36.218,44,30.57,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                        </svg>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t.signInWithGoogle}</span>
                    </button>
                )}
            </div>
        </form>
    );

    const renderRegisterForm = () => (
        <form className="space-y-4" onSubmit={handleCustomerRegister}>
            <div>
                <label htmlFor="name" className="block mb-2 text-sm font-medium text-slate-800 dark:text-slate-300">{t.name}</label>
                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 text-slate-900 bg-slate-50 dark:bg-slate-700 dark:text-white border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition" required />
            </div>
            <div>
                <label htmlFor="mobile" className="block mb-2 text-sm font-medium text-slate-800 dark:text-slate-300">{t.mobileNumber}</label>
                <input type="tel" id="mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} className="w-full p-3 text-slate-900 bg-slate-50 dark:bg-slate-700 dark:text-white border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition" required />
            </div>
            <div>
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-slate-800 dark:text-slate-300">{t.email}</label>
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 text-slate-900 bg-slate-50 dark:bg-slate-700 dark:text-white border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition" required />
            </div>
            <div>
                <label htmlFor="register-password" className="block mb-2 text-sm font-medium text-slate-800 dark:text-slate-300">{t.password}</label>
                <input type="password" id="register-password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} className="w-full p-3 text-slate-900 bg-slate-50 dark:bg-slate-700 dark:text-white border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition" required />
            </div>
            <div>
                <label htmlFor="confirmPassword" className="block mb-2 text-sm font-medium text-slate-800 dark:text-slate-300">{t.confirmNewPassword}</label>
                <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-3 text-slate-900 bg-slate-50 dark:bg-slate-700 dark:text-white border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition" required />
            </div>
            <button type="submit" disabled={isProcessing} className="w-full px-5 py-3 font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:bg-primary-400">
                {isProcessing ? '...' : t.createAccount}
            </button>
        </form>
    );

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
            <div className="w-full max-w-sm">
                <div className="p-8 space-y-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                    <h1 className="text-2xl font-bold text-center text-primary-600 dark:text-primary-400 mb-6">
                        {formType === 'login' ? t.login : t.createAccount}
                    </h1>

                    {formType === 'login' ? renderLoginForm() : renderRegisterForm()}
                    
                    {error && <p className="text-sm text-red-500 text-center mt-4">{error}</p>}
                    
                     <div className="text-center border-t border-slate-200 dark:border-slate-700 pt-4 mt-6">
                        <a href="#/" onClick={(e) => handleNav(e, '/')} className="text-sm text-primary-600 hover:underline dark:text-primary-500">
                            {t.backToMenu}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};
