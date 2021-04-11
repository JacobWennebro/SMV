import SpotifyWebApi from 'spotify-web-api-node';
import { IArtist, ISong } from '../types/SMVAPI'
import fs from 'fs'
import path from 'path'
import Color from 'colors'
import Soundcloud, { SoundcloudUserV2 } from 'soundcloud.ts';

export default async (Spotify: SpotifyWebApi, Soundcloud: Soundcloud) => {

    console.log(Color.cyan("\nFetching artists data ..."))

    const playlistData = require("../data/music.json");
    const registeredArtists: string[] = [];
    const jsonOutput: IArtist[] = [];

    for(let i=0; i < playlistData.songs.length; i++) {
        const song: ISong = playlistData.songs[i];
        for(const artist of song.artists) {
            if(registeredArtists.includes(artist.id)) continue;
            registeredArtists.push(artist.id);

            let artistData: SoundcloudUserV2 | any;

            try {
                artistData = await Spotify.getArtist(artist.id);
            } catch(e) {}

            try {
                artistData = await Soundcloud.users.getV2(artist.id);
            } catch(e) {}

            // @ts-ignore
            if(!artistData || song.type === "spotify" && !artistData.body.images[0]) continue;

            jsonOutput.push({
                ...artist,
                image_url: artistData.body ? artistData.body.images[0].url : artistData.avatar_url,
                genres: artistData.body ? artistData.body.genres : []
            });
        } 
    }

    fs.writeFileSync(path.join(__dirname, "../data/artists.json"), JSON.stringify(jsonOutput, null, 4));
}
