import fs from 'fs';
import musicDuration from 'music-duration'
import { ISong } from './types/SMVAPI'
import path from 'path'
import socket, { Socket } from 'socket.io'

function shuffle(a: ISong[]) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export default class Stream {
    private queue = shuffle(require("./data/music.json").songs as ISong[]);
    private q = 0;

    next() {
        if(this.q >= this.queue.length) {
            this.queue = shuffle(require("./data/music.json").songs as ISong[]);
            this.q = 0;
        }

        this.q++;
        return this.queue[this.q-1];
    }

    getArtists() {
        return this.queue[this.q].artists;
    }
}