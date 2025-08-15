
import React, { useState, useEffect, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../supabase/client';
import { BackArrowIcon, EyeIcon, EyeOffIcon, SpinnerIcon, CheckIcon, UserIcon } from '../../components/Icons';

interface SettingsPageProps {
  user: User;
  onNavigateBack: () => void;
}

// Comprehensive form data from multiple tables
interface FormData {
    // from profiles
    fullName: string;
    username: string;
    geminiApiKey: string;
    // from cv_data
    linkedinUrl: string;
    professionalSummary: string; // from raw_info
    // from banglanutri_profiles
    age: string;
    heightCm: string;
    weightKg: string;
}

// A reusable section component for better UI structure
const SettingsSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-zinc-800 border-2 border-zinc-700 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold text-lime-400 p-4 border-b-2 border-zinc-700">{title}</h3>
        <div className="p-6 space-y-4">
            {children}
        </div>
    </div>
);

// A reusable input component with password visibility toggle
const SettingsInput: React.FC<{ label: string; name: keyof FormData | 'email', value: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; placeholder?: string; disabled?: boolean; readOnly?: boolean }> = ({ label, type = 'text', ...props }) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    return (
        <div>
            <label className="text-sm font-bold text-zinc-300 mb-1 block">{label}</label>
            <div className="relative">
                <input
                    type={isPassword ? (showPassword ? 'text' : 'password') : type}
                    className={`w-full bg-zinc-700 border-2 border-zinc-600 rounded-md p-2 text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400 transition-colors ${props.readOnly ? 'text-zinc-400' : ''}`}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-white"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                )}
            </div>
        </div>
    );
};

const SettingsTextArea: React.FC<{ label: string; name: keyof FormData; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; rows?: number; placeholder?: string; }> = (props) => (
    <div>
        <label className="text-sm font-bold text-zinc-300 mb-1 block">{props.label}</label>
        <textarea
            className="w-full bg-zinc-700 border-2 border-zinc-600 rounded-md p-2 text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400 transition-colors"
            {...props}
        />
    </div>
);


