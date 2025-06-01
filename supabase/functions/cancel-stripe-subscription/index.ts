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
    const { userId } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get the customer ID from stripe_customers table
    const { data: customerData, error: customerError } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', userId)
      .single();

    if (customerError || !customerData) {
      throw new Error('Customer not found');
    }

    // Get active subscriptions for the customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerData.customer_id,
      status: 'active',
    });

    // Cancel all active subscriptions
    for (const subscription of subscriptions.data) {
      await stripe.subscriptions.cancel(subscription.id);
    }

    // Soft delete the customer record
    const { error: updateError } = await supabase
      .from('stripe_customers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (updateError) {
      throw new Error('Failed to update customer record');
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});