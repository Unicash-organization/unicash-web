'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import StripeCheckoutForm from '@/components/StripeCheckoutForm';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('planId');
  const packId = searchParams.get('packId');
  const boostPackId = searchParams.get('boostPackId'); // New parameter for Case 3
  const drawId = searchParams.get('drawId');
  const isUpgradeParam = searchParams.get('upgrade') === 'true'; // Upgrade parameter
  const { user, loading: authLoading } = useAuth();
  
  const [step, setStep] = useState<'info' | 'pay'>('info');
  const [selectedPack, setSelectedPack] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [boostPacks, setBoostPacks] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [userMembership, setUserMembership] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [promoCode, setPromoCode] = useState('');
  const [promoCodeValidating, setPromoCodeValidating] = useState(false);
  const [promoCodeValid, setPromoCodeValid] = useState<{ valid: boolean; promoCode?: any; error?: string; discount?: number } | null>(null);

  // Determine checkout scenario
  const isNewUser = !user;
  const hasActiveMembership = userMembership?.status === 'active' && 
    userMembership?.currentPeriodEnd && 
    new Date(userMembership.currentPeriodEnd) > new Date();
  const hasExpiredMembership = userMembership && 
    (!userMembership?.currentPeriodEnd || new Date(userMembership.currentPeriodEnd) <= new Date());
  // Handle "boost" placeholder - treat as wants boost pack but no specific pack selected
  // Case 3: boostPackId means non-member wants to buy boost pack (requires membership)
  const effectivePackId = boostPackId || packId;
  const wantsOnlyBoost = effectivePackId && !planId && effectivePackId !== 'boost';
  const wantsBoostPack = effectivePackId === 'boost' || (hasActiveMembership && !planId && !effectivePackId);
  const wantsOnlyMembership = planId && !packId;
  const wantsCombo = (planId && packId) || (selectedPlan && selectedPack);

  // Case 1 & 3: New user or existing user without membership trying to buy boost
  // If boostPackId is present, it means non-member wants to buy boost pack (requires membership)
  const requiresMembership = (isNewUser || !hasActiveMembership) && (wantsOnlyBoost || !!boostPackId);

  // Case 4: Active member buying boost only - skip plan selection
  const skipPlanSelection = hasActiveMembership && wantsOnlyBoost && !planId;

  // Case 5: Expired membership - pre-select old plan
  const shouldPreSelectOldPlan = hasExpiredMembership && !planId;

  // Case 8: Returning user with active membership - auto-load plan
  const shouldAutoLoadPlan = hasActiveMembership && !wantsOnlyBoost;

  useEffect(() => {
    // Store drawId in sessionStorage if provided
    if (drawId && typeof window !== 'undefined') {
      sessionStorage.setItem('redirectDrawId', drawId);
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [boostPacksRes, plansRes, membershipRes] = await Promise.all([
          api.membership.getBoostPacks(),
          api.membership.getPlans(),
          user ? api.membership.getUserMembership().catch(() => ({ data: null })) : Promise.resolve({ data: null }),
        ]);
        
        setBoostPacks(boostPacksRes.data || []);
        setPlans(plansRes.data || []);
        setUserMembership(membershipRes.data);

        // Case 8: Auto-load current plan for active members
        if (shouldAutoLoadPlan && membershipRes.data?.plan) {
          const currentPlan = plansRes.data?.find((p: any) => p.id === membershipRes.data.plan.id);
          if (currentPlan) {
            setSelectedPlan(currentPlan);
          }
        }
        // Case 5: Pre-select old plan for expired membership
        else if (shouldPreSelectOldPlan && membershipRes.data?.plan) {
          const oldPlan = plansRes.data?.find((p: any) => p.id === membershipRes.data.plan.id);
          if (oldPlan) {
            setSelectedPlan(oldPlan);
          }
        }
        // Set from URL params
        else {
          if (planId && plansRes.data) {
            const plan = plansRes.data.find((p: any) => p.id === planId);
            if (plan) setSelectedPlan(plan);
          } else if (drawId && plansRes.data?.length > 0) {
            // Case 2: Coming from draw entry - pre-select recommended plan (UNI_PLUS or first available)
            const recommendedPlan = plansRes.data.find((p: any) => p.tier === 'uni_plus') || 
                                   plansRes.data.find((p: any) => p.tier === 'premium') || 
                                   plansRes.data[0];
            if (recommendedPlan) setSelectedPlan(recommendedPlan);
          } else if (!user && plansRes.data?.length > 0) {
            // Case 2: New user - default to first plan
            const premiumPlan = plansRes.data.find((p: any) => p.tier === 'premium') || plansRes.data[0];
            if (premiumPlan) setSelectedPlan(premiumPlan);
          }

          // Handle both packId and boostPackId
          const effectivePackId = boostPackId || packId;
          if (effectivePackId && boostPacksRes.data) {
            // Only set selectedPack if packId is a valid UUID (not "boost" placeholder)
            if (effectivePackId !== 'boost') {
              const pack = boostPacksRes.data.find((p: any) => p.id === effectivePackId);
              if (pack) setSelectedPack(pack);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, planId, packId, boostPackId, drawId, shouldAutoLoadPlan, shouldPreSelectOldPlan]);

  // Auto-fill form if user is logged in
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        setFormData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: (user as any).phone || '',
        });
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
        });
      }
    }
  }, [user, authLoading]);

  // Calculate original total amount (for promo code validation)
  const originalTotalAmount = selectedPlan 
    ? parseFloat(selectedPlan.priceMonthly.toString()) + (selectedPack ? parseFloat(selectedPack.price.toString()) : 0)
    : (selectedPack ? parseFloat(selectedPack.price.toString()) : 0);

  // Re-validate promo code when plan/pack changes
  useEffect(() => {
    if (promoCodeValid?.valid && promoCode && originalTotalAmount > 0) {
      // Re-validate with new total amount
      api.promoCodes.validate(promoCode.trim(), originalTotalAmount)
        .then((response) => {
          if (response.data.valid) {
            setPromoCodeValid(response.data);
          } else {
            // If validation fails with new amount, clear promo code
            setPromoCodeValid(null);
            setPromoCode('');
          }
        })
        .catch(() => {
          // On error, clear promo code
          setPromoCodeValid(null);
          setPromoCode('');
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlan?.id, selectedPack?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateInfo = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Case 1 & 3: Require membership if trying to buy boost without membership
    if (requiresMembership && !selectedPlan) {
      newErrors.membership = 'Membership is required to purchase Boost Packs';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinueToPayment = async () => {
    if (!validateInfo()) return;

    // Case 1 & 3: Must select membership if buying boost
    if (requiresMembership && !selectedPlan) {
      setErrors({ membership: 'Please select a membership plan to continue' });
      return;
    }

    // Case 4: Active member buying boost only - no plan needed
    if (skipPlanSelection && !selectedPack) {
      alert('Please select a boost pack');
      return;
    }

    // Must have at least plan or pack
    if (!selectedPlan && !selectedPack) {
      alert('Please select a membership plan or boost pack');
      return;
    }

    setPaymentError(null);
    setLoading(true);

    try {
      let response;
      if (selectedPlan) {
        // Create membership payment intent (includes upgrade if different plan)
        response = await api.payments.createMembershipPaymentIntent({
          planId: selectedPlan.id,
          boostPackId: selectedPack?.id || undefined,
          customerEmail: formData.email,
          customerName: `${formData.firstName} ${formData.lastName}`.trim(),
          customerPhone: formData.phone || undefined,
          promoCode: promoCodeValid?.valid ? promoCode.trim() : undefined,
        });
      } else if (selectedPack) {
        // Create boost pack payment intent (Case 4: active member buying boost only)
        response = await api.payments.createBoostPackPaymentIntent({
          boostPackId: selectedPack.id,
          customerEmail: formData.email,
          customerName: `${formData.firstName} ${formData.lastName}`.trim(),
          customerPhone: formData.phone || undefined,
          promoCode: promoCodeValid?.valid ? promoCode.trim() : undefined,
        });
      }

      if (response?.data?.clientSecret) {
        setClientSecret(response.data.clientSecret);
        setPaymentId(response.data.paymentId);
        setStep('pay');
      } else {
        setPaymentError('Failed to initialize payment. Please try again.');
      }
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      setPaymentError(error?.response?.data?.message || 'Failed to initialize payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate discount amount if promo code is valid
  const discountAmount = promoCodeValid?.valid && promoCodeValid.discount 
    ? promoCodeValid.discount 
    : 0;

  // Calculate final total amount after discount
  const totalAmount = Math.max(0, originalTotalAmount - discountAmount);

  if (loading && !clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if this is an upgrade: either from URL parameter or if user has different plan
  const isUpgradeFromPlan = hasActiveMembership && selectedPlan && userMembership?.plan?.id !== selectedPlan.id;
  const isUpgrade = isUpgradeParam || isUpgradeFromPlan;

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <div className="flex-1 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column - Checkout Form */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h1 className="text-3xl font-bold mb-6">Checkout</h1>
              
              {/* Step Indicator */}
              <div className="flex items-center mb-8">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    step === 'info' ? 'bg-purple-600 text-white' : 'bg-green-500 text-white'
                  }`}>
                    {step === 'pay' ? '✓' : '1'}
                  </div>
                  <span className="ml-2 font-semibold">Step 1: Info</span>
                </div>
                <div className="flex-1 h-1 bg-gray-200 mx-4">
                  <div className={`h-full ${step === 'pay' ? 'bg-purple-600' : 'bg-gray-200'} transition-all`} />
                </div>
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    step === 'pay' ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    2
                  </div>
                  <span className="ml-2 font-semibold">Step 2: Pay</span>
                </div>
              </div>

              {step === 'info' && (
                <div>
                  {/* Case 2: Coming from Draw Entry - Show message */}
                  {drawId && (
                    <div className="mb-6 p-4 bg-purple-50 border-2 border-purple-400 rounded-lg">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-bold text-purple-800">Complete Your Membership to Enter</h3>
                          <p className="mt-1 text-sm text-purple-700">
                            You're joining UNICASH to enter an exclusive draw. After completing your membership, you'll be redirected back to the draw page.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Case 1 & 3: Membership Required Banner */}
                  {requiresMembership && !drawId && (
                    <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-bold text-yellow-800">Membership Required</h3>
                          <p className="mt-1 text-sm text-yellow-700">
                            {boostPackId 
                              ? "You need to be a UNICASH member to purchase Boost Packs. Please select a membership plan below to continue."
                              : "You need an active membership to purchase Boost Packs. Please select a membership plan below."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {user && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        ✓ Logged in as <strong>{user.email}</strong>. Your information has been pre-filled.
                      </p>
                    </div>
                  )}

                  {/* Case 6: Upgrade Notice */}
                  {isUpgrade && (
                    <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-sm text-purple-700">
                        <strong>Upgrading membership:</strong> You're upgrading from {userMembership?.plan?.name} to {selectedPlan?.name}. 
                        Stripe will handle prorating and charge the difference.
                      </p>
                    </div>
                  )}

                  {/* Case 5: Renewal Notice */}
                  {shouldPreSelectOldPlan && (
                    <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-700">
                        <strong>Renewing membership:</strong> Your previous plan ({userMembership?.plan?.name}) has been pre-selected. 
                        You can change it if you want a different plan.
                      </p>
                    </div>
                  )}
                  
                  {/* Personal Information Section */}
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
                    
                    {/* First Name and Last Name */}
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          placeholder="Enter your first name here..."
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                            errors.firstName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'
                          }`}
                        />
                        {errors.firstName && (
                          <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          placeholder="Enter your last name here..."
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                            errors.lastName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'
                          }`}
                        />
                        {errors.lastName && (
                          <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email here..."
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                          errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'
                        }`}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+61 4xx xxx xxx"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Promo Code */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Promo Code (Optional)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promoCode}
                          onChange={(e) => {
                            setPromoCode(e.target.value.toUpperCase());
                            setPromoCodeValid(null);
                          }}
                          placeholder="Enter promo code"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (!promoCode.trim()) return;
                            setPromoCodeValidating(true);
                            try {
                              const response = await api.promoCodes.validate(promoCode.trim(), originalTotalAmount);
                              setPromoCodeValid(response.data);
                            } catch (error: any) {
                              setPromoCodeValid({
                                valid: false,
                                error: error?.response?.data?.error || 'Failed to validate promo code',
                              });
                            } finally {
                              setPromoCodeValidating(false);
                            }
                          }}
                          disabled={promoCodeValidating || !promoCode.trim()}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {promoCodeValidating ? 'Validating...' : 'Apply'}
                        </button>
                      </div>
                      {promoCodeValid && (
                        <div className={`mt-2 p-3 rounded-lg ${
                          promoCodeValid.valid 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-red-50 border border-red-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <p className={`text-sm ${
                              promoCodeValid.valid ? 'text-green-800' : 'text-red-800'
                            }`}>
                              {promoCodeValid.valid 
                                ? `✓ Valid! Discount: $${promoCodeValid.discount?.toFixed(2) || '0.00'}`
                                : promoCodeValid.error || 'Invalid promo code'
                              }
                            </p>
                            {promoCodeValid.valid && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPromoCode('');
                                  setPromoCodeValid(null);
                                }}
                                className="ml-2 text-sm text-red-600 hover:text-red-800 underline"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {errors.membership && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">{errors.membership}</p>
                    </div>
                  )}

                  {paymentError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                      {paymentError}
                    </div>
                  )}

                  <button
                    onClick={handleContinueToPayment}
                    disabled={loading || (requiresMembership && !selectedPlan)}
                    className="w-full bg-purple-600 text-white font-bold py-4 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : 'Continue to Payment →'}
                  </button>
                  {requiresMembership && !selectedPlan && (
                    <p className="text-sm text-red-600 mt-2 text-center">
                      Please select a membership plan to continue
                    </p>
                  )}
                </div>
              )}

              {step === 'pay' && clientSecret && paymentId && (
                <div>
                  <StripeCheckoutForm
                    key={user?.id || 'guest'}
                    clientSecret={clientSecret}
                    paymentId={paymentId}
                    amount={totalAmount}
                    currency="USD"
                    buttonText={selectedPlan ? 'Pay and Start Membership' : 'Complete Payment'}
                  />

                  <button
                    onClick={() => {
                      setStep('info');
                      setClientSecret(null);
                      setPaymentId(null);
                    }}
                    className="w-full bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg hover:bg-gray-300 transition mt-4"
                  >
                    ← Back to Info
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-8 sticky top-24">
              <h2 className="text-2xl font-bold mb-6">Order summary</h2>

              {/* Scenario 1: Buying Boost Pack (wantsOnlyBoost) - Show Boost Pack first, then Membership */}
              {wantsOnlyBoost && (
                <>
                  {/* Always show current membership if exists (for user awareness) */}
                  {userMembership?.plan && hasActiveMembership && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="font-bold mb-2">Current Membership</h3>
                      <p className="text-sm text-gray-700 font-semibold">{userMembership.plan.name}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Includes: {userMembership.plan.grandPrizeEntriesPerPeriod || 0}x Grand Draw entries
                        {userMembership.plan.freeCreditsPerPeriod > 0 && ` + ${userMembership.plan.freeCreditsPerPeriod} monthly credits`}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Active until {new Date(userMembership.currentPeriodEnd).toLocaleDateString()}</p>
                    </div>
                  )}

                  {/* Boost Pack Selection - Show if user has active membership OR if no pack selected yet */}
                  {(hasActiveMembership || !selectedPack) && (
                    <div className="mb-6">
                      <h3 className="font-bold mb-3">Select Boost Pack</h3>
                      <p className="text-sm text-gray-500 mb-4">One-off only · Credits never expire</p>
                      <div className="space-y-3">
                        {boostPacks
                          .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
                          .map((pack: any) => (
                            <div
                              key={pack.id}
                              onClick={() => setSelectedPack(selectedPack?.id === pack.id ? null : pack)}
                              className={`p-4 border-2 rounded-lg cursor-pointer transition relative ${
                                selectedPack?.id === pack.id
                                  ? 'border-purple-500 bg-purple-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {(pack.badgeText || pack.featuresConfig?.badge?.text) && (
                                <div className="absolute -top-2 -right-2">
                                  <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full">
                                    {pack.badgeText || pack.featuresConfig?.badge?.text}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-bold">{pack.name}</p>
                                  <p className="text-sm text-gray-600">{pack.credits} Credits</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-purple-600">${parseFloat(pack.price?.toString() || '0').toFixed(2)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Selected Boost Pack Display */}
                  {selectedPack && (
                    <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-lg">{selectedPack.name}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            You'll receive <strong>{selectedPack.credits} Credits</strong> with this Boost Pack.
                          </p>
                        </div>
                        <p className="text-xl font-bold text-purple-600">${parseFloat(selectedPack.price?.toString() || '0').toFixed(2)}</p>
                      </div>
                    </div>
                  )}

                  {/* Membership Selection (Required if no active membership) */}
                  {requiresMembership && plans.length > 0 && (
                    <div className="mb-6">
                      <p className="text-sm text-gray-700 mb-3">
                        Choose a membership to unlock your Boost Credits and enter Major Rewards.
                      </p>
                      <div className="space-y-3">
                        {plans.map((plan: any) => (
                          <div
                            key={plan.id}
                            onClick={() => setSelectedPlan(plan)}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                              selectedPlan?.id === plan.id
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-bold">{plan.name}</p>
                                <p className="text-sm text-gray-600">
                                  {plan.grandPrizeEntriesPerPeriod || 0} Major Reward {plan.grandPrizeEntriesPerPeriod === 1 ? 'entry' : 'entries'} each month
                                  {plan.freeCreditsPerPeriod > 0 && ` + ${plan.freeCreditsPerPeriod} monthly credits`}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-purple-600">${plan.priceMonthly} /month</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Scenario 2: Buying Membership (wantsOnlyMembership or selectedPlan) - Show Membership first, then Boost Packs */}
              {!wantsOnlyBoost && selectedPlan && (
                <>
                  {/* Selected Membership */}
                  <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-lg">{selectedPlan.name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Includes: {selectedPlan.grandPrizeEntriesPerPeriod || 0}x Grand Draw entries
                          {selectedPlan.freeCreditsPerPeriod > 0 && ` + ${selectedPlan.freeCreditsPerPeriod} monthly credits`}
                        </p>
                      </div>
                      <p className="text-xl font-bold text-purple-600">${selectedPlan.priceMonthly}/mo</p>
                    </div>
                  </div>

                  {/* Boost Packs Selection (Optional) */}
                  <div className="mb-6">
                    <h3 className="font-bold mb-3">Boost your chance (Optional)</h3>
                    <p className="text-sm text-gray-500 mb-4">One-off only · Credits never expire</p>

                    <div className="space-y-3">
                      {boostPacks
                        .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
                        .map((pack: any) => (
                        <div
                          key={pack.id}
                          onClick={() => setSelectedPack(selectedPack?.id === pack.id ? null : pack)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition relative ${
                            selectedPack?.id === pack.id
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {(pack.badgeText || pack.featuresConfig?.badge?.text) && (
                            <div className="absolute -top-2 -right-2">
                              <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full">
                                {pack.badgeText || pack.featuresConfig?.badge?.text}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold">{pack.name}</p>
                              <p className="text-sm text-gray-600">{pack.credits} Credits</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-purple-600">${parseFloat(pack.price?.toString() || '0').toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Fallback: Show both if neither scenario matches, or user with active membership wants boost pack */}
              {((!wantsOnlyBoost && !selectedPlan) || (wantsBoostPack && hasActiveMembership)) && (
                <>
                  {/* Show Current Membership if exists */}
                  {userMembership?.plan && hasActiveMembership && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="font-bold mb-2">Current Membership</h3>
                      <p className="text-sm text-gray-700 font-semibold">{userMembership.plan.name}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Includes: {userMembership.plan.grandPrizeEntriesPerPeriod || 0}x Grand Draw entries
                        {userMembership.plan.freeCreditsPerPeriod > 0 && ` + ${userMembership.plan.freeCreditsPerPeriod} monthly credits`}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Active until {new Date(userMembership.currentPeriodEnd).toLocaleDateString()}</p>
                    </div>
                  )}

                  {/* Membership Plan Selection - Only show if user doesn't have active membership */}
                  {!hasActiveMembership && !skipPlanSelection && plans.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-bold mb-3">Membership Plan</h3>
                      <div className="space-y-3">
                        {plans.map((plan: any) => (
                          <div
                            key={plan.id}
                            onClick={() => setSelectedPlan(plan)}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                              selectedPlan?.id === plan.id
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-bold">{plan.name}</p>
                                <p className="text-sm text-gray-600">
                                  {plan.grandPrizeEntriesPerPeriod || 0} Major Reward {plan.grandPrizeEntriesPerPeriod === 1 ? 'entry' : 'entries'} each month
                                  {plan.freeCreditsPerPeriod > 0 && ` + ${plan.freeCreditsPerPeriod} monthly credits`}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-purple-600">${plan.priceMonthly} /month</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Boost Packs Selection - Always show if user has active membership, or if no plan selected */}
                  {(hasActiveMembership || !selectedPlan) && (
                    <div className="mb-6">
                      <h3 className="font-bold mb-3">
                        {hasActiveMembership ? 'Select Boost Pack' : 'Boost your chance (Optional)'}
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">One-off only · Credits never expire</p>

                      <div className="space-y-3">
                        {boostPacks
                          .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
                          .map((pack: any) => (
                          <div
                            key={pack.id}
                            onClick={() => setSelectedPack(selectedPack?.id === pack.id ? null : pack)}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition relative ${
                              selectedPack?.id === pack.id
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {(pack.badgeText || pack.featuresConfig?.badge?.text) && (
                              <div className="absolute -top-2 -right-2">
                                <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full">
                                  {pack.badgeText || pack.featuresConfig?.badge?.text}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-bold">{pack.name}</p>
                                <p className="text-sm text-gray-600">{pack.credits} Credits</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-purple-600">${parseFloat(pack.price?.toString() || '0').toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Summary */}
              <div className="border-t border-gray-200 pt-6 mb-6 space-y-3">
                {selectedPlan && (
                  <div className="flex justify-between">
                    <p className="font-semibold">Membership</p>
                    <p className={`font-bold ${discountAmount > 0 ? 'line-through text-gray-400' : ''}`}>
                      ${selectedPlan.priceMonthly}
                    </p>
                  </div>
                )}
                {selectedPack && (
                  <div className="flex justify-between">
                    <p className="font-semibold">Boost Pack <span className="text-gray-500 text-sm">(one-off)</span></p>
                    <p className={`font-bold ${discountAmount > 0 ? 'line-through text-gray-400' : ''}`}>
                      ${parseFloat(selectedPack.price?.toString() || '0').toFixed(2)}
                    </p>
                  </div>
                )}
                {!selectedPlan && !selectedPack && (
                  <p className="text-sm text-gray-500 text-center py-4">Select a membership or boost pack</p>
                )}
                
                {/* Promo Code Discount */}
                {promoCodeValid?.valid && discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <p className="font-semibold">Promo Code ({promoCode})</p>
                    <p className="font-bold">-${discountAmount.toFixed(2)}</p>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="border-t-2 border-gray-300 pt-6">
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-600">Subtotal</p>
                    <p className="text-sm text-gray-400 line-through">
                      ${originalTotalAmount.toFixed(2)}
                    </p>
                  </div>
                )}
                <div className="flex justify-between items-center mb-4">
                  <p className="text-lg font-bold">Total due today</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ${totalAmount.toFixed(2)}
                  </p>
                </div>
                {selectedPlan && (
                  <div className="space-y-2 text-xs text-gray-600">
                    <p>Next charge: ${selectedPlan.priceMonthly} in 1 month for your membership renewal only.</p>
                    {selectedPack && (
                      <p>Boost Pack is a one-off top-up - it won't renew or charge again.</p>
                    )}
                    <p>Cancel your membership anytime from your account.</p>
                  </div>
                )}
                {!selectedPlan && selectedPack && (
                  <p className="text-xs text-gray-600">
                    One-time payment for Boost Pack only
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-4">
                  By completing the purchase, you agree to our{' '}
                  <Link href="/terms" className="text-purple-600 hover:underline">Terms of Service</Link>
                  , including auto-renewal terms, and acknowledge our{' '}
                  <Link href="/privacy" className="text-purple-600 hover:underline">Privacy Policy</Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
