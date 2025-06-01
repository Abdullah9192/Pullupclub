import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

console.log('Initializing stripe-checkout function');

// Initialize Supabase and Stripe clients
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

// Helper to return a response with CORS headers
function corsResponse(body: object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  return new Response(
    body ? JSON.stringify(body) : null,
    { status, headers }
  );
}

// Main handler
Deno.serve(async (req) => {
  console.log('Received request:', req.method);
  
  try {
    if (req.method === 'OPTIONS') {
      console.log('Handling OPTIONS request');
      return corsResponse(null, 204);
    }
    
    if (req.method !== 'POST') {
      console.log('Invalid method:', req.method);
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    const requestBody = await req.json();
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const { price_id, success_url, cancel_url, mode, email, formData } = requestBody;

    if (!price_id || !success_url || !cancel_url || !mode) {
      console.log('Missing required parameters:', { price_id, success_url, cancel_url, mode });
      return corsResponse({ error: 'Missing required parameters' }, 400);
    }

    if (!['payment', 'subscription'].includes(mode)) {
      console.log('Invalid mode:', mode);
      return corsResponse({ error: 'Invalid mode. Must be "payment" or "subscription"' }, 400);
    }

    let userId: string | null = null;
    let userEmail = email || '';
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);

    // Attempt to get user from Bearer token
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const isAnonKey = token === Deno.env.get('SUPABASE_ANON_KEY');
      console.log('Token is anon key:', isAnonKey);

      if (token.length > 20 && !isAnonKey) {
        console.log('Attempting to get user from token');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (user) {
          userId = user.id;
          userEmail = user.email || userEmail;
          console.log('Found authenticated user:', { userId, userEmail });
        } else {
          console.warn('Auth error (ignored):', authError?.message || authError);
        }
      } else {
        console.log('Skipping getUser — anon or invalid token');
      }
    }

    // If no user and email is provided, create guest user
    if (!userId && email) {
      console.log('Creating guest user for email:', email);
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
      });

      if (error || !data?.user) {
        console.error('Failed to create guest user:', error);
        return corsResponse({ error: 'Failed to create Supabase user for guest' }, 400);
      }

      userId = data.user.id;
      console.log('Created guest user:', userId);
    }

    if (!userEmail) {
      console.log('No email provided for checkout');
      return corsResponse({ error: 'Email is required for guest checkout' }, 400);
    }

    console.log('Creating Stripe checkout session with params:', {
      userEmail,
      mode,
      price_id,
      userId,
    });

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode,
      success_url: `${success_url}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url,
      client_reference_id: userId ?? undefined,
      metadata: {
        user_id: userId ?? 'guest',
        is_guest: userId ? 'false' : 'true',
        ...formData && { form_data: JSON.stringify(formData) },
      },
    });

    console.log('Created checkout session:', {
      sessionId: session.id,
      url: session.url,
    });

    return corsResponse({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return corsResponse({
      error: error instanceof Error ? error.message : 'Unexpected server error',
    }, 500);
  }
});