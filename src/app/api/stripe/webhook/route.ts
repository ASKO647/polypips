import { NextResponse } from "next/server";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPlanId, planForPriceId, type PlanId } from "@/lib/stripe/plans";

type DbStatus = "trialing" | "active" | "canceled" | "past_due";

/** Maps every Stripe subscription status onto the 4 we persist. Returns
 * null for the couple of statuses that don't correspond to a meaningful
 * access state yet (e.g. `incomplete`, before the first payment attempt
 * resolves) — callers should skip the write in that case. */
function mapStatus(status: Stripe.Subscription.Status): DbStatus | null {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
    case "paused":
      return "canceled";
    case "incomplete":
      return null;
    default:
      return null;
  }
}

function resolvePlan(subscription: Stripe.Subscription): PlanId {
  const metaPlan = subscription.metadata?.plan;
  if (metaPlan && isPlanId(metaPlan)) return metaPlan;
  const priceId = subscription.items.data[0]?.price?.id;
  return (priceId && planForPriceId(priceId)) || "pro";
}

function periodEndIso(subscription: Stripe.Subscription): string | null {
  const seconds = subscription.items.data[0]?.current_period_end;
  return typeof seconds === "number" ? new Date(seconds * 1000).toISOString() : null;
}

async function upsertSubscription(
  supabase: SupabaseClient,
  userId: string,
  customerId: string,
  subscription: Stripe.Subscription,
  justConverted = false
) {
  const status = mapStatus(subscription.status);
  if (!status) return;

  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      plan: resolvePlan(subscription),
      status,
      current_period_end: periodEndIso(subscription),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
      // Omitted (not overwritten) on every non-conversion update, same as
      // created_at above it — only the exact event that flips a Découverte
      // trial into a real Pro charge should ever set these.
      ...(justConverted
        ? { converted_from_trial: true, converted_at: new Date().toISOString() }
        : {}),
    },
    { onConflict: "user_id" }
  );
  if (error) {
    console.error("[stripe/webhook] upsert failed", error);
  }
}

async function handleCheckoutCompleted(
  stripe: Stripe,
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session
) {
  const userId = session.client_reference_id;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;
  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id;

  if (!userId || !subscriptionId || !customerId) {
    console.error("[stripe/webhook] checkout.session.completed missing ids", {
      hasUserId: !!userId,
      hasSubscriptionId: !!subscriptionId,
      hasCustomerId: !!customerId,
    });
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await upsertSubscription(supabase, userId, customerId, subscription);
}

async function handleSubscriptionUpdated(
  stripe: Stripe,
  supabase: SupabaseClient,
  subscription: Stripe.Subscription,
  previousStatus: Stripe.Subscription.Status | undefined
) {
  const userId = subscription.metadata?.supabase_user_id;
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  if (!userId) {
    console.error(
      "[stripe/webhook] subscription.updated missing supabase_user_id metadata",
      subscription.id
    );
    return;
  }

  let effective = subscription;
  const justConvertedFromTrial =
    previousStatus === "trialing" && subscription.status === "active";
  const isConversion = justConvertedFromTrial && subscription.metadata?.plan === "decouverte";
  if (isConversion) {
    // The 3-day discovery trial just converted to a full-price charge on
    // the exact same Pro price — from here on it IS the Pro plan, so
    // persist that transition on the Stripe object itself rather than
    // re-deriving this special case on every future event.
    effective = await stripe.subscriptions.update(subscription.id, {
      metadata: { ...subscription.metadata, plan: "pro" },
    });
  }

  await upsertSubscription(supabase, userId, customerId, effective, isConversion);
}

async function handleSubscriptionDeleted(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription
) {
  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);
  if (error) {
    console.error("[stripe/webhook] subscription.deleted update failed", error);
  }
}

async function handlePaymentFailed(supabase: SupabaseClient, invoice: Stripe.Invoice) {
  const subscriptionRef =
    invoice.parent?.type === "subscription_details"
      ? invoice.parent.subscription_details?.subscription
      : null;
  const subscriptionId =
    typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id;
  if (!subscriptionId) return; // one-off invoice, not tied to a subscription

  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscriptionId);
  if (error) {
    console.error("[stripe/webhook] invoice.payment_failed update failed", error);
  }
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  const stripe = getStripe();
  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("[stripe/webhook] signature verification failed", error);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(stripe, supabase, event.data.object);
        break;
      case "customer.subscription.updated": {
        const previousStatus = (
          event.data.previous_attributes as
            | Partial<Stripe.Subscription>
            | undefined
        )?.status;
        await handleSubscriptionUpdated(
          stripe,
          supabase,
          event.data.object,
          previousStatus
        );
        break;
      }
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(supabase, event.data.object);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(supabase, event.data.object);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error(`[stripe/webhook] failed to handle ${event.type}`, error);
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
