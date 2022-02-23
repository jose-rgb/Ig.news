import { query as q } from "faunadb";
import NextAuth from "next-auth"
import GithubProvider from "next-auth/providers/github"

import { fauna } from "../../../services/fauna";

export default NextAuth({

  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      authorization: {
          params: {
              //tipo de autorização do github
              scope: 'read:user',
          }
      }
    }),
  ],

  callbacks: {
    async signIn({user, account, profile}){
      const { email } = user

      //try para retornar se login deu certo
      try {
        //FQL
        await fauna.query(
          //se user n existe 
          q.If(
            q.Not(
              q.Exists(
                q.Match(
                  q.Index('user_by_email'),
                  q.Casefold(user.email)
                )
              )
            ),
            //criar
            q.Create(
              q.Collection('users'),
              { data: { email } }
            ),
            // se ele existe, buscar 
            q.Get(
              q.Match(
                q.Index('user_by_email'),
                q.Casefold(user.email)
              )
            )
          )
        )
        return true
      } catch {
        return false
      } 
    }
  }
})