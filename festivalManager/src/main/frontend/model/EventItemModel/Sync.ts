export interface Sync {
  eventId: string;
  operation: "sync";
  data: {
      timestamps: Timestamps;
  };
}

/* Timestamps are in ISO 8601 format */
export interface Timestamps {
  core: string;
  bundles: string;
  artists: string;
  statistics: string;
  // For individual bundles and invitations items
  [key: string]: string;
}
