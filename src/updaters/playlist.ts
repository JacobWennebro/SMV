import YTDL from 'ytdl-core';
import YTS from 'yt-search';
import fs from 'fs';
import path from 'path';
import SpotifyWebApi from 'spotify-web-api-node';
import Color from 'colors'
import { ISong } from '../types/SMVAPI'
import Soundcloud from 'soundcloud.ts';
import moment from 'moment'

export default async (Spotify: SpotifyWebApi, Soundcloud: Soundcloud, id: string) => {
    const spotify_playlist = await Spotify.getPlaylist(id);
    const soundcloud_playlist = await Soundcloud.playlists.getV2("https://soundcloud.com/user-370661941/sets/stream");
    const songs: ISong[] = [];

    if(!fs.existsSync(path.join(__dirname, "../data/music"))) fs.mkdirSync(path.join(__dirname, "../data/music"));

    console.log(Color.bold("\nVerifying song sources:\n"));

    /*
        handling Spotify playlist
    */

    for (const item of spotify_playlist.body.tracks.items) {
        const track = item.track;
        const search = `${track.artists[0].name} - ${track.name}`

        songs.push({
            title: track.name,
            artists: track.artists.map((artist) => JSON.parse(`{ "name": "${artist.name}", "id": "${artist.id}", "url": "${artist.external_urls.spotify}" }`)),
            cover: track.album.images[0].url,
            id: track.id,
            type:"spotify",
            duration: track.duration_ms
        });

        if (fs.readdirSync(path.join(__dirname, "../data/music")).includes(`${track.id}.mp3`)) {
            console.log(`Skipping ${Color.green(track.name)}.`);
            continue;
        }

        const results = await YTS(search);
        const video = results.videos[0];
        
        try {
            YTDL(video.url, { filter: "audioonly", highWaterMark: 810241024 })
            .pipe(fs.createWriteStream(path.join(__dirname, `../data/music/${track.id}.mp3`)));
        } catch(e) {
            console.log(`Failed to load ${Color.green(track.name)}, skipping`);
            continue;
        }

        console.log("Adding " + Color.green(track.name));

    }

    for (const track of soundcloud_playlist.tracks) {
        if(!track.user) continue;

        songs.push({
            title: track.title,
            artists: [ {
                name: track.user.username,
                id: track.user.id.toString(),
                url: track.user.permalink_url,
            } ],
            cover: track.artwork_url,
            id: track.id.toString(),
            type: "soundcloud",
            duration: track.duration
        });

        if (fs.readdirSync(path.join(__dirname, "../data/music")).includes(`${track.id}.mp3`)) {
            console.log(`Skipping ${Color.green(track.title)}.`);
            continue;
        }

        const file = await Soundcloud.util.streamTrack(track);
        file.pipe(fs.createWriteStream(`${process.env.NODE_ENV === "production" ? "dist" : "src"}/data/music/${track.id}.mp3`));

        console.log("Adding " + Color.green(track.title));
    }

    /* Cleanup loop */
    for(const file of fs.readdirSync(path.join(__dirname, "../data/music"))) {
        if(songs.filter(s => s.id === file.substr(0, file.length-4)).length <= 0) {
            fs.unlinkSync(path.join(__dirname, `../data/music/${file}`));
            console.log(`Removing ${Color.blue(file)}.`);
        }
    }

    let duration = 0;
    songs.map(s => duration += s.duration);
    const time = moment.duration(duration);
    console.log(Color.cyan(`\nEstimated playlist duration is ${time.hours()} hours and ${time.minutes()} minutes.`));

    fs.writeFileSync(path.join(__dirname, "../data/music.json"), JSON.stringify({
        lastUpdated: new Date(),
        songs
    }, null, 4));
}