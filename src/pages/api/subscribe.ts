import { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "../../services/stripe";
import { getSession } from "next-auth/react";
import { fauna } from "../../services/fauna";
import { query as q } from "faunadb";

type User =  {
    ref: {
        id: string;
    }
    data: {
        stripe_customer_id: string
    }
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
    // verificando o metodo da req
    if(req.method === 'POST') {
        //buscando user pelos cookies
        const session = await getSession({req})
        

        //buscar user por email
        const user = await fauna.query<User>(
            q.Get(
                q.Match(
                    q.Index('user_by_email'),
                    q.Casefold(session.user.email)
                )
            )
        )

        //verificar se user ja existe
        let customerId = user.data.stripe_customer_id

        //se user no bd ainda n tem stripe_customer_id
        if (!customerId) {
            //cadastrar user no stripe 
            const stripeCustomer = await stripe.customers.create({
                email: session.user.email
            })

            //salvar user no fauna ao ser criado
            await fauna.query(
                q.Update(
                    q.Ref(q.Collection('users'), user.ref.id),
                    //dados a atualizar
                    {
                        data: {
                            stripe_customer_id: stripeCustomer.id,
                        }
                    }
                )
            )

            customerId = stripeCustomer.id
        }

        

        //criar uma sessao no stripe
        const stripeCheckoutSession = await stripe.checkout.sessions.create({
            //quem esta comprando no stripe
            customer: customerId,
            //metodos de pagamento da app
            payment_method_types: ['card'],
            billing_address_collection: 'required',
            //produto
            line_items: [
                {price: 'price_1KgpodGTTNnucwVNoQosbcZj', quantity: 1 }
            ],
            //inscricao
            mode: 'subscription',
            //cupons de desconto
            allow_promotion_codes: true,
            //redirect para  a aplicação
            success_url: process.env.STRIPE_SUCCESS_URL,
            //cancela a req
            cancel_url: process.env.STRIPE_CANCEL_URL
        })

        return res.status(200).json({sessionId: stripeCheckoutSession.id})
    } else {
        //aceita post
        res.setHeader('Allow', 'POST')
        //405, metodo n permitido
        res.status(405).end('Method not allowed')
    }
}