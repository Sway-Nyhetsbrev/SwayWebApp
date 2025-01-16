import { ThemeColors } from "./themecolor";

export interface newsletter {
    id: string;
    title: string;
    author?: string;
    createdAt?: Date;
    releaseDate: Date;
    userId: string;
    sections: newsletterSection[]
    theme?: ThemeColors;
}

export interface newsletterSection {
    content: string;
    newsletterSectionImages: newsletterSectionImages[]
}

export interface newsletterSectionImages {
    url: string;
    altText: string;
}
