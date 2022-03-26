import { query  as q} from "faunadb";
import { fauna } from "../../../services/fauna";
import { stripe } from "../../../services/stripe";

export async function saveSubscription( 
    subscriptionId: string,
    customerId: string,
    //param, e uma acao de criacao ou n(pode ser outro tipo de event)
    createAction = false,
) {
    //buscar user no fauna pelo customerId
    const useRef = await fauna.query(
        //selecionar apenas o campo ref 
        q.Select(
            "ref",
            //user que o id e igual ao customerId
            q.Get(
                q.Match(
                    q.Index('user_by_stripe_customer_id'),
                    customerId
                )
            )
        )
    )
    
    //buscar subscription pela subscriptionId
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    //dados relevantes da subscription
    const subscriptionData = {
        id: subscription.id,
        userId: useRef,
        status: subscription.status,
        price_id: subscription.items.data[0].price.id
    }
    
    if (createAction) {
        //e uma criacao de subscription
        //salvar subscription no fauna
        await fauna.query(
            q.Create(
                q.Collection('subscriptions'),
                { data: subscriptionData }
            )   
        )

    } else {
        // se n e uma criacao, apenas uma notificacao do stripe
        //atualizar no fauna os dados que foram notificados
        await fauna.query(
            q.Replace(
                q.Select(
                    "ref", 
                    q.Get(
                        q.Match(
                            q.Index('subscription_by_id'),
                            subscriptionId,
                        )
                    )
                ),
                //dados a atualizar
                { data: subscriptionData }
            )
        )

    }

}