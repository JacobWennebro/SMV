import SpotifyWebApi from "spotify-web-api-node";
import { SpotifyTokenCallback } from "./types/Spotify";
import fetch from 'node-fetch';
import btoa from 'btoa';

let token = { 
    key: "", 
    needsRefresh: true 
};

/**
* Get client's API token from Spotify.
*/
export async function getToken() {
    if (token.needsRefresh) {

        const res: SpotifyTokenCallback = await fetch(`https://accounts.spotify.com/api/token`, {
            body: "grant_type=client_credentials",
            headers: {
                Authorization: `Basic ${btoa(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`)}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST"
        }).then(res => res.json())

        token.key = res.access_token;

        token.needsRefresh = false;
        setTimeout(() => { token.needsRefresh = true }, res.expires_in * 1000);

        return token.key;
    } else return token.key;
}