import { ThemeColors } from "./themecolor";

export interface newsletter {
    id: string;
    title: string;
    author?: string;
    createdAt?: Date;
    releaseDate: string | Date;
    userId: string;
    sections: newsletterSection[];
    theme?: ThemeColors;
}

export interface newsletterSection {
    content: string;
    newsletterSectionImages: newsletterSectionImages[];
    newsletterSectionVideos?: newsletterSectionVideos[];
}

export interface newsletterSectionImages {
    url: string;
    altText: string;
}

export interface newsletterSectionVideos {
    url: string; 
    title?: string 
    thumbnail?: string;
}
