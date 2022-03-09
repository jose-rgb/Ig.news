import { useSession, signIn } from 'next-auth/react';
import { api } from '../../services/api';
import { getStripeJs } from '../../services/stripe-js';
import styles from './styles.module.scss';

interface SubscribeButtonProps {
    priceId: string;
}

export function SubscribeButton({priceId}: SubscribeButtonProps) {
    //sessao do user
    const { data: session } =useSession()

    async function handleSubscribe() {
        //se n estiver autenticado(sessao = false)
        if (!session) {
            //redirecionar para autenticação
            signIn('github')
            return;
        }

        //criar checkout session no stripe com o pages/api/subscribe.ts
        try {
            //fazendo req a api route
            const response = await api.post('/subscribe')

            const { sessionId } = response.data;

            const stripe = await getStripeJs()

            //redirect user para checkout passando sessionId
            await stripe.redirectToCheckout({sessionId})
        } catch (err){
            console.log(err)
            alert(err.message);
        }

    }

    return(
        <button type="button" className={styles.subscribeButton} onClick={handleSubscribe}>
            Subscribe now
        </button>
    );
}