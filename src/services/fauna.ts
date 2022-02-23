import { Client } from 'faunadb';

export const fauna = new Client({
    secret: process.env.FAUNADB_KEY,
    // config usa
    domain: 'db.us.fauna.com',
})