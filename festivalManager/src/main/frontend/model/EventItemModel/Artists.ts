export interface Artists {
  eventId: string;
  operation: "artists";
  artists: Artist[];
  data: {
    artistsData: {
      quantity: number;
    };
  };
}

export interface Artist {
  headliner: boolean;
  genre: string;
  artistName: string;
}
