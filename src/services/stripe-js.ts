import { loadStripe } from "@stripe/stripe-js";

export async function getStripeJs() {
    //chave publica do stripe
    const stripeJs =  await loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY)

    return stripeJs;
}