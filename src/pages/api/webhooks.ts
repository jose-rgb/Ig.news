import { NextApiRequest, NextApiResponse } from "next";
import { Readable } from 'stream';
import Stripe from "stripe";
import { stripe } from "../../services/stripe";
import { saveSubscription } from "./_lib/manageSubscription";

//function para ler a req(webhook do stripe)
async function buffer(readable: Readable) {
    const chunks = [];

    for await (const chunk of readable) {
        chunks.push(
            typeof chunk === "string" ? Buffer.from(chunk) : chunk
        );
    }

    return Buffer.concat(chunks);
}

//configuração para habilitar a forma de req stream no next
export const config = {
    api: {
        bodyParser: false
    }
}

//eventos relevantes do stripe 
const relevantEvents = new Set([
    //compra finalizada
    'checkout.session.completed',
    //user atualizado
    'customer.subscription.updated',
    //user deletado
    'customer.subscription.deleted'
])

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === 'POST') {
        const buf = await buffer(req)
        //validando se a req vem do stripe com a chave secret
        const secret = req.headers['stripe-signature']

        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(buf, secret, process.env.STRIPE_WEBHOOK_SECRET);
        } catch (err){
            return res.status(400).send(`Webhook error: ${err.message}`)
        }

        //evento vindo do webhook do stripe
        const { type } = event;

        //se o event  for relevante 
        if(relevantEvents.has(type)) {
            try {
                //para cada tipo de evento
                switch (type)  {
                    case 'customer.subscription.updated':
                    case 'customer.subscription.deleted':

                        //tipando a subscription
                        const subscription  = event.data.object as Stripe.Subscription;

                        await saveSubscription(
                            subscription.id,
                            subscription.customer.toString(),
                            //n ta criando uma nova subscription, apenas atualizando
                            false
                        );


                        break;
                    case 'checkout.session.completed':

                        //tipando a session para ter a certeza do tipo de evento 
                        const checkoutSession = event.data.object as Stripe.Checkout.Session

                        //salvar a inscrição 
                        await saveSubscription(
                            checkoutSession.subscription.toString(),
                            checkoutSession.customer.toString(),
                            //criando uma nova subscription
                            true
                        )

                        break;
                    default: 
                        throw new Error('Unhandled event.')
                }
            } catch (err) {
                //evento que n ta sendo interpretado corretamente
                return res.json({ error: 'Webhook handler failed'})
            }
        }

        
        res.status(200).json({received: true})
    } else {
        res.setHeader('Allow', 'POST')
        res.status(405).end('Method not allowed')
    }
}