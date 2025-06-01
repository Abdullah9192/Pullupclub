import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Extract the token
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if customer already exists
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    let customerId: string;

    if (existingCustomer?.customer_id) {
      customerId = existingCustomer.customer_id;
    } else {
      // Create new Stripe customer
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      });

      // Store customer mapping
      await supabase
        .from('stripe_customers')
        .insert({
          user_id: user.id,
          customer_id: newCustomer.id,
        });

      customerId = newCustomer.id;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // $10.00
      currency: 'usd',
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        user_id: user.id,
      },
    });

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unexpected error occurred' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});