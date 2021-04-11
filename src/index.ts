import SpotifyWebApiNode from "spotify-web-api-node";
import SoundcloudAPI from "soundcloud.ts"
import Express from 'express';
import UpdatePlaylist from "./updaters/playlist";
import UpdateArtists from "./updaters/artists";
import path from 'path';
import Color from 'colors';
import fs from 'fs';
import config from './config.json'
import { getToken } from './Util'
import socket, { Socket } from 'socket.io'
import Stream from './Stream'

(async () => {
    // Make sure playlist is set.
    if(!config.playlist) {
        console.error(Color.red(`Please put a valid playlist in the config.json!`))
        process.exit(0)
    }

    const app = Express();

    const Spotify = new SpotifyWebApiNode({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET
    });

    const Soundcloud = new SoundcloudAPI(process.env.SOUNDCLOUD_CLIENT_ID);

    // Create structure folders if non existant
    if(!fs.existsSync(path.join(__dirname, "data"))) fs.mkdirSync(path.join(__dirname, "data"));

    Spotify.setAccessToken(await getToken());

    await UpdatePlaylist(Spotify, Soundcloud, config.playlist);
    await UpdateArtists(Spotify, Soundcloud);

    /* Updaters */
    setInterval(async () => {
        await UpdatePlaylist(Spotify, Soundcloud, config.playlist);
        await UpdateArtists(Spotify, Soundcloud);
        console.log("\nPerforming automatic refresh in " + Color.yellow(config.source_refresh_duration.toString()) + " minutes.");
    }, (1000*60) * Number(config.source_refresh_duration) || 60);

    app.use(async (req, res, next) => {
        Spotify.setAccessToken(await getToken());
        next();
    });

    app.get("/api/:endpoint", (req, res) => {
        switch(req.params.endpoint) {
            case "artists":
                return res.sendFile(path.join(__dirname, "./data/artists.json"));
            case "playlist":
                return res.sendFile(path.join(__dirname, "./data/music.json"));
            default:
                return res.send("unknown api endpoint");
        }
    });

    app.use("/widget", Express.static("widgets"));
    app.use("/stream", Express.static(path.join(__dirname, "data/music")));

    const port = Number(process.env.PORT) || Number(config.server_port) || 3000;

    const server = app.listen(port, () => {
        console.log("\nServer is now listening on port " + Color.yellow(port.toString()));
        console.log("Link: " + Color.green("http://localhost:3000/widget/music.html"));
        console.log("Performing automatic refresh in " + Color.yellow(config.source_refresh_duration.toString()) + " minutes.");
    });

    // @ts-ignore
    const io = socket(server);
    const stream = new Stream();

    io.on("connection", (socket: Socket) => {
        console.log("Made socket connection " + Color.yellow(socket.id));
        socket.on("play", () => socket.emit("play", stream.next()));
    });

})();