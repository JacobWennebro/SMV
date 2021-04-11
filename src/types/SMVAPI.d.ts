export interface ISong {
    title: string
    artists: IArtist[]
    cover: string
    id: string
    type: string
    duration: number
};

export interface IArtist {
    name: string
    id: string
    url: string
    image_url?: string
    genres?: string[]
}