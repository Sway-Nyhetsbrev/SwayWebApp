export interface newsletter {
    id: string;
    title: string;
    author?: string;
    createdAt?: Date;
    releaseDate: Date;
    userId: string;
    sections: newsletterSection[]
}

export interface newsletterSection {
    content: string;
    newsletterSectionImages: newsletterSectionImages[]
}

export interface newsletterSectionImages {
    url: string;
    alt: string;
}