'use client';

import React, { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation'; 
import { UserCircle, FileText, ArrowRight, Clock, AlertCircle } from 'lucide-react';


import { useCandidateTranslations } from '@/modules/candidate-form/hooks/useCandidateTranslations';

import Button from '../atoms/Button';
import TextInput from '../atoms/TextInput';
import Form from '../atoms/Form';
import Loader from '../atoms/Loader';
import Message from '../atoms/Message';

import type { TokenValidationResult } from '@/modules/candidate-form/lib/supabase';

function CandidateForm() {
  const [formData, setFormData] = useState({
    first_name: '',
    telegram_tag: '',
    shift: '',
    experience: '',
    motivation: '',
    about_me: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const redirected = useRef(false);

  const searchParams = useSearchParams();
  const params = useParams(); 
  const router = useRouter();
  const { locale, t } = useCandidateTranslations();

  useEffect(() => {
    async function validateTokenOnLoad() {
      if (redirected.current) return;
      
      try {
        setIsLoading(true);
        setTokenError(null);
        
        const token = params?.token as string || searchParams?.get('token');
        
        if (!token) {
          setTokenError(t('candidateForm.errors.missingToken'));
          setIsLoading(false);
          return;
        }
        
        console.log('Token from URL:', token);
        
        
        const validationResponse = await fetch('/api/auth/validate-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        
        if (!validationResponse.ok) {
          let errorMsg = t('candidateForm.errors.validationError');
          try {
            const errorData = await validationResponse.json();
            errorMsg = errorData?.error || errorMsg;
          } catch {  }
          throw new Error(errorMsg);
        }
        
        const result: TokenValidationResult = await validationResponse.json();
                
        if (!result.success) {
          switch (result.errorCode) {
            case 'ALREADY_USED':
              
              
              if (result.employeeId) {
                  console.log('Token already used, checking existing form/session for:', result.employeeId);
                  sessionStorage.setItem('employeeId', result.employeeId);
                  sessionStorage.setItem('lastUsedToken', token); 
                  
                  
                  try {
                      const formResponse = await fetch(`/api/candidate-form?employeeId=${result.employeeId}`);
                      if (formResponse.ok) {
                          const existingForm = await formResponse.json();
                          if (existingForm?.form_completed) {
                              console.log('Form found and completed, redirecting to test info...');
                              redirected.current = true;
                              router.push(`/test-info?lang=${locale}`);
                              return; 
                          }
                      }
                  } catch (formError) {
                      console.error('Error checking existing form after ALREADY_USED:', formError);
                  }
                   
                  setTokenError(t('candidateForm.errors.tokenUsed'));

              } else {
                   setTokenError(t('candidateForm.errors.tokenUsed'));
              }
              break;
            case 'EXPIRED':
              setTokenError(t('candidateForm.errors.tokenExpired'));
              break;
            case 'NOT_FOUND': 
            case 'INVALID_FORMAT': 
              setTokenError(t('candidateForm.errors.invalidToken'));
              break;
            default:
              setTokenError(t('candidateForm.errors.validationError')); 
              break;
          }
          setIsLoading(false);
          return;
        }

        
        if (!result.employeeId) { 
            
             console.error('Token validation succeeded but no employeeId returned.');
             setTokenError(t('candidateForm.errors.validationError'));
             setIsLoading(false);
             return;
        }

        const employeeId = result.employeeId;
        console.log('Token validated successfully for employee:', employeeId);
        sessionStorage.setItem('employeeId', employeeId);
        sessionStorage.setItem('lastUsedToken', token);
        
        
        const savedCandidateData = sessionStorage.getItem('candidateData');
        const updatedCandidateData = savedCandidateData ? JSON.parse(savedCandidateData) : {};
        sessionStorage.setItem('candidateData', JSON.stringify({
          ...updatedCandidateData,
          employee_id: employeeId,
          userId: employeeId, 
          token: token 
        }));
        
        
        try {
            const formResponse = await fetch(`/api/candidate-form?employeeId=${employeeId}`);
             if (!formResponse.ok) {
                 
                 if (formResponse.status !== 404) {
                    throw new Error(`Failed to fetch existing form: ${formResponse.statusText}`);
                 }
             } else {
                 const existingForm = await formResponse.json();
                 if (existingForm?.form_completed) {
                     console.log('Existing form is completed, redirecting...');
                     
                     sessionStorage.setItem('candidateData', JSON.stringify({ 
                         ...(JSON.parse(sessionStorage.getItem('candidateData') || '{}')),
                         form_completed: true 
                     }));
                     redirected.current = true;
                     router.push(`/test-info?lang=${locale}`);
                     return; 
                 }
             }
        } catch (formError) {
            console.error('Error checking existing candidate form:', formError);
            
        }

        setIsLoading(false);

      } catch (error) {
        console.error('Error during token validation process:', error);
        setTokenError(error instanceof Error ? error.message : t('candidateForm.errors.validationError'));
        setIsLoading(false);
      }
    }
    
    validateTokenOnLoad();

  }, [params, searchParams, locale, router, t]); 

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.first_name.trim()) newErrors.first_name = t('candidateForm.validation.firstNameRequired');
    if (!formData.telegram_tag.trim()) newErrors.telegram_tag = t('candidateForm.validation.telegramTagRequired');
    else if (!/^@[a-zA-Z0-9_]{5,}$/.test(formData.telegram_tag)) newErrors.telegram_tag = t('candidateForm.validation.telegramTagInvalid');
    if (!formData.shift) newErrors.shift = t('candidateForm.validation.shiftRequired');
    if (!formData.experience) newErrors.experience = t('candidateForm.validation.experienceRequired');
    if (!formData.motivation.trim()) newErrors.motivation = t('candidateForm.validation.motivationRequired');
    if (!formData.about_me.trim()) newErrors.about_me = t('candidateForm.validation.aboutMeRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const employeeId = sessionStorage.getItem('employeeId');
      if (!employeeId) {
        setSubmitError(t('candidateForm.errors.noEmployeeId'));
        setIsSubmitting(false);
        return;
      }

      
      const response = await fetch('/api/candidate-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        
        body: JSON.stringify({ employee_id: employeeId, formData: formData })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || t('candidateForm.errors.submitError'));
      }
      
      console.log('Form submitted successfully:', result);
      
      
      const candidateData = JSON.parse(sessionStorage.getItem('candidateData') || '{}');
      sessionStorage.setItem('candidateData', JSON.stringify({ 
          ...candidateData, 
          ...formData, 
          employee_id: employeeId, 
          userId: employeeId, 
          form_completed: true 
      }));

      
      router.push(`/test-info?lang=${locale}`);

    } catch (error) {
      console.error('Form submission error:', error);
      const message = error instanceof Error ? error.message : t('candidateForm.errors.submitErrorUnknown');
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#121212]">
        <Loader size="large" />
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#121212] p-4">
        <Message type="error" message={tokenError} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-gray-100 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-[#1a1a1a] p-8 rounded-xl shadow-lg w-full max-w-2xl border border-[#3d3d3d]">
        <div className="text-center mb-8">
          <FileText className="mx-auto h-12 w-12 text-pink-500 mb-4" />
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-2">
            {t('candidateForm.title')}
          </h1>
          <p className="text-gray-400">{t('candidateForm.description')}</p>
        </div>

        {submitError && <Message type="error" message={submitError} />}

        <Form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <TextInput
              label={t('candidateForm.fields.firstName')}
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              required
              error={errors.first_name}
            />
            <TextInput
              label={t('candidateForm.fields.telegramTag')}
              name="telegram_tag"
              value={formData.telegram_tag}
              onChange={handleInputChange}
              required
              error={errors.telegram_tag}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {t('candidateForm.fields.shift')} <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-3">
              {[t('candidateForm.shifts.morning'), t('candidateForm.shifts.day'), t('candidateForm.shifts.night'), t('candidateForm.shifts.flexible')].map((shiftOption) => (
                <label key={shiftOption} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="shift"
                    value={shiftOption}
                    checked={formData.shift === shiftOption}
                    onChange={handleInputChange}
                    required
                    className="form-radio h-4 w-4 text-pink-600 bg-[#3d3d3d] border-[#555] focus:ring-pink-500"
                  />
                  <span className="text-gray-300">{shiftOption}</span>
                </label>
              ))}
            </div>
            {errors.shift && <p className="mt-1 text-sm text-red-500">{errors.shift}</p>}
          </div>

          <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t('candidateForm.fields.experience')} <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-3">
                  {[t('candidateForm.experienceLevels.none'), t('candidateForm.experienceLevels.lessThanYear'), t('candidateForm.experienceLevels.oneToThreeYears'), t('candidateForm.experienceLevels.moreThanThreeYears')].map((expOption) => (
                      <label key={expOption} className="flex items-center space-x-2 cursor-pointer">
                          <input
                              type="radio"
                              name="experience"
                              value={expOption}
                              checked={formData.experience === expOption}
                              onChange={handleInputChange}
                              required
                              className="form-radio h-4 w-4 text-pink-600 bg-[#3d3d3d] border-[#555] focus:ring-pink-500"
                          />
                          <span className="text-gray-300">{expOption}</span>
                      </label>
                  ))}
              </div>
              {errors.experience && <p className="mt-1 text-sm text-red-500">{errors.experience}</p>}
          </div>

          <TextInput
            label={t('candidateForm.fields.motivation')}
            name="motivation"
            type="textarea"
            value={formData.motivation}
            onChange={handleInputChange}
            required
            error={errors.motivation}
          />

          <TextInput
            label={t('candidateForm.fields.aboutMe')}
            name="about_me"
            type="textarea"
            value={formData.about_me}
            onChange={handleInputChange}
            required
            error={errors.about_me}
          />

          <div className="mt-8">
            <Button type="submit" disabled={isSubmitting} block>
              {isSubmitting ? (
                <Loader size="small" />
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {t('candidateForm.submitButton')} <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default CandidateForm; 