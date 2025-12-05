import React, { createContext, useState, useEffect, useCallback, useContext, useMemo } from 'react';
import type { User, Permission, UserRole, Role } from '../types';
import { APP_CONFIG } from '../utils/config';
import { useUI } from './UIContext';
import { 
    auth, 
    onAuthStateChanged, 
    signOut, 
    getRedirectResult, 
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    updateProfile,
    sendPasswordResetEmail,
    reauthenticateWithCredential,
    EmailAuthProvider,
    updatePassword,
} from '../firebase';
// @FIX: Corrected import syntax for the FirebaseUser type to resolve a module declaration error.
import type { FirebaseUser } from '../firebase';


interface AuthContextType {
    currentUser: User | null;
    setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
    setRolePermissions: React.Dispatch<React.SetStateAction<Record<UserRole, Permission[]>>>;
    rolePermissions: Record<UserRole, Permission[]>;
    staffLogin: (mobile: string, password: string) => Promise<string | null>;
    unifiedLogin: (identifier: string, password: string) => Promise<string | null>;
    logout: () => void;
    
    // New Email/Password methods
    registerWithEmailPassword: (details: { name: string; mobile: string; email: string; password: string }) => Promise<string | null>;
    loginWithEmailPassword: (email: string, password: string) => Promise<string | null>;
    sendPasswordResetLink: (email: string) => Promise<string | null>;

    // Google Sign-In
    loginWithGoogle: (token: string) => Promise<string | null>;

