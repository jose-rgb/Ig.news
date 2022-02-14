import styles from './styles.module.scss';
import { FaGithub } from 'react-icons/fa'
import { FiX } from 'react-icons/fi'
import { signIn, useSession, signOut } from 'next-auth/react'

export function SignInButton () {
    //retorna a sessão do user
    const { data: session } =useSession()

    //se user estiver logado
    return session ? (
        //retornar esse button
        <button type="button" className={styles.signInButton} onClick={() => signOut()}>
            <FaGithub color="#04d361" />
            {session.user.name}
            <FiX color="#737380" className={styles.closeIcon}/>
        </button>
        
    ) : (
        //se n estiver, retornar esse
        <button type="button" className={styles.signInButton} onClick={()=> signIn('github')}>
            <FaGithub color="#eba417" />
            Sign in with GitHub
        </button>
       
    );
}