const SettingsPage: React.FC<SettingsPageProps> = ({ user, onNavigateBack }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        username: '',
        geminiApiKey: '',
        linkedinUrl: '',
        professionalSummary: '',
        age: '',
        heightCm: '',
        weightKg: '',
    });
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };


    useEffect(() => {
        const fetchData = async () => {
            if (!user?.id) return;
            setLoading(true);
            setError(null);
            try {
                // Fetch data from all three tables concurrently
                const [profileRes, cvRes, nutriRes] = await Promise.all([
                     supabase
                        .from('profiles')
                        .select('full_name, username, gemini_api_key, avatar_url')
                        .eq('id', user.id)
                        .single(),
                     supabase
                        .from('cv_data')
                        .select('linkedin_url, raw_info')
                        .eq('id', user.id)
                        .single(),
                     supabase
                        .from('banglanutri_profiles')
                        .select('age, height_cm, weight_kg')
                        .eq('id', user.id)
                        .single()
                ]);

                // Destructure and handle potential errors or missing data for each request
                const { data: profileData, error: profileError } = profileRes;
                if (profileError && profileError.code !== 'PGRST116') throw new Error(`Profile Fetch Error: ${profileError.message}`);
                const typedProfileData = profileData as unknown as { full_name: string | null; username: string | null; gemini_api_key: string | null; avatar_url: string | null; } | null;

                const { data: cvData, error: cvError } = cvRes;
                if (cvError && cvError.code !== 'PGRST116') throw new Error(`CV Data Fetch Error: ${cvError.message}`);
                const typedCvData = cvData as unknown as { linkedin_url: string | null; raw_info: string | null; } | null;


                const { data: nutriData, error: nutriError } = nutriRes;
                if (nutriError && nutriError.code !== 'PGRST116') throw new Error(`Health Data Fetch Error: ${nutriError.message}`);
                const typedNutriData = nutriData as unknown as { age: number | null; height_cm: number | null; weight_kg: number | null; } | null;

                // Populate form state, handling cases where data might not exist yet
                setFormData({
                    fullName: typedProfileData?.full_name || '',
                    username: typedProfileData?.username || '',
                    geminiApiKey: typedProfileData?.gemini_api_key || '',
                    linkedinUrl: typedCvData?.linkedin_url || '',
                    professionalSummary: typedCvData?.raw_info || '',
                    age: typedNutriData?.age?.toString() || '',
                    heightCm: typedNutriData?.height_cm?.toString() || '',
                    weightKg: typedNutriData?.weight_kg?.toString() || '',
                });
                setAvatarUrl(typedProfileData?.avatar_url || null);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                setError("File is too large. Please upload an image under 2MB.");
                return;
            }
            setAvatarFile(file);
        }
    };

    const avatarPreview = useMemo(() => {
        if (avatarFile) {
            return URL.createObjectURL(avatarFile);
        }
        return avatarUrl;
    }, [avatarFile, avatarUrl]);


    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            let finalAvatarUrl = avatarUrl;
            if (avatarFile) {
                const filePath = `${user.id}/${Date.now()}-${avatarFile.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, avatarFile, { upsert: true });

                if (uploadError) {
                    throw new Error(`Avatar Upload Error: ${uploadError.message}`);
                }
                
                const { data: urlData } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);
                
                finalAvatarUrl = urlData.publicUrl;
                setAvatarUrl(finalAvatarUrl);
                setAvatarFile(null);
            }

            // Prepare data for each table
            const profileUpdates = {
                id: user.id,
                full_name: formData.fullName,
                username: formData.username,
                gemini_api_key: formData.geminiApiKey,
                avatar_url: finalAvatarUrl,
                updated_at: new Date().toISOString(),
            };
            const cvDataUpdates = {
                id: user.id,
                linkedin_url: formData.linkedinUrl,
                raw_info: formData.professionalSummary,
            };
            const nutriProfileUpdates = {
                id: user.id,
                age: formData.age ? Number(formData.age) : null,
                height_cm: formData.heightCm ? Number(formData.heightCm) : null,
                weight_kg: formData.weightKg ? Number(formData.weightKg) : null,
            };

            // Perform upserts concurrently
            const [profileRes, cvRes, nutriRes] = await Promise.all([
                (supabase.from('profiles') as any).upsert([profileUpdates]),
                (supabase.from('cv_data') as any).upsert([cvDataUpdates]),
                (supabase.from('banglanutri_profiles') as any).upsert([nutriProfileUpdates])
            ]);

            if (profileRes.error) throw profileRes.error;
            if (cvRes.error) throw cvRes.error;
            if (nutriRes.error) throw nutriRes.error;

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);

        } catch (err: any) {
             setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-zinc-900 flex items-center justify-center"><SpinnerIcon className="w-12 h-12 text-lime-400" /></div>;
    }

    return (
        <div className="min-h-screen bg-zinc-900 text-white p-4 sm:p-8 font-poppins">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={onNavigateBack}
                    className="flex items-center gap-2 mb-6 text-lime-400 hover:text-lime-300"
                >
                    <BackArrowIcon /> Back to Hub
                </button>

                <h1 className="text-4xl font-extrabold text-white mb-2">Settings & Data</h1>
                <p className="text-zinc-400 mb-8">Manage your profile, API keys, and app-specific data.</p>

                {error && <p className="bg-red-900/50 text-red-300 border border-red-700 p-3 rounded-md mb-6">{error}</p>}

                <div className="space-y-8">
                    <SettingsSection title="User Account">
                        <SettingsInput label="Full Name" name="fullName" value={formData.fullName} onChange={handleInputChange} />
                        <SettingsInput label="Username" name="username" value={formData.username} onChange={handleInputChange} />
                        <div>
                            <label className="text-sm font-bold text-zinc-300 mb-1 block">Profile Picture</label>
                            <div className="flex items-center gap-4">
                                {avatarPreview ? (
                                    <img 
                                        src={avatarPreview} 
                                        alt="Avatar preview" 
                                        className="w-20 h-20 rounded-full bg-zinc-700 object-cover border-2 border-zinc-600"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-zinc-700 flex items-center justify-center border-2 border-zinc-600">
                                        <UserIcon className="w-10 h-10 text-zinc-500"/>
                                    </div>
                                )}
                                <input type="file" id="avatar-upload" className="hidden" accept="image/png, image/jpeg" onChange={handleAvatarChange} disabled={saving} />
                                <label htmlFor="avatar-upload" className="cursor-pointer bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2 px-4 rounded-md border-2 border-zinc-600">
                                    {saving ? '...' : 'Upload Image'}
                                </label>
                            </div>
                        </div>
                        <SettingsInput label="Email Address" name="email" value={user.email || ''} readOnly />
                    </SettingsSection>

                    <SettingsSection title="API Keys">
                        <SettingsInput label="Gemini API Key" name="geminiApiKey" value={formData.geminiApiKey} onChange={handleInputChange} type="password" />
                    </SettingsSection>

                    <SettingsSection title="Professional Info">
                        <SettingsInput label="LinkedIn Profile URL" name="linkedinUrl" value={formData.linkedinUrl} onChange={handleInputChange} placeholder="https://linkedin.com/in/your-profile"/>
                        <SettingsTextArea label="Professional Life Summary" name="professionalSummary" value={formData.professionalSummary} onChange={handleInputChange} rows={8} placeholder="Paste your CV summary or career info here..."/>
                    </SettingsSection>

                    <SettingsSection title="Health & Fitness">
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <SettingsInput label="Age" name="age" value={formData.age} onChange={handleInputChange} type="number"/>
                            <SettingsInput label="Height (cm)" name="heightCm" value={formData.heightCm} onChange={handleInputChange} type="number"/>
                            <SettingsInput label="Weight (kg)" name="weightKg" value={formData.weightKg} onChange={handleInputChange} type="number"/>
                        </div>
                    </SettingsSection>
                </div>

                <div className="mt-8 pt-8 border-t-2 border-zinc-700 flex flex-col sm:flex-row justify-end items-center gap-4">
                     <button
                        onClick={handleLogout}
                        disabled={saving}
                        className="w-full sm:w-auto bg-zinc-700 hover:bg-red-600 text-zinc-300 hover:text-white font-bold py-3 px-4 rounded-md transition-colors disabled:bg-zinc-800"
                    >
                        Logout
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full sm:w-auto bg-lime-400 text-zinc-900 font-bold p-3 rounded-md border-2 border-lime-400 hover:bg-lime-500 transition-colors disabled:bg-zinc-600 flex items-center justify-center gap-2"
                    >
                        {saving ? <SpinnerIcon /> : (success ? <CheckIcon/> : 'Save All Settings')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