    completeProfile: (details: { name: string; mobile: string; governorate: string; address_details: string; }) => Promise<void>;
    isCompletingProfile: boolean;
    newUserFirebaseData: { uid: string; phoneNumber: string | null; email?: string | null, name?: string | null, photoURL?: string | null, providerId: string } | null;
    updateUserProfile: (userId: number, updates: { name?: string; mobile?: string; profilePicture?: string; governorate?: string; address_details?: string; }) => Promise<void>;
    changeCurrentUserPassword: (currentPassword: string, newPassword: string) => Promise<string | null>;
    hasPermission: (permission: Permission) => boolean;
    isAdmin: boolean;
    roles: Role[];
    refetchAuthData: () => Promise<void>;
    isAuthenticating: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const resolveImageUrl = (path: string | undefined): string => {
  if (!path || path.startsWith('http') || path.startsWith('data:')) {
    return path || '';
  }
  const domain = new URL(APP_CONFIG.API_BASE_URL).origin;
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${domain}/${cleanPath}`;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { setIsProcessing, showToast, t } = useUI();
    
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        const savedUser = localStorage.getItem('restaurant_currentUser');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [roles, setRoles] = useState<Role[]>([]);
    const [rolePermissions, setRolePermissions] = useState<Record<UserRole, Permission[]>>({});
    
    const [isCompletingProfile, setIsCompletingProfile] = useState(false);
    const [newUserFirebaseData, setNewUserFirebaseData] = useState<{ uid: string; phoneNumber: string | null; email?: string | null, name?: string | null, photoURL?: string | null, providerId: string } | null>(null);
    const [isAuthenticating, setIsAuthenticating] = useState(true);

    const fetchBaseAuthData = useCallback(async () => {
         try {
            const fetchOptions = { method: 'GET' };
            const [rolesResponse, permissionsResponse] = await Promise.all([
                fetch(`${APP_CONFIG.API_BASE_URL}get_roles.php`, fetchOptions),
                fetch(`${APP_CONFIG.API_BASE_URL}get_permissions.php`, fetchOptions)
            ]);
            if (rolesResponse.ok) setRoles(await rolesResponse.json() || []);
            if (permissionsResponse.ok) setRolePermissions(await permissionsResponse.json() || {});
         } catch (e) { console.error("Failed to fetch base auth data", e); }
    }, []);

    useEffect(() => {
        fetchBaseAuthData();
    }, [fetchBaseAuthData]);

    useEffect(() => {
      if (currentUser) localStorage.setItem('restaurant_currentUser', JSON.stringify(currentUser));
      else localStorage.removeItem('restaurant_currentUser');
    }, [currentUser]);

    const logout = useCallback(async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out from Firebase:", error);
        }
        setCurrentUser(null);
        setIsCompletingProfile(false);
        setNewUserFirebaseData(null);
        setIsAuthenticating(false);
        window.location.hash = '#/login';
    }, [setCurrentUser, setIsCompletingProfile, setNewUserFirebaseData]);

     useEffect(() => {
        let isMounted = true;
        
        getRedirectResult(auth)
            .then(result => {
                if (result && isMounted) {
                    setIsProcessing(true);
                }
            })
            .catch(error => {
                console.error("Google Sign-In Redirect Error", error);
                if (isMounted) {
                    showToast(`Google Sign-In Error: ${error.message}`);
                    setIsProcessing(false);
                }
            });

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!isMounted) return;
            
            if (roles.length === 0 && firebaseUser) {
                setIsProcessing(true);
                return;
            }

            if (firebaseUser) {
                setIsProcessing(true);

                const isEmailPassProvider = firebaseUser.providerData.some(p => p.providerId === 'password');
                if (isEmailPassProvider && !firebaseUser.emailVerified) {
                    showToast(t.pleaseVerifyEmail);
                    await logout();
                    if(isMounted) {
                        setIsProcessing(false);
                    }
                    return;
                }

                try {
                    const providerId = firebaseUser.providerData[0]?.providerId;
                    const isEmailBased = providerId === 'google.com' || providerId === 'password';
                    
                    const endpoint = isEmailBased ? 'get_user_by_email.php' : 'get_user_by_fid.php';
                    const body = isEmailBased ? { email: firebaseUser.email } : { firebase_uid: firebaseUser.uid };

                    const response = await fetch(`${APP_CONFIG.API_BASE_URL}${endpoint}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body)
                    });
                    
                    if (!response.ok && response.status !== 404) {
                        throw new Error(`Server connection failed: ${response.status}`);
                    }
                    
                    const result = await response.json();
                    if (result.success && result.user) {
                        const dbUser = result.user;
                        const profilePictureUrl = resolveImageUrl(dbUser.profile_picture) || `https://placehold.co/512x512/60a5fa/white?text=${(dbUser.name || 'U').charAt(0).toUpperCase()}`;
                        if(isMounted) {
                            setCurrentUser({ 
                                id: Number(dbUser.id), 
                                name: dbUser.name, 
                                mobile: dbUser.mobile, 
                                email: dbUser.email,
                                password: '', 
                                role: String(dbUser.role_id), 
                                profilePicture: profilePictureUrl,
                                firebase_uid: dbUser.firebase_uid,
                                google_id: dbUser.google_id,
                                governorate: dbUser.governorate,
                                address_details: dbUser.address_details
                            });
                            setIsCompletingProfile(false);
                            if (window.location.hash.startsWith('#/login')) {
                               const customerRole = roles.find(r => r.name.en.toLowerCase() === 'customer');
                               if (customerRole && String(dbUser.role_id) === customerRole.key) {
                                   window.location.hash = '#/profile';
                               } else {
                                   window.location.hash = '#/admin';
                               }
                            }
                        }
                    } else if (response.status === 404 && result.error.includes("not found")) {
                        if (isMounted) {
                            setNewUserFirebaseData({
                                uid: firebaseUser.uid,
                                phoneNumber: firebaseUser.phoneNumber,
                                email: firebaseUser.email,
                                name: firebaseUser.displayName,
                                photoURL: firebaseUser.photoURL,
                                providerId: providerId
                            });
                            setIsCompletingProfile(true);
                        }
                    } else {
                        throw new Error(result.error || "An unknown backend error occurred.");
                    }
                } catch (error) {
                    console.error("Auth state change error:", error);
                    showToast(t.accountVerificationFailed);
                    if (isMounted) await logout();
                } finally {
                    if (isMounted) {
                       setIsProcessing(false);
                    }
                }
            } else {
                setCurrentUser(prevUser => {
                    if (!prevUser) return null;
                    if (prevUser.firebase_uid) {
                        return null; 
                    }
                    return prevUser;
                });
                if(isMounted) {
                    setIsProcessing(false);
                }
            }
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [roles, setIsProcessing, showToast, logout, t.pleaseVerifyEmail, t.accountVerificationFailed]);

    // This effect handles redirection for non-Firebase (manual) logins, like staff.
    useEffect(() => {
        if (currentUser && !currentUser.firebase_uid && !currentUser.google_id && window.location.hash.startsWith('#/login')) {
            const customerRole = roles.find(r => r.name.en.toLowerCase() === 'customer');
            // If not a customer, redirect to admin.
            if (!customerRole || currentUser.role !== customerRole.key) {
                window.location.hash = '#/admin';
            }
        }
    }, [currentUser, roles]);
    
    useEffect(() => {
        // This effect ensures that isAuthenticating is turned off only after
        // the currentUser state has been fully updated in React. It runs on initial
        // load and whenever a user logs in or out.
        setIsAuthenticating(false);
    }, [currentUser]);

    const userRoleDetails = useMemo(() => roles.find(r => r.key === currentUser?.role), [roles, currentUser]);
    
    const isAdmin = useMemo(() => {
        if (!userRoleDetails?.name?.en || typeof userRoleDetails.name.en !== 'string') {
            return false;
        }
        const roleName = userRoleDetails.name.en.toLowerCase();
        return roleName !== 'customer';
    }, [userRoleDetails]);

    const hasPermission = useCallback((permission: Permission): boolean => {
        if (!currentUser || !userRoleDetails) return false;
        if (userRoleDetails.name.en.toLowerCase() === 'superadmin') return true;
        const userPermissions = rolePermissions[currentUser.role] ?? [];
        return userPermissions.includes(permission);
    }, [currentUser, rolePermissions, userRoleDetails]);

    const staffLogin = useCallback(async (mobile: string, password: string): Promise<string | null> => {
        setIsAuthenticating(true);
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}login.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mobile, password }) });
            const result = await response.json();
            if (!response.ok || !result.success) {
                if (result.error && result.error.toLowerCase().includes('invalid credentials')) {
                    return t.invalidCredentials;
                }
                return result.error || t.invalidCredentials;
            }

            const dbUser = result.user;
            const roleFromApi = String(dbUser.role_id || '9');
            const profilePictureUrl = resolveImageUrl(dbUser.profile_picture) || `https://placehold.co/512x512/60a5fa/white?text=${(dbUser.name || 'U').charAt(0).toUpperCase()}`;

            setCurrentUser({ id: Number(dbUser.id), name: dbUser.name, mobile: dbUser.mobile, password: '', role: roleFromApi, profilePicture: profilePictureUrl });
            return null;
        } catch (error) {
            console.error('Login error:', error);
            return t.invalidCredentials;
        } finally {
            setIsProcessing(false);
        }
    }, [setIsProcessing, t.invalidCredentials, setCurrentUser]);

    const registerWithEmailPassword = useCallback(async (details: { name: string; mobile: string; email: string; password: string }): Promise<string | null> => {
        setIsAuthenticating(true);
        setIsProcessing(true);
        try {
            // Step 1: Create user in Firebase
            const userCredential = await createUserWithEmailAndPassword(auth, details.email, details.password);
            const firebaseUser = userCredential.user;
            await updateProfile(firebaseUser, { displayName: details.name });

            // Step 2: Create user in our backend database
            const addUserPayload = {
                name: details.name,
                mobile: details.mobile,
                email: details.email,
                firebase_uid: firebaseUser.uid,
                role: 'customer' // Explicitly set role
            };
            const addUserResponse = await fetch(`${APP_CONFIG.API_BASE_URL}add_user.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(addUserPayload),
            });
            const addUserResult = await addUserResponse.json();
            if (!addUserResponse.ok || !addUserResult.success) {
                // If backend creation fails, we should ideally delete the Firebase user to prevent orphans.
                // For now, we'll just throw the error.
                await firebaseUser.delete(); // Attempt to clean up Firebase user
                throw new Error(addUserResult.error || "Failed to create user profile in database.");
            }

            // Step 3: Send verification email and sign out
            await sendEmailVerification(firebaseUser);
            await signOut(auth); // Log out until they verify. onAuthStateChanged will handle setting auth states to false.
            showToast(t.emailVerificationSent);
            return null;
        } catch (error: any) {
            console.error("Email registration error:", error);
            setIsProcessing(false);
            if (error.code === 'auth/network-request-failed') {
                return t.networkRequestFailed;
            }
            return error.message || "Registration failed.";
        }
    }, [setIsProcessing, showToast, t.emailVerificationSent, t.networkRequestFailed]);
    
    const loginWithEmailPassword = useCallback(async (email: string, password: string): Promise<string | null> => {
        setIsAuthenticating(true);
        setIsProcessing(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return null; // onAuthStateChanged will handle the rest
        } catch (error: any) {
            console.error("Email login error:", error);
            setIsProcessing(false);
            if (error.code === 'auth/network-request-failed') {
                return t.networkRequestFailed;
            }
            if (error.code === 'auth/invalid-credential') {
                return t.invalidCredentials;
            }
            return error.message || "Login failed.";
        }
    }, [setIsProcessing, t.invalidCredentials, t.networkRequestFailed]);
    
    const loginWithGoogle = useCallback(async (token: string): Promise<string | null> => {
        setIsAuthenticating(true);
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}google_login.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
    
            const responseText = await response.text();
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                console.error("Server response was not valid JSON:", responseText);
                return t.googleSignInInvalidResponse;
            }
    
            if (!response.ok || !result.success) {
                console.error("Google login backend error:", result.error, result.details);
                 return result.error ? `${result.error} (Check console for details)` : t.googleSignInFailed;
            }
    
            const dbUser = result.user;
            const userObject: User = {
                id: Number(dbUser.id),
                name: dbUser.name,
                mobile: dbUser.mobile,
                email: dbUser.email,
                password: '', 
                role: String(dbUser.role_id),
                profilePicture: resolveImageUrl(dbUser.profile_picture) || `https://placehold.co/512x512/60a5fa/white?text=${(dbUser.name || 'U').charAt(0).toUpperCase()}`,
                google_id: dbUser.google_id,
                governorate: dbUser.governorate,
                address_details: dbUser.address_details
            };
            
            setCurrentUser(userObject);
    
            if (!userObject.mobile || !userObject.governorate || !userObject.address_details) {
                setIsCompletingProfile(true);
            } else {
                 if (window.location.hash.startsWith('#/login')) {
                    const customerRole = roles.find(r => r.name.en.toLowerCase() === 'customer');
                    if (customerRole && userObject.role === customerRole.key) {
                        window.location.hash = '#/profile';
                    } else {
                        window.location.hash = '#/admin';
                    }
                 }
            }
    
            return null; // Success
        } catch (error) {
            console.error('Google login network error:', error);
            return t.networkRequestFailed;
        } finally {
            setIsProcessing(false);
        }
    }, [setIsProcessing, setCurrentUser, setIsCompletingProfile, t, roles]);

    const sendPasswordResetLink = useCallback(async (email: string): Promise<string | null> => {
        setIsProcessing(true);
        try {
            await sendPasswordResetEmail(auth, email);
            return null;
        } catch (error: any) {
            console.error("Password reset error:", error);
            if (error.code === 'auth/network-request-failed') {
                return t.networkRequestFailed;
            }
            return error.message || "Failed to send reset link.";
        } finally {
            setIsProcessing(false);
        }
    }, [setIsProcessing, t.networkRequestFailed]);

    const unifiedLogin = useCallback(async (identifier: string, password: string): Promise<string | null> => {
        if (!identifier.includes('@')) {
            return await staffLogin(identifier, password);
        }
    
        if (identifier.includes('@')) {
            return await loginWithEmailPassword(identifier, password);
        }
        
        return t.invalidCredentials;
    }, [staffLogin, loginWithEmailPassword, t.invalidCredentials]);


     const updateUserProfile = useCallback(async (userId: number, updates: { name?: string; mobile?: string; profilePicture?: string; governorate?: string; address_details?: string; }) => {
        if (!currentUser || currentUser.id !== userId) return;

        const originalUser = { ...currentUser };
        
        let optimisticUpdates: Partial<User> = {};
        if (updates.name) optimisticUpdates.name = updates.name;
        if (updates.mobile) optimisticUpdates.mobile = updates.mobile;
        if (updates.governorate) optimisticUpdates.governorate = updates.governorate;
        if (updates.address_details) optimisticUpdates.address_details = updates.address_details;
        if (updates.profilePicture && updates.profilePicture.startsWith('data:')) {
            optimisticUpdates.profilePicture = updates.profilePicture;
        }

        setCurrentUser(prev => prev ? { ...prev, ...optimisticUpdates } : null);

        setIsProcessing(true);
        try {
            const payload: any = { id: userId, ...updates };

            if (updates.profilePicture && updates.profilePicture.startsWith('data:image')) {
                const res = await fetch(updates.profilePicture);
                const blob = await res.blob();
                const formData = new FormData();
                formData.append('image', blob, 'profile.png');
                formData.append('type', 'users');
                const relativeOldPath = (currentUser.profilePicture || '').split('?')[0].replace(new URL(APP_CONFIG.API_BASE_URL).origin + '/', '');
                formData.append('oldPath', relativeOldPath);
                const uploadRes = await fetch(`${APP_CONFIG.API_BASE_URL}upload_image.php`, { method: 'POST', body: formData });
                const result = await uploadRes.json();
                if (result.success && result.url) {
                    // The backend script for updating user info expects `profile_picture` (snake_case)
                    payload.profile_picture = result.url.split('?v=')[0];
                    // Remove the original camelCase key to avoid confusion
                    delete payload.profilePicture;
                } else {
                    throw new Error(result.error || 'Image upload failed');
                }
            }

            const response = await fetch(`${APP_CONFIG.API_BASE_URL}update_user.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || t.profileUpdateFailed);
            }
            
            const finalUser = result.user; // from backend, snake_case
            if (finalUser) {
                setCurrentUser(prev => {
                    if (!prev) return null;
                    // Create a new user state from previous, but update with server data
                    const updatedState = {
                        ...prev,
                        name: finalUser.name ?? prev.name,
                        mobile: finalUser.mobile ?? prev.mobile,
                        email: finalUser.email ?? prev.email,
                        role: finalUser.role_id ? String(finalUser.role_id) : prev.role,
                        profilePicture: resolveImageUrl(finalUser.profile_picture),
                        governorate: finalUser.governorate ?? prev.governorate,
                        address_details: finalUser.address_details ?? prev.address_details
                    };
                    return updatedState;
                });
            } else {
                // If server doesn't send back user object, but we uploaded an image,
                // we can construct the URL from our payload.
                if (payload.profile_picture) {
                    setCurrentUser(prev => prev ? { ...prev, profilePicture: resolveImageUrl(payload.profile_picture) } : null);
                }
            }

            showToast(t.profileUpdatedSuccess);
        } catch (error: any) {
            console.error("Update profile error:", error);
            setCurrentUser(originalUser); // Revert on failure
            showToast(error.message || t.profileUpdateFailed);
        } finally {
            setIsProcessing(false);
        }
    }, [currentUser, setIsProcessing, showToast, t.profileUpdatedSuccess, t.profileUpdateFailed, setCurrentUser]);
    
    const completeProfile = useCallback(async (details: { name: string; mobile: string; governorate: string; address_details: string; }) => {
        setIsAuthenticating(true);
        setIsProcessing(true);
        try {
            if (newUserFirebaseData) {
                // Existing logic for when a new user signs up via Firebase directly
                const payload: any = {
                    name: details.name,
                    mobile: details.mobile,
                    governorate: details.governorate,
                    address_details: details.address_details,
                    role: 'customer'
                };
    
                if (newUserFirebaseData.providerId === 'google.com') {
                    payload.google_id = newUserFirebaseData.uid;
                    payload.email = newUserFirebaseData.email;
                    payload.profilePicture = newUserFirebaseData.photoURL;
                } else {
                    payload.firebase_uid = newUserFirebaseData.uid;
                    if (newUserFirebaseData.email) payload.email = newUserFirebaseData.email;
                }
    
                const response = await fetch(`${APP_CONFIG.API_BASE_URL}add_user.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const result = await response.json();
    
                if (!response.ok || !result.success) {
                    throw new Error(result.error || 'Failed to complete profile.');
                }
    
                const dbUser = result.user;
                const profilePictureUrl = resolveImageUrl(dbUser.profile_picture) || `https://placehold.co/512x512/60a5fa/white?text=${(dbUser.name || 'U').charAt(0).toUpperCase()}`;
    
                setCurrentUser({ 
                    id: Number(dbUser.id), 
                    name: dbUser.name, 
                    mobile: dbUser.mobile, 
                    email: dbUser.email,
                    password: '', 
                    role: String(dbUser.role_id), 
                    profilePicture: profilePictureUrl,
                    firebase_uid: dbUser.firebase_uid,
                    google_id: dbUser.google_id,
                    governorate: dbUser.governorate,
                    address_details: dbUser.address_details
                });
                
            } else if (currentUser && (!currentUser.mobile || !currentUser.governorate || !currentUser.address_details)) {
                // Logic for existing but incomplete user (e.g., from custom Google Sign-In)
                await updateUserProfile(currentUser.id, details);
            }
            
            setIsCompletingProfile(false);
            setNewUserFirebaseData(null); // Always clear this after completion attempt
            window.location.hash = '#/profile';
            
        } catch (error: any) {
            console.error("Complete profile error:", error);
            showToast(error.message || t.profileSaveFailed);
        } finally {
            setIsProcessing(false);
        }
    }, [newUserFirebaseData, currentUser, setIsProcessing, showToast, t.profileSaveFailed, setCurrentUser, updateUserProfile]);

    const changeCurrentUserPassword = useCallback(async (currentPassword: string, newPassword: string): Promise<string | null> => {
        setIsProcessing(true);
        try {
            if (!auth.currentUser?.email) {
                 const response = await fetch(`${APP_CONFIG.API_BASE_URL}update_user.php`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ id: currentUser?.id, password: newPassword, old_password: currentPassword })
                });
                 const result = await response.json();
                 if (!response.ok || !result.success) {
                    if (result.error && result.error.includes("Incorrect current password")) {
                         return t.incorrectCurrentPassword;
                    }
                    throw new Error(result.error || "Failed to update password");
                 }
            } else {
                const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
                await reauthenticateWithCredential(auth.currentUser, credential);
                await updatePassword(auth.currentUser, newPassword);
            }

            showToast(t.passwordChangedSuccess);
            return null;
        } catch (error: any) {
            console.error("Change password error:", error);
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                return t.incorrectCurrentPassword;
            }
            return error.message || "Failed to change password.";
        } finally {
            setIsProcessing(false);
        }
    }, [setIsProcessing, showToast, t.passwordChangedSuccess, t.incorrectCurrentPassword, currentUser]);

    const value: AuthContextType = {
        currentUser,
        setCurrentUser,
        setRolePermissions,
        rolePermissions,
        staffLogin,
        unifiedLogin,
        logout,
        registerWithEmailPassword,
        loginWithEmailPassword,
        sendPasswordResetLink,
        loginWithGoogle,
        completeProfile,
        isCompletingProfile,
        newUserFirebaseData,
        updateUserProfile,
        changeCurrentUserPassword,
        hasPermission,
        isAdmin,
        roles,
        refetchAuthData: fetchBaseAuthData,
        isAuthenticating,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
