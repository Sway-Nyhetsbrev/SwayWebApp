export interface newsletter {
    id: string;
    title: string;
    description?: string;
    author?: string;
    createdAt?: Date;
    userId: string;
    sections: newsletterSection[]
}

export interface newsletterSection {
    header: string;
    content: string;
    newsletterSectionImages: newsletterSectionImages[]
}

export interface newsletterSectionImages {
    url: string;
    alt: string;
}