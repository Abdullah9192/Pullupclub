import { loadStripe } from '@stripe/stripe-js';
import { products } from '../stripe-config';
import { createClient } from '@supabase/supabase-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export async function createCheckoutSession(
  subscriptionType: 'monthly' | 'annual' = 'monthly',
  email: string,
  formData?: any
) {
  try {
    // Store email in localStorage for retrieval after checkout completion
    localStorage.setItem('checkoutEmail', email);
    
    const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = import.meta.env;
    const product = subscriptionType === 'monthly' ? products.pullUpClub : products.pullUpClubAnnual;

    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();

    // Make request to Supabase function
    const response = await fetch(`${VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        price_id: product.priceId,
        mode: product.mode,
        success_url: `${window.location.origin}/success`,
        cancel_url: `${window.location.origin}/submit`,
        email,
        formData,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create checkout session');
    }

    const { url } = await response.json();
    return url;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export async function getActiveSubscription() {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return null;
    }

    // Query the stripe_user_subscriptions view which joins stripe_customers with stripe_subscriptions
    const { data, error } = await supabase
      .from('stripe_user_subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    return null;
  }
}

export async function createPaymentIntent() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create payment intent');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